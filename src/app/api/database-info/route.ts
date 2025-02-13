import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Vote from '@/models/Vote';
import Logo from '@/models/Logo';

export async function GET() {
  try {
    await connectDB();

    // Get schema definitions
    const schemas = {
      User: User.schema.obj,
      Vote: Vote.schema.obj,
      Logo: Logo.schema.obj,
    };

    // Get collection data
    const users = await User.find({});
    const votes = await Vote.find({});
    const logos = await Logo.find({});

    // Get collection counts
    const counts = {
      users: users.length,
      votes: votes.length,
      logos: logos.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        schemas,
        collections: {
          users,
          votes,
          logos,
        },
        counts,
      },
    });
  } catch (error) {
    console.error('Database info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch database information' },
      { status: 500 }
    );
  }
}
