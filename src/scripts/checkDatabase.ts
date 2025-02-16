import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import LogoModel from '../models/Logo';
import UserModel from '../models/User';
import VoteModel from '../models/Vote';

async function checkDatabase() {
  try {
    await connectDB();

    console.log('\n=== Checking Logos ===');
    const logos = await LogoModel.find().lean();
    console.log('Total logos:', logos.length);
    console.log('Active logos:', logos.filter((l) => l.status === 'active').length);
    console.log('Logo details:');
    logos.forEach((logo) => {
      console.log(`- Logo ${logo.id}:`, {
        status: logo.status,
        src: logo.src,
        alt: logo.alt,
        createdAt: logo.createdAt,
      });
    });

    console.log('\n=== Checking Users ===');
    const users = await UserModel.find().lean();
    console.log('Total users:', users.length);
    console.log('User details:');
    users.forEach((user) => {
      console.log(`- User ${user.userId}:`, {
        name: user.name,
        voteCount: user.voteCount,
        votedLogos: user.votedLogos,
      });
    });

    console.log('\n=== Checking Votes ===');
    const votes = await VoteModel.find().lean();
    console.log('Total votes:', votes.length);
    console.log('Vote status breakdown:', {
      confirmed: votes.filter((v) => v.status === 'confirmed').length,
      rejected: votes.filter((v) => v.status === 'rejected').length,
    });
    console.log('Vote details:');
    votes.forEach((vote) => {
      console.log(`- Vote by ${vote.userId} for logo ${vote.logoId}:`, {
        status: vote.status,
        timestamp: vote.timestamp,
        conflictResolution: vote.conflictResolution,
      });
    });
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

// Set default environment
const NODE_ENV = process.env.NODE_ENV || 'development';
process.env = { ...process.env, NODE_ENV };

checkDatabase();
