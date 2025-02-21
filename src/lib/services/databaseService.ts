import { Model, Document, ClientSession } from 'mongoose';
import { connectDB, withRetry } from '@/lib/mongodb';
import UserModelSchema, { IUser } from '@/models/User';
import VoteModelSchema, { IVote } from '@/models/Vote';
import LogoModelSchema, { ILogo } from '@/models/Logo';
import type { VoteData, VoteStats, LogoStats } from '@/types/vote';
import { DatabaseError, ErrorCategory, ErrorSeverity } from '@/lib/errors/types';
import { withTransaction, TransactionError } from '@/lib/utils/transactionManager';
import { validateUserVotes, validateLogoVotes } from '@/lib/dataConsistency';
import { DatabaseDocument, DatabaseInfo, DatabaseStats } from '@/types/database';
import { resolveVoteConflict } from '../dataConsistency';
import mongoose from 'mongoose';
import { InvalidVoteError, DuplicateVoteError } from '@/lib/errors';
import { DB_CONSTANTS } from '@/constants/db';
import { withNetwork } from '@/lib/utils/networkManager';
import { DatabaseCollections } from '@/types/database';

type CollectionName = 'users' | 'votes' | 'logos';

type CollectionToType = {
  users: IUser;
  votes: IVote;
  logos: ILogo;
};

type CollectionModels = {
  [K in CollectionName]: Model<CollectionToType[K]>;
};

const collections: CollectionModels = {
  users: UserModelSchema,
  votes: VoteModelSchema,
  logos: LogoModelSchema,
};

interface Models {
  User: mongoose.Model<IUser>;
  Vote: mongoose.Model<IVote>;
  Logo: mongoose.Model<ILogo>;
}

let UserModel: mongoose.Model<IUser>;
let VoteModel: mongoose.Model<IVote>;
let LogoModel: mongoose.Model<ILogo>;

async function getModels(): Promise<Models> {
  if (!UserModel || !VoteModel || !LogoModel) {
    const db = await connectDB();
    UserModel = mongoose.models.User || mongoose.model('User', UserModelSchema.schema);
    VoteModel = mongoose.models.Vote || mongoose.model('Vote', VoteModelSchema.schema);
    LogoModel = mongoose.models.Logo || mongoose.model('Logo', LogoModelSchema.schema);
  }
  return { User: UserModel, Vote: VoteModel, Logo: LogoModel };
}

interface DatabaseLog {
  timestamp: string;
  operation: string;
  collection?: string;
  details?: string;
  success: boolean;
  error?: string;
}

export class DatabaseService {
  private static logs: DatabaseLog[] = [];

  static addLog(log: Omit<DatabaseLog, 'timestamp'>) {
    const timestamp = new Date().toISOString();
    this.logs.push({
      timestamp,
      ...log,
    });

    // Keep only the last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  static async getLogs(): Promise<DatabaseLog[]> {
    return this.logs;
  }

  static async connect(): Promise<void> {
    try {
      this.addLog({
        operation: 'connect',
        details: 'Attempting to connect to database',
        success: true,
      });
      await connectDB();
      await getModels();
      this.addLog({
        operation: 'connect',
        details: 'Connected successfully',
        success: true,
      });
    } catch (error) {
      this.addLog({
        operation: 'connect',
        details: 'Connection failed',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async createUser(name: string): Promise<IUser> {
    console.log('DatabaseService: Creating user:', name);
    await this.connect();

    try {
      const userId = name.toLowerCase().replace(/\s+/g, '-');

      const user = new UserModel({
        name,
        userId,
        voteCount: 0,
        votedLogos: [],
      });

      await user.save();
      console.log('DatabaseService: User created:', user);
      return user;
    } catch (error) {
      console.error('DatabaseService: Error creating user:', error);
      throw error;
    }
  }

  static async getUser(userId: string): Promise<IUser | null> {
    console.log('DatabaseService: Getting user:', userId);
    await this.connect();
    const user = await UserModel.findOne({ userId });
    console.log('DatabaseService: User found:', user);
    return user;
  }

  static async submitVote(voteData: VoteData): Promise<IVote> {
    try {
      this.addLog({
        operation: 'submitVote',
        collection: 'votes',
        details: `User ${voteData.userId} voting for logo ${voteData.logoId}`,
        success: true,
      });
      const startTime = performance.now();
      console.log(
        'DatabaseService: Starting vote submission process:',
        JSON.stringify(voteData, null, 2)
      );

      await this.connect();
      console.log('DatabaseService: Connected to database, checking for existing vote');

      // Check if user has already voted for this logo
      const existingVote = await VoteModel.findOne({
        userId: voteData.userId,
        logoId: voteData.logoId,
      });

      if (existingVote) {
        throw new Error('User has already voted for this logo');
      }

      console.log('DatabaseService: No existing vote found, proceeding with submission');
      console.log('Starting transaction attempt 1/3');

      // Start a transaction
      const session = await mongoose.startSession();
      session.startTransaction();
      console.log('DatabaseService: Starting vote transaction');

      try {
        // Create the vote
        const vote = await VoteModel.create(
          [
            {
              ...voteData,
              status: 'confirmed',
              version: 1,
            },
          ],
          { session }
        );

        console.log('DatabaseService: Vote created in transaction:', {
          voteId: vote[0]._id,
          status: vote[0].status,
        });

        // Update user's vote count and voted logos
        const updateResult = await UserModel.updateOne(
          { userId: voteData.userId },
          {
            $inc: { voteCount: 1 },
            $push: { votedLogos: voteData.logoId },
          },
          { session }
        );

        console.log('DatabaseService: Updated user vote count and voted logos:', {
          userId: voteData.userId,
          voteCount: updateResult.modifiedCount,
        });

        console.log('Committing transaction...');
        await session.commitTransaction();
        console.log('Transaction committed successfully');

        console.log('DatabaseService: Vote submission completed successfully:', {
          voteId: vote[0]._id,
          status: vote[0].status,
        });

        return vote[0];
      } catch (error) {
        console.error('DatabaseService: Error in transaction, rolling back:', error);
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      this.addLog({
        operation: 'submitVote',
        collection: 'votes',
        details: `Failed vote submission for user ${voteData.userId}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error('DatabaseService: Error submitting vote:', error);
      throw error;
    }
  }

  static async getUserVotes(userId: string) {
    const startTime = performance.now();
    console.log(`DatabaseService: Getting user votes: ${userId}`);

    try {
      await this.connect();
      const votes = await VoteModel.find({ userId }).lean();

      console.log('DatabaseService: Found votes:', JSON.stringify(votes, null, 2));
      return votes;
    } catch (error) {
      console.error('DatabaseService: Error getting user votes:', error);
      throw error;
    }
  }

  static async getVoteHistory(limit: number = 10) {
    const startTime = performance.now();
    console.log(`DatabaseService: Getting vote history, limit: ${limit}`);

    try {
      await this.connect();
      const votes = await VoteModel.find().sort({ timestamp: -1 }).limit(limit).lean();

      // Get unique user IDs from votes
      const userIds = Array.from(new Set(votes.map((vote) => vote.userId)));

      // Fetch users in a single query
      const users = await UserModel.find({ userId: { $in: userIds } }).lean();

      // Create a map of userId to user name for quick lookup
      const userMap = new Map(users.map((user) => [user.userId, user.name]));

      // Add user names to votes
      const votesWithNames = votes.map((vote) => ({
        ...vote,
        userName: userMap.get(vote.userId) || vote.userId,
      }));

      console.log('DatabaseService: Found votes:', JSON.stringify(votesWithNames, null, 2));
      return votesWithNames;
    } catch (error) {
      console.error('DatabaseService: Error getting vote history:', error);
      throw error;
    }
  }

  static async getLogoStats(logoId: string): Promise<VoteStats> {
    console.log('DatabaseService: Getting logo stats:', logoId);
    try {
      await this.connect();
      const stats = await VoteModel.aggregate([
        {
          $match: {
            logoId,
            status: 'confirmed',
          },
        },
        {
          $group: {
            _id: '$logoId',
            totalVotes: { $sum: 1 },
            uniqueVoters: { $addToSet: '$userId' },
            lastVoteAt: { $max: '$timestamp' },
          },
        },
        {
          $project: {
            _id: 0,
            totalVotes: 1,
            uniqueVoters: { $size: '$uniqueVoters' },
            lastVoteAt: 1,
          },
        },
      ]);
      console.log('DatabaseService: Logo stats:', stats);
      return stats[0] || { totalVotes: 0, uniqueVoters: 0 };
    } catch (error) {
      console.error('Error getting logo stats:', error);
      throw new Error('Database connection failed');
    }
  }

  static async getAllLogoStats() {
    const startTime = performance.now();
    console.log('DatabaseService: Getting all logo stats');

    try {
      await this.connect();

      // Get all active logos first
      const logos = await LogoModel.find({ status: 'active' }).lean();

      // Get all votes with confirmed status
      const votes = await VoteModel.find({ status: 'confirmed' }).lean();

      // Create a map to count votes per logo
      const voteCountMap = new Map();
      const lastVoteMap = new Map();

      // Count votes and track last vote timestamp for each logo
      votes.forEach((vote) => {
        const logoId = vote.logoId;

        // Update vote count
        const currentCount = voteCountMap.get(logoId) || 0;
        voteCountMap.set(logoId, currentCount + 1);

        // Update last vote timestamp
        const currentLastVote = lastVoteMap.get(logoId);
        if (!currentLastVote || new Date(vote.timestamp) > new Date(currentLastVote)) {
          lastVoteMap.set(logoId, vote.timestamp);
        }
      });

      // Create stats for each logo using the actual logos from the database
      const stats = logos.map((logo) => ({
        logoId: `logo${logo.id}`, // Use logo.id instead of logo.value
        voteCount: voteCountMap.get(`logo${logo.id}`) || 0, // Match the format in vote records
        lastVote: lastVoteMap.get(`logo${logo.id}`) || null,
      }));

      console.log('DatabaseService: Logo stats:', JSON.stringify(stats, null, 2));
      return stats;
    } catch (error) {
      console.error('DatabaseService: Error getting logo stats:', error);
      throw error;
    }
  }

  static async validateData(): Promise<{
    users: IUser[];
    votes: IVote[];
    issues: string[];
  }> {
    await this.connect();
    const users = await UserModel.find();
    const votes = await VoteModel.find({ status: 'confirmed' });
    const issues: string[] = [];

    // Validate each user's votes
    for (const user of users) {
      const userVotes = votes.filter((v) => v.userId === user.userId);
      const validationResult = validateUserVotes(userVotes);
      if (!validationResult.valid) {
        issues.push(`User ${user.userId}: ${validationResult.reason}`);
      }
    }

    // Validate each logo's votes
    const logoVotes = new Map<string, IVote[]>();
    votes.forEach((vote) => {
      const logoId = vote.logoId;
      if (!logoVotes.has(logoId)) {
        logoVotes.set(logoId, []);
      }
      logoVotes.get(logoId)!.push(vote);
    });

    logoVotes.forEach((votes, logoId) => {
      const validationResult = validateLogoVotes(votes);
      if (!validationResult.valid) {
        issues.push(`Logo ${logoId}: ${validationResult.reason}`);
      }
    });

    return { users, votes, issues };
  }
}
