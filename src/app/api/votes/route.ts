'use server';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    switch (action) {
      case 'history':
        const history = await DatabaseService.getVoteHistory(limit ? parseInt(limit) : 10);
        return NextResponse.json({ success: true, data: history });

      case 'userVotes':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }
        const votes = await DatabaseService.getUserVotes(userId);
        return NextResponse.json({ success: true, data: votes });

      case 'stats':
        const stats = await DatabaseService.getAllLogoStats();
        return NextResponse.json({ success: true, data: stats });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, logoId, ownerId } = body;

    if (!userId || !logoId) {
      return NextResponse.json(
        { success: false, error: 'userId and logoId are required' },
        { status: 400 }
      );
    }

    const result = await DatabaseService.submitVote({ userId, logoId, ownerId });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
