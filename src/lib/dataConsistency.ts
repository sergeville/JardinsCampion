import mongoose, { Document } from 'mongoose';
import User from '@/models/User';
import Vote, { IVote } from '@/models/Vote';
import Logo from '@/models/Logo';
import { DB_CONSTANTS } from '@/constants/db';
import { DuplicateVoteError, InvalidVoteError, TransactionError } from './errors';
import { withRetry, validateVoteData, queryOptions } from './utils';

interface VoteSubmissionResult {
  status: 'confirmed' | 'rejected';
  conflictResolution?: {
    originalVote: string;
    resolutionType: 'reject';
    resolvedAt: Date;
  };
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

interface VoteConflictResolution {
  resolved: boolean;
  action?: 'override' | 'merge' | 'reject';
  originalVote?: IVote;
}

export function validateUserVotes(votes: IVote[]): ValidationResult {
  if (!votes.length) {
    return { valid: true };
  }

  // Check for duplicate votes
  const uniqueLogos = new Set(votes.map((vote) => vote.logoId));
  if (uniqueLogos.size !== votes.length) {
    return {
      valid: false,
      reason: 'User has duplicate votes for the same logo',
    };
  }

  // Check vote status
  const invalidVotes = votes.filter(
    (vote) => vote.status !== DB_CONSTANTS.VOTE_STATUS.CONFIRMED
  );
  if (invalidVotes.length > 0) {
    return {
      valid: false,
      reason: 'User has votes with invalid status',
    };
  }

  return { valid: true };
}

export function validateLogoVotes(votes: IVote[]): ValidationResult {
  if (!votes.length) {
    return { valid: true };
  }

  // Check for duplicate votes from the same user
  const userVotes = new Map<string, IVote[]>();
  votes.forEach((vote) => {
    if (!userVotes.has(vote.userId)) {
      userVotes.set(vote.userId, []);
    }
    userVotes.get(vote.userId)!.push(vote);
  });

  for (const [userId, userVotes] of userVotes.entries()) {
    if (userVotes.length > 1) {
      return {
        valid: false,
        reason: `User ${userId} has multiple votes for this logo`,
      };
    }
  }

  // Check vote status
  const invalidVotes = votes.filter(
    (vote) => vote.status !== DB_CONSTANTS.VOTE_STATUS.CONFIRMED
  );
  if (invalidVotes.length > 0) {
    return {
      valid: false,
      reason: 'Logo has votes with invalid status',
    };
  }

  return { valid: true };
}

export async function resolveVoteConflict(
  vote: Document<unknown, object, IVote> & IVote
): Promise<VoteConflictResolution> {
  // Check for existing votes from the same user for the same logo
  const existingVote = await vote.model('Vote').findOne({
    userId: vote.userId,
    logoId: vote.logoId,
    _id: { $ne: vote._id },
    status: DB_CONSTANTS.VOTE_STATUS.CONFIRMED,
  });

  if (!existingVote) {
    return { resolved: true };
  }

  // If there's an existing vote, we need to handle the conflict
  if (vote.ownerId === existingVote.ownerId) {
    // If voting for the same owner's logo, reject the new vote
    return {
      resolved: true,
      action: 'reject',
      originalVote: existingVote,
    };
  }

  // If voting for a different owner's logo, override the old vote
  return {
    resolved: true,
    action: 'override',
    originalVote: existingVote,
  };
}

export async function validateAllData(): Promise<{
  users: number;
  votes: number;
  logos: number;
}> {
  const users = await User.find();
  const votes = await Vote.find({ status: 'confirmed' });
  const logos = await Logo.find({ status: 'active' });

  let updatedUsers = 0;
  let updatedVotes = 0;
  let updatedLogos = 0;

  // Validate users
  for (const user of users) {
    if (await validateUserVotes(votes).valid) {
      updatedUsers++;
    }
  }

  // Validate logos
  for (const logo of logos) {
    if (await validateLogoVotes(votes).valid) {
      updatedLogos++;
    }
  }

  // Validate votes
  for (const vote of votes) {
    const user = await User.findByUserId(vote.userId);
    const logo = await Logo.findActiveLogo(vote.logoId);

    if (!user || !logo) {
      // Orphaned vote - mark as rejected
      vote.status = 'rejected';
      await vote.save();
      updatedVotes++;
    }
  }

  return {
    users: updatedUsers,
    votes: updatedVotes,
    logos: updatedLogos,
  };
}

export async function runPeriodicValidation(): Promise<void> {
  try {
    const results = await validateAllData();
    console.log('Periodic validation completed:', results);
  } catch (error) {
    console.error('Periodic validation failed:', error);
  }
}

export async function resolveVoteConflictWithRetry(
  vote: Document<unknown, object, IVote> & IVote
): Promise<boolean> {
  let retries = 3;
  while (retries > 0) {
    try {
      const result = await resolveVoteConflict(vote);
      if (result.resolved) return true;
      retries--;
    } catch (error) {
      console.error(`Vote conflict resolution failed, retries left: ${retries}`, error);
      retries--;
      if (retries === 0) return false;
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
    }
  }
  return false;
}

export async function submitVote(
  userId: string,
  logoId: string,
  ownerId: string
): Promise<VoteSubmissionResult> {
  if (!validateVoteData({ userId, logoId, ownerId })) {
    throw new InvalidVoteError('Invalid vote data', { userId, logoId, ownerId });
  }

  return withRetry(async () => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Create and save the vote
      const vote = new Vote({
        userId,
        logoId,
        ownerId,
        status: DB_CONSTANTS.VOTE_STATUS.PENDING,
        timestamp: new Date(),
      });
      await vote.save({ session });

      // Check for existing votes by this user for this logo
      const existingVote = await Vote.findOne(
        {
          userId,
          logoId,
          status: DB_CONSTANTS.VOTE_STATUS.CONFIRMED,
          _id: { $ne: vote._id },
        },
        null,
        { ...queryOptions, session }
      );

      if (existingVote) {
        // Reject the vote if there's already a confirmed vote
        vote.status = DB_CONSTANTS.VOTE_STATUS.REJECTED;
        vote.conflictResolution = {
          originalVote: existingVote._id?.toString() || 'unknown',
          resolutionType: DB_CONSTANTS.RESOLUTION_TYPE.REJECT,
          resolvedAt: new Date(),
        };
        await vote.save({ session });

        await session.commitTransaction();
        throw new DuplicateVoteError(userId, logoId, existingVote._id?.toString() || 'unknown');
      }

      // Confirm the vote and update user and logo stats
      vote.status = DB_CONSTANTS.VOTE_STATUS.CONFIRMED;
      await vote.save({ session });

      // Update user's voted logos and vote count
      await User.findOneAndUpdate(
        { userId },
        {
          $addToSet: { votedLogos: logoId },
          $inc: { voteCount: 1 },
        },
        { session }
      );

      // Update logo's vote stats
      await Logo.findOneAndUpdate(
        { value: logoId },
        {
          $inc: {
            'voteStats.totalVotes': 1,
            'voteStats.uniqueVoters': 1,
          },
          $set: {
            'voteStats.lastVoteAt': vote.timestamp,
          },
        },
        { session }
      );

      await session.commitTransaction();
      return { status: DB_CONSTANTS.VOTE_STATUS.CONFIRMED };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      if (error instanceof DuplicateVoteError) {
        return {
          status: DB_CONSTANTS.VOTE_STATUS.REJECTED,
          conflictResolution: {
            originalVote: error.details.originalVoteId,
            resolutionType: DB_CONSTANTS.RESOLUTION_TYPE.REJECT,
            resolvedAt: new Date(),
          },
        };
      }
      throw new TransactionError('Vote submission failed', { cause: error });
    } finally {
      await session.endSession();
    }
  });
}
