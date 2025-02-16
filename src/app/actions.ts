'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '../lib/mongodb';
import UserModel, { IUser } from '../models/User';
import VoteModel, { IVote } from '../models/Vote';
import LogoModel from '../models/Logo';
import { resolveVoteConflict } from '../lib/dataConsistency';
import mongoose from 'mongoose';
import { logoStatsCache, userVotesCache, voteHistoryCache, CACHE_KEYS } from '@/lib/cache';
import { withRetry } from '@/lib/utils';
import { DB_CONSTANTS } from '@/constants/db';

interface LogoStats {
  voteCount: number;
}

// Helper function to convert Mongoose document to plain object
function toPlainObject<T>(doc: T | T[] | null): T | T[] | null {
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

    return await user.save();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUser(userId: string) {
  try {
    await connectDB();
    const user = await UserModel.findOne({ userId });
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

      let user = await UserModel.findOne({ userId: voteData.userId }).session(session);
      if (!user) {
        const newUser = await createUser(voteData.userId);
        user = await UserModel.findOne({ userId: voteData.userId }).session(session);
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
    if (result) {
      userVotesCache.set(CACHE_KEYS.USER_VOTES(userId), result as IVote[]);
    }
    return result;
  } catch (error) {
    console.error('Error getting user votes:', error);
    throw error;
  }
}

export async function getVoteHistory(limit = 10) {
  try {
    const cached = voteHistoryCache.get(CACHE_KEYS.VOTE_HISTORY);
    if (cached) {
      return cached as IVote[];
    }

    await connectDB();
    const votes = await VoteModel.find({ status: DB_CONSTANTS.VOTE_STATUS.CONFIRMED })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .populate('logoId', 'value')
      .lean();

    const result = (toPlainObject(votes) || []) as IVote[];
    voteHistoryCache.set(CACHE_KEYS.VOTE_HISTORY, result);
    return result;
  } catch (error) {
    console.error('Error getting vote history:', error);
    throw error;
  }
}

export async function getLogoStats(logoId: string): Promise<LogoStats> {
  try {
    const cached = logoStatsCache.get(CACHE_KEYS.LOGO_STATS(logoId));
    if (cached && !Array.isArray(cached) && 'voteCount' in cached) {
      console.log('Returning cached logo stats for:', logoId);
      return cached as LogoStats;
    }

    await connectDB();
    const stats = await VoteModel.getVoteStats(logoId);
    const defaultStats: LogoStats = { voteCount: 0 };
    const result = stats || defaultStats;

    logoStatsCache.set(CACHE_KEYS.LOGO_STATS(logoId), result);
    return result;
  } catch (error) {
    console.error('Error getting logo stats:', error);
    throw error;
  }
}

export async function getAllLogoStats(): Promise<(LogoStats & { logoId: string })[]> {
  try {
    const cached = logoStatsCache.get(CACHE_KEYS.ALL_LOGO_STATS);
    if (cached && Array.isArray(cached) && cached.every((item) => 'voteCount' in item)) {
      console.log('Returning cached all logo stats');
      return cached as (LogoStats & { logoId: string })[];
    }

    await connectDB();
    const logos = await LogoModel.find({ status: 'active' }).lean();
    const stats = await Promise.all(
      logos.map(async (logo) => {
        const logoStats = await getLogoStats(logo.id);
        return {
          ...logoStats,
          logoId: logo.id,
        };
      })
    );

    const result = stats;
    logoStatsCache.set(CACHE_KEYS.ALL_LOGO_STATS, result);
    return result;
  } catch (error) {
    console.error('Error getting all logo stats:', error);
    throw error;
  }
}
