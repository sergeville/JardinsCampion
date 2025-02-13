'use server';
import { Model, Document } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Logo, ILogo } from '@/models/Logo';
import { User, IUser } from '@/models/User';
import { Vote, IVote } from '@/models/Vote';
import { DatabaseDocument, DatabaseInfo, DatabaseStats } from '@/types/database';
import { resolveVoteConflict, validateUserVotes, validateLogoVotes } from '../dataConsistency';

type CollectionName = 'users' | 'votes' | 'logos';
type DocumentType = IUser | IVote | ILogo;

interface VoteData {
  userId: string;
  logoId: string;
  ownerId?: string;
}

interface VoteStats {
  totalVotes: number;
  uniqueVoters: number;
}

interface LogoStats extends VoteStats {
  logoId: string;
}

const collections = {
  users: User,
  votes: Vote,
  logos: Logo,
} as const;

export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  const { db } = await connectToDatabase();
  const stats = await db.stats();

  const collectionStats = await Promise.all(
    Object.keys(collections).map(async (name) => {
      const collection = db.collection(name);
      const stats = await collection.stats();
      return [name, stats] as [string, DatabaseStats];
    })
  );

  const collectionsData = await Promise.all(
    Object.entries(collections).map(async ([name, model]) => {
      const documents = await model.find().lean();
      return [name, documents] as [string, DocumentType[]];
    })
  );

  return {
    collections: Object.fromEntries(collectionsData),
    stats: {
      collections: Object.fromEntries(
        collectionStats.map(([name, stats]) => [
          name,
          {
            count: stats.count,
            avgSize: stats.avgObjSize,
            totalSize: stats.size,
          },
        ])
      ),
      totalSize: stats.dataSize,
      avgObjSize: stats.avgObjSize,
    },
  };
}

export async function createDocument<T extends DocumentType>(
  collectionName: CollectionName,
  data: Partial<T>
): Promise<DatabaseDocument<T>> {
  const Model = collections[collectionName];
  if (!Model) {
    throw new Error(`Collection ${collectionName} not found`);
  }

  const document = new Model(data);
  await document.save();
  return document.toObject();
}

export async function updateDocument<T extends DocumentType>(
  collectionName: CollectionName,
  id: string,
  data: Partial<T>
): Promise<DatabaseDocument<T>> {
  const Model = collections[collectionName];
  if (!Model) {
    throw new Error(`Collection ${collectionName} not found`);
  }

  const document = await Model.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  );

  if (!document) {
    throw new Error('Document not found');
  }

  return document.toObject();
}

export async function deleteDocument(
  collectionName: CollectionName,
  id: string
): Promise<void> {
  const Model = collections[collectionName];
  if (!Model) {
    throw new Error(`Collection ${collectionName} not found`);
  }

  const result = await Model.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Document not found');
  }
}

export async function getCollection<T extends DocumentType>(
  collectionName: CollectionName
): Promise<DatabaseDocument<T>[]> {
  const Model = collections[collectionName];
  if (!Model) {
    throw new Error(`Collection ${collectionName} not found`);
  }

  const documents = await Model.find().lean();
  return documents;
}

export class DatabaseService {
  static async connect(): Promise<void> {
    try {
      console.log('DatabaseService: Attempting to connect to database...');
      await connectToDatabase();
      console.log('DatabaseService: Connected successfully');
    } catch (error) {
      console.error('DatabaseService: Connection error:', error);
      throw error;
    }
  }

  static async createUser(name: string): Promise<IUser> {
    console.log('DatabaseService: Creating user:', name);
    await this.connect();

    try {
      const userId = name.toLowerCase().replace(/\s+/g, '-');

      const user = new User({
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
    const user = await User.findByUserId(userId);
    console.log('DatabaseService: User found:', user);
    return user;
  }

  static async submitVote(voteData: VoteData): Promise<IVote> {
    console.log('DatabaseService: Submitting vote:', voteData);
    await this.connect();

    try {
      // Check if user exists or create new user
      let user = await User.findByUserId(voteData.userId);
      if (!user) {
        console.log('DatabaseService: Creating new user for vote');
        user = await this.createUser(voteData.userId);
      }

      // Create vote
      const vote = new Vote({
        userId: user.userId,
        logoId: voteData.logoId,
        ownerId: voteData.ownerId,
      });

      await vote.save();
      console.log('DatabaseService: Vote submitted:', vote);
      return vote;
    } catch (error) {
      console.error('DatabaseService: Error submitting vote:', error);
      throw error;
    }
  }

  static async getUserVotes(userId: string): Promise<IVote[]> {
    console.log('DatabaseService: Getting user votes:', userId);
    await this.connect();
    const votes = await Vote.findUserVotes(userId);
    console.log('DatabaseService: Found votes:', votes);
    return votes;
  }

  static async getVoteHistory(limit: number): Promise<IVote[]> {
    console.log('DatabaseService: Getting vote history, limit:', limit);
    await this.connect();
    const votes = await Vote.find({ status: 'confirmed' })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .lean();
    console.log('DatabaseService: Found votes:', votes);
    return votes;
  }

  static async getLogoStats(logoId: string): Promise<VoteStats> {
    console.log('DatabaseService: Getting logo stats:', logoId);
    await this.connect();
    const stats = await Vote.getVoteStats(logoId);
    console.log('DatabaseService: Logo stats:', stats);
    return stats[0] || { totalVotes: 0, uniqueVoters: 0 };
  }

  static async getAllLogoStats(): Promise<LogoStats[]> {
    console.log('DatabaseService: Getting all logo stats');
    await this.connect();
    const logos = await Logo.find({ status: 'active' });
    const stats = await Promise.all(
      logos.map(async (logo) => {
        const logoStats = await this.getLogoStats(logo.id);
        return {
          ...logoStats,
          logoId: logo.id,
        };
      })
    );
    console.log('DatabaseService: All logo stats:', stats);
    return stats;
  }

  static async validateData(): Promise<{
    users: IUser[];
    votes: IVote[];
    issues: string[];
  }> {
    await this.connect();
    const users = await User.find();
    const votes = await Vote.find({ status: 'confirmed' });
    const issues: string[] = [];

    // Validate each user's votes
    for (const user of users) {
      const userVotes = votes.filter((v) => v.userId === user.userId);
      const validationResult = validateUserVotes(userVotes);
      if (!validationResult.valid) {
        issues.push(
          `User ${user.userId}: ${validationResult.reason}`
        );
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
        issues.push(
          `Logo ${logoId}: ${validationResult.reason}`
        );
      }
    });

    return { users, votes, issues };
  }
}
