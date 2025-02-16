import mongoose from 'mongoose';
import UserModel from '../models/User';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI_DEV;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI_DEV environment variable inside .env.local');
}

async function addUser() {
  try {
    await mongoose.connect(MONGODB_URI as string, {
      authSource: 'admin',
      directConnection: true,
    });
    console.log('Connected to MongoDB');

    const userId = `lyne-legault-groulx-${Date.now()}`;
    const newUser = new UserModel({
      id: userId,
      name: 'Lyne Legault Groulx',
      email: 'lyne.legault.groulx@example.com',
      userId: userId,
      voteCount: 0,
      votedLogos: [],
    });

    await newUser.save();
    console.log('User added successfully:', newUser);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error adding user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addUser();
