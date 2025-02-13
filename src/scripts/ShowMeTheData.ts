import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Vote from '../models/Vote';
import Logo from '../models/Logo';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function showSchemas() {
  console.log('\n=== Schema Definitions ===\n');

  console.log('User Schema:');
  console.log(JSON.stringify(User.schema.obj, null, 2));

  console.log('\nVote Schema:');
  console.log(JSON.stringify(Vote.schema.obj, null, 2));

  console.log('\nLogo Schema:');
  console.log(JSON.stringify(Logo.schema.obj, null, 2));
}

async function showData() {
  try {
    // Connect to development database
    const MONGODB_URI = process.env.MONGODB_URI_DEV;
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI_DEV environment variable');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('\n=== Database Connection ===');
    console.log('Connected to MongoDB:', MONGODB_URI);

    // Fetch and display data
    console.log('\n=== Database Contents ===\n');

    console.log('Users:');
    const users = await User.find({});
    console.log(JSON.stringify(users, null, 2));

    console.log('\nVotes:');
    const votes = await Vote.find({});
    console.log(JSON.stringify(votes, null, 2));

    console.log('\nLogos:');
    const logos = await Logo.find({});
    console.log(JSON.stringify(logos, null, 2));

    // Display counts
    console.log('\n=== Collection Counts ===\n');
    console.log('Users:', users.length);
    console.log('Votes:', votes.length);
    console.log('Logos:', logos.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the functions
async function main() {
  await showSchemas();
  await showData();
}

main().catch(console.error);
