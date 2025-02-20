import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const users = await UserModel.find({}, { name: 1, userId: 1 }).sort({ name: 1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
