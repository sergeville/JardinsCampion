'use server';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  const dbTrace: any[] = [];
  const traceDb = (type: 'request' | 'operation' | 'result' | 'error', data: any) => {
    const timestamp = new Date().toISOString();
    dbTrace.push({
      timestamp,
      type,
      ...data,
    });
  };

  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    const url = request.url;

    traceDb('request', {
      method: 'GET',
      url,
      params: { action, userId, limit },
    });

    switch (action) {
      case 'history': {
        traceDb('operation', {
          name: 'getVoteHistory',
          params: { limit: limit || '10' },
        });

        const startTime = performance.now();
        const history = await DatabaseService.getVoteHistory(limit ? parseInt(limit) : 10);
        const duration = performance.now() - startTime;

        traceDb('result', {
          operation: 'getVoteHistory',
          recordCount: history.length,
          duration: `${duration.toFixed(2)}ms`,
          success: true,
        });

        return NextResponse.json({
          success: true,
          data: history,
          trace: dbTrace,
        });
      }

      case 'userVotes': {
        if (!userId) {
          traceDb('error', {
            message: 'userId parameter is missing',
            code: 400,
          });
          return NextResponse.json(
            {
              success: false,
              error: 'userId is required',
              trace: dbTrace,
            },
            { status: 400 }
          );
        }

        traceDb('operation', {
          name: 'getUserVotes',
          params: { userId },
        });

        const startTime = performance.now();
        const votes = await DatabaseService.getUserVotes(userId);
        const duration = performance.now() - startTime;

        traceDb('result', {
          operation: 'getUserVotes',
          recordCount: votes.length,
          duration: `${duration.toFixed(2)}ms`,
          success: true,
        });

        return NextResponse.json({
          success: true,
          data: votes,
          trace: dbTrace,
        });
      }

      case 'stats': {
        traceDb('operation', {
          name: 'getAllLogoStats',
        });

        const startTime = performance.now();
        const stats = await DatabaseService.getAllLogoStats();
        const duration = performance.now() - startTime;

        traceDb('result', {
          operation: 'getAllLogoStats',
          recordCount: stats.length,
          duration: `${duration.toFixed(2)}ms`,
          success: true,
        });

        return NextResponse.json({
          success: true,
          data: stats,
          trace: dbTrace,
        });
      }

      default:
        traceDb('error', {
          message: `Invalid action '${action}'`,
          code: 400,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            trace: dbTrace,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    traceDb('error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: 500,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        trace: dbTrace,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const dbTrace: any[] = [];
  const traceDb = (type: 'request' | 'operation' | 'result' | 'error', data: any) => {
    const timestamp = new Date().toISOString();
    dbTrace.push({
      timestamp,
      type,
      ...data,
    });
  };

  const startTime = performance.now();

  try {
    const url = request.url;
    const body = await request.json();

    traceDb('request', {
      method: 'POST',
      url,
      body,
    });

    // Validate required fields
    if (!body.userId || !body.logoId || !body.timestamp || !body.ownerId) {
      const errorResponse = {
        success: false,
        message: 'Invalid request',
        invalidFields: {
          userId: !body.userId,
          logoId: !body.logoId,
          timestamp: !body.timestamp,
          ownerId: !body.ownerId,
        },
      };
      return new NextResponse(JSON.stringify(errorResponse), { status: 400 });
    }

    traceDb('operation', {
      name: 'submitVote',
      params: {
        userId: body.userId,
        logoId: body.logoId,
        timestamp: body.timestamp,
      },
    });

    const vote = await DatabaseService.submitVote(body);
    const duration = performance.now() - startTime;

    traceDb('result', {
      operation: 'submitVote',
      voteId: vote._id,
      duration: `${duration.toFixed(2)}ms`,
      success: true,
    });

    return NextResponse.json({
      success: true,
      data: vote,
      trace: dbTrace,
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    traceDb('error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration.toFixed(2)}ms`,
    });

    if (error instanceof Error) {
      const errorMessage = error.message;
      let statusCode = 500;
      const errorResponse = {
        success: false,
        error: errorMessage,
        trace: dbTrace,
      };

      if (errorMessage.includes('already voted')) {
        statusCode = 409;
      } else if (errorMessage.includes('User not found')) {
        statusCode = 404;
      } else if (errorMessage.includes('timeout')) {
        statusCode = 408;
      }

      return NextResponse.json(errorResponse, { status: statusCode });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        trace: dbTrace,
      },
      { status: 500 }
    );
  }
}
