import mongoose, { Document } from 'mongoose';
import User from '@/models/User';
import Vote, { IVote } from '@/models/Vote';
import Logo from '@/models/Logo';
import { DB_CONSTANTS } from '@/constants/db';
import { DuplicateVoteError, InvalidVoteError, TransactionError } from './errors';
import { withRetry, validateVoteData, queryOptions } from './utils';
import { ValidationError, ErrorSeverity, ErrorCategory } from '@/lib/errors/types';

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
  const invalidVotes = votes.filter((vote) => vote.status !== DB_CONSTANTS.VOTE_STATUS.CONFIRMED);
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
  const userVotesMap = new Map<string, IVote[]>();
  votes.forEach((vote) => {
    if (!userVotesMap.has(vote.userId)) {
      userVotesMap.set(vote.userId, []);
    }
    userVotesMap.get(vote.userId)!.push(vote);
  });

  const userVoteEntries = Array.from(userVotesMap.entries());
  for (const [userId, votes] of userVoteEntries) {
    if (votes.length > 1) {
      return {
        valid: false,
        reason: `User ${userId} has multiple votes for this logo`,
      };
    }
  }

  // Check vote status
  const invalidVotes = votes.filter((vote) => vote.status !== DB_CONSTANTS.VOTE_STATUS.CONFIRMED);
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
  const existingVote = (await Vote.findOne({
    userId: vote.userId,
    logoId: vote.logoId,
    _id: { $ne: vote._id },
    status: DB_CONSTANTS.VOTE_STATUS.CONFIRMED,
  }).lean()) as IVote;

  if (!existingVote) {
    return { resolved: true };
  }

  // If there's an existing vote, reject the new vote
  return {
    resolved: true,
    action: 'reject',
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

export async function submitVote(userId: string, logoId: string): Promise<VoteSubmissionResult> {
  if (!validateVoteData({ userId, logoId })) {
    throw new ValidationError('Invalid vote data', {
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.VALIDATION,
      recoverable: true,
      userMessage: `Invalid vote data: userId=${userId}, logoId=${logoId}`,
      icon: '⚠️',
    });
  }

  return withRetry(async () => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Create and save the vote
      const vote = new Vote({
        userId,
        logoId,
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
        throw new ValidationError('Duplicate vote', {
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.VALIDATION,
          recoverable: true,
          userMessage: `User ${userId} has already voted for logo ${logoId}`,
          icon: '⚠️',
        });
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
      return {
        status: 'confirmed',
      };
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof ValidationError) {
        return {
          status: 'rejected',
          conflictResolution: {
            originalVote: error.metadata.userMessage || 'unknown',
            resolutionType: 'reject',
            resolvedAt: new Date(),
          },
        };
      }
      throw error;
    } finally {
      session.endSession();
    }
  });
}
