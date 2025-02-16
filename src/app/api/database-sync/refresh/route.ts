import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Force a refresh of the database connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.close();
      await connectDB();
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection refreshed',
      connectionState: mongoose.connection.readyState,
    });
  } catch (error) {
    console.error('Error refreshing database connection:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to refresh database connection',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
