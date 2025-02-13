'use server';

import connectDB from '../lib/mongodb';
import UserModel from '../models/User';
import VoteModel from '../models/Vote';
import LogoModel from '../models/Logo';
import { resolveVoteConflict, validateUserVotes, validateLogoVotes } from '../lib/dataConsistency';
import mongoose from 'mongoose';
import { logoStatsCache, userVotesCache, voteHistoryCache, CACHE_KEYS } from '@/lib/cache';
import { withRetry } from '@/lib/utils';
import { DB_CONSTANTS } from '@/constants/db';

// Helper function to convert Mongoose document to plain object
function toPlainObject(doc: any) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

export async function createUser(name: string) {
  try {
    await connectDB();
    const userId = name.toLowerCase().replace(/\s+/g, '-');

    const user = new UserModel({
      name,
      userId,
      voteCount: 0,
      votedLogos: [],
    });

    const result = await user.save();
    return toPlainObject(result);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUser(userId: string) {
  try {
    await connectDB();
    const user = await UserModel.findByUserId(userId);
    return toPlainObject(user);
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

export async function submitVote(voteData: { userId: string; logoId: string; ownerId?: string }) {
  return withRetry(async () => {
    let session;
    try {
      await connectDB();
      session = await mongoose.startSession();
      session.startTransaction();

      let user = await UserModel.findByUserId(voteData.userId).session(session);
      if (!user) {
        user = await createUser(voteData.userId);
        user = await UserModel.findByUserId(voteData.userId).session(session);
      }

      if (!user) {
        throw new Error('Failed to create or find user');
      }

      if (!user.canVote(voteData.logoId)) {
        throw new Error('already-voted');
      }

      if (voteData.ownerId === user.userId) {
        throw new Error('You cannot vote for your own logo');
      }

      const vote = new VoteModel({
        userId: user.userId,
        logoId: voteData.logoId,
        timestamp: new Date(),
        ownerId: voteData.ownerId,
        status: DB_CONSTANTS.VOTE_STATUS.PENDING,
      });

      const resolved = await resolveVoteConflict(vote);
      if (!resolved) {
        console.error('Vote conflict resolution failed for:', {
          userId: voteData.userId,
          logoId: voteData.logoId,
        });
        throw new Error('Failed to resolve vote conflict');
      }

      if (vote.status === DB_CONSTANTS.VOTE_STATUS.CONFIRMED) {
        await vote.save({ session });

        await UserModel.findOneAndUpdate(
          { userId: user.userId },
          {
            $addToSet: { votedLogos: voteData.logoId },
            $inc: { voteCount: 1 },
          },
          { session, new: true }
        );

        await LogoModel.findOneAndUpdate(
          { value: voteData.logoId },
          {
            $inc: {
              'voteStats.totalVotes': 1,
              'voteStats.uniqueVoters': 1,
            },
            $set: {
              'voteStats.lastVoteAt': vote.timestamp,
            },
          },
          { session, new: true }
        );

        // Clear relevant caches
        userVotesCache.delete(CACHE_KEYS.USER_VOTES(user.userId));
        logoStatsCache.delete(CACHE_KEYS.LOGO_STATS(voteData.logoId));
        logoStatsCache.delete(CACHE_KEYS.ALL_LOGO_STATS);
        voteHistoryCache.delete(CACHE_KEYS.VOTE_HISTORY);
      } else {
        await vote.save({ session });
      }

      await session.commitTransaction();
      return toPlainObject(vote);
    } catch (error) {
      console.error('Vote processing error:', error);
      if (session?.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  });
}

export async function getUserVotes(userId: string) {
  try {
    // Check cache first
    const cached = userVotesCache.get(CACHE_KEYS.USER_VOTES(userId));
    if (cached) {
      console.log('Returning cached user votes for:', userId);
      return cached;
    }

    await connectDB();
    const votes = await VoteModel.findUserVotes(userId);
    const result = toPlainObject(votes);

    // Cache the result
    userVotesCache.set(CACHE_KEYS.USER_VOTES(userId), result);
    return result;
  } catch (error) {
    console.error('Error getting user votes:', error);
    throw error;
  }
}

export async function getVoteHistory(limit = 10) {
  try {
    // Check cache first
    const cached = voteHistoryCache.get(CACHE_KEYS.VOTE_HISTORY);
    if (cached) {
      console.log('Returning cached vote history');
      return cached;
    }

    await connectDB();
    const votes = await VoteModel.find({ status: DB_CONSTANTS.VOTE_STATUS.CONFIRMED })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .populate('logoId', 'value')
      .lean();

    const result = toPlainObject(votes);

    // Cache the result
    voteHistoryCache.set(CACHE_KEYS.VOTE_HISTORY, result);
    return result;
  } catch (error) {
    console.error('Error getting vote history:', error);
    throw error;
  }
}

export async function getLogoStats(logoId: string) {
  try {
    // Check cache first
    const cached = logoStatsCache.get(CACHE_KEYS.LOGO_STATS(logoId));
    if (cached) {
      console.log('Returning cached logo stats for:', logoId);
      return cached;
    }

    await connectDB();
    const stats = await VoteModel.getVoteStats(logoId);
    const result = toPlainObject(stats[0] || { totalVotes: 0, uniqueVoters: 0 });

    // Cache the result
    logoStatsCache.set(CACHE_KEYS.LOGO_STATS(logoId), result);
    return result;
  } catch (error) {
    console.error('Error getting logo stats:', error);
    throw error;
  }
}

export async function getAllLogoStats() {
  try {
    // Check cache first
    const cached = logoStatsCache.get(CACHE_KEYS.ALL_LOGO_STATS);
    if (cached) {
      console.log('Returning cached all logo stats');
      return cached;
    }

    await connectDB();
    const logos = await LogoModel.find({ status: 'active' }).lean();
    const stats = await Promise.all(
      logos.map(async (logo) => {
        const logoStats = await getLogoStats(logo.value);
        return {
          logoId: logo.value,
          ...logoStats,
        };
      })
    );

    const result = toPlainObject(stats);

    // Cache the result
    logoStatsCache.set(CACHE_KEYS.ALL_LOGO_STATS, result);
    return result;
  } catch (error) {
    console.error('Error getting all logo stats:', error);
    throw error;
  }
}
