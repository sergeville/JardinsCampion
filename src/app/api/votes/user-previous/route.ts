import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';
import { NetworkError, ErrorSeverity } from '@/lib/errors/types';

export async function GET(request: Request) {
  try {
    // Get user ID from the auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.split('.')[0]; // In a real app, you'd decode the JWT token

    // Get user's previous vote
    const userVotes = await DatabaseService.getUserVotes(userId);
    const latestVote = userVotes[0]; // Assuming votes are sorted by timestamp desc

    return NextResponse.json(
      {
        vote: latestVote || null,
        message: latestVote ? 'Previous vote found' : 'No previous vote found',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user previous vote:', error);
    const status =
      error instanceof NetworkError && error.metadata.severity === ErrorSeverity.CRITICAL
        ? 503
        : 500;

    return NextResponse.json(
      {
        error: 'Failed to fetch previous vote',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status }
    );
  }
}
