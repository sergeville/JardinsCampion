import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import LogoModel from '../models/Logo';

const logos = [
  {
    value: '1',
    src: '/logos/Logo2.png',
    alt: 'Elegant floral logo with intertwined leaves and vines in a circular design',
    ownerId: 'owner123',
    status: 'active',
    voteStats: {
      totalVotes: 0,
      uniqueVoters: 0,
    },
  },
  {
    value: '2',
    src: '/logos/Logo3.png',
    alt: 'Modern minimalist garden logo with stylized plant elements',
    ownerId: 'owner456',
    status: 'active',
    voteStats: {
      totalVotes: 0,
      uniqueVoters: 0,
    },
  },
  {
    value: '3',
    src: '/logos/Logo4.png',
    alt: 'Nature-inspired logo featuring delicate leaf patterns',
    ownerId: 'owner789',
    status: 'active',
    voteStats: {
      totalVotes: 0,
      uniqueVoters: 0,
    },
  },
  {
    value: '4',
    src: '/logos/Logo1.jpeg',
    alt: 'Classic garden design logo with ornate botanical details',
    ownerId: 'owner012',
    status: 'active',
    voteStats: {
      totalVotes: 0,
      uniqueVoters: 0,
    },
  },
];

async function seedLogos() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    // Clear existing logos
    console.log('Clearing existing logos...');
    await LogoModel.deleteMany({});
    console.log('Cleared existing logos');

    // Insert new logos
    console.log('Inserting new logos...');
    const result = await LogoModel.insertMany(logos);
    console.log('Seeded logos:', result);
  } catch (error) {
    console.error('Error seeding logos:', error);
  } finally {
    process.exit(0);
  }
}

// Set NODE_ENV if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

seedLogos();
