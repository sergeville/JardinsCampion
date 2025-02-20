import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Set default environment
const env = {
  ...process.env,
  NODE_ENV: 'development' as 'development' | 'production' | 'test',
};
process.env = env;

import { connectDB } from '@/lib/mongodb';
import LogoModel from '@/models/Logo';

const logos = [
  {
    value: '1',
    src: '/logos/Logo2.png',
    alt: 'Logo featuring a harmonious blend of green leaves and vines arranged in a perfect circle, symbolizing the natural cycle and unity of garden elements',
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
    alt: 'Contemporary garden logo with clean lines and abstract leaf shapes, creating a balanced composition that represents modern landscape design',
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
    alt: 'Sophisticated logo design showcasing intricate leaf patterns with flowing lines that capture the essence of natural garden movement',
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
    alt: 'Traditional garden logo featuring detailed botanical illustrations with ornate flourishes, reflecting classical landscape design principles',
    ownerId: 'owner012',
    status: 'active',
    voteStats: {
      totalVotes: 0,
      uniqueVoters: 0,
    },
  },
  {
    value: '5',
    src: '/logos/Logo5.png',
    alt: 'Modern geometric garden logo combining precise angular shapes with organic plant forms, representing the fusion of structured design with natural elements',
    ownerId: 'owner345',
    status: 'active',
    voteStats: {
      totalVotes: 0,
      uniqueVoters: 0,
    },
  },
  {
    value: '6',
    src: '/logos/Logo6.png',
    alt: 'Sustainable garden design logo with eco-friendly elements and natural motifs',
    ownerId: 'owner678',
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

seedLogos();
