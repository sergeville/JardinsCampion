import * as dotenv from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import VoteModel from '../models/Vote';
import LogoModel from '../models/Logo';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

interface MigrationStats {
  mismatches: number;
  details: string[];
}

async function validateMigration() {
  console.log('Validating migration results...');

  const invalidVotes = await VoteModel.find({
    $or: [
      { ownerId: { $exists: true } },
      { version: { $exists: true } },
      { updatedAt: { $exists: true } },
      { userName: { $exists: true } },
      { __v: { $exists: true } },
      { status: { $nin: ['confirmed', 'rejected'] } },
    ],
  }).lean();

  const invalidLogos = await LogoModel.find({
    $or: [
      { voteStats: { $exists: true } },
      { uploadedAt: { $exists: true } },
      { updatedAt: { $exists: true } },
    ],
  }).lean();

  return {
    invalidVotes: invalidVotes.length,
    invalidLogos: invalidLogos.length,
    invalidVoteIds: invalidVotes.map((v) => v._id),
    invalidLogoIds: invalidLogos.map((l) => l.id),
  };
}

async function verifyVoteCounts(): Promise<MigrationStats> {
  await connectDB();
  const logos = await LogoModel.find().lean();
  const stats: MigrationStats = {
    mismatches: 0,
    details: [],
  };

  for (const logo of logos) {
    const voteStats = await VoteModel.aggregate([
      { $match: { logoId: logo.id, status: 'confirmed' } },
      {
        $group: {
          _id: null,
          voteCount: { $sum: 1 },
        },
      },
    ]);

    const voteCount = voteStats[0]?.voteCount || 0;
    console.log(`Logo ${logo.id}: ${voteCount} votes`);
  }

  return stats;
}

async function migrate() {
  try {
    console.log('Starting migration...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI);

    // Connect to database
    await connectDB();

    // 1. Update Vote documents
    console.log('Updating Vote documents...');
    const voteResult = await VoteModel.updateMany({}, [
      {
        $set: {
          status: {
            $cond: {
              if: { $eq: ['$status', 'confirmed'] },
              then: 'confirmed',
              else: 'rejected',
            },
          },
        },
      },
      {
        $unset: ['ownerId', 'version', 'updatedAt', 'userName', '__v'],
      },
    ]);
    console.log(`Updated ${voteResult.modifiedCount} vote documents`);

    // 2. Update Logo documents
    console.log('Updating Logo documents...');
    const logoResult = await LogoModel.updateMany({}, [
      {
        $unset: ['voteStats', 'uploadedAt', 'updatedAt'],
      },
    ]);
    console.log(`Updated ${logoResult.modifiedCount} logo documents`);

    // 3. Validate migration
    console.log('Running validation...');
    const validationResults = await validateMigration();
    console.log('Validation results:', validationResults);

    // 4. Verify vote counts
    console.log('Verifying vote counts...');
    const stats = await verifyVoteCounts();
    console.log('Migration verification completed:', stats);

    if (
      validationResults.invalidVotes > 0 ||
      validationResults.invalidLogos > 0 ||
      stats.mismatches > 0
    ) {
      console.error('Migration validation failed!');
      if (validationResults.invalidVotes > 0) {
        console.error('Invalid vote IDs:', validationResults.invalidVoteIds);
      }
      if (validationResults.invalidLogos > 0) {
        console.error('Invalid logo IDs:', validationResults.invalidLogoIds);
      }
      process.exit(1);
    }

    console.log('Migration completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Add error handlers
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  mongoose.disconnect().then(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  mongoose.disconnect().then(() => process.exit(1));
});

migrate();
