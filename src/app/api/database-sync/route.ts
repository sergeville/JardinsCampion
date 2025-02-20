import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/models/User';
import VoteModel from '@/models/Vote';
import LogoModel from '@/models/Logo';
import mongoose from 'mongoose';
import type { ChangeStream } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize models after connection
async function initializeModels() {
  console.log('Initializing database models...');
  console.log('Current mongoose connection state:', mongoose.connection.readyState);

  const db = await connectDB();
  if (!db || !mongoose.connection.readyState) {
    console.error('Database connection failed:', {
      connectionState: mongoose.connection.readyState,
      dbInstance: !!db,
      models: Object.keys(mongoose.models),
    });
    throw new Error('Database connection failed');
  }

  console.log('Models initialization successful:', {
    existingModels: Object.keys(mongoose.models),
    connectionState: mongoose.connection.readyState,
  });

  return {
    User: mongoose.models.User || mongoose.model('User', UserModel.schema),
    Vote: mongoose.models.Vote || mongoose.model('Vote', VoteModel.schema),
    Logo: mongoose.models.Logo || mongoose.model('Logo', LogoModel.schema),
  };
}

export async function GET(req: NextRequest) {
  console.time('total-request-time');
  const requestStart = process.hrtime();
  let isConnectionClosed = false;
  let heartbeat: NodeJS.Timeout | undefined;
  let cleanupTimeout: NodeJS.Timeout | undefined;
  const changeStreams: ChangeStream[] = [];

  const cleanup = () => {
    if (isConnectionClosed) return;
    isConnectionClosed = true;

    console.log('Cleaning up resources...');
    if (heartbeat) clearInterval(heartbeat);
    if (cleanupTimeout) clearTimeout(cleanupTimeout);

    changeStreams.forEach((stream) => {
      try {
        stream.close();
      } catch (e) {
        console.error('Error closing change stream:', e);
      }
    });
  };

  // Set up response headers
  const customHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Accel-Buffering': 'no',
  });

  const encoder = new TextEncoder();

  try {
    const stream = new ReadableStream({
      async start(controller) {
        // Set a maximum connection time of 1 hour
        cleanupTimeout = setTimeout(() => {
          console.log('Maximum connection time reached, closing...');
          cleanup();
          controller.close();
        }, 3600000);

        try {
          console.time('stream-setup');
          const models = await initializeModels();

          if (!models) {
            throw new Error('Failed to initialize database models');
          }

          // Send initial state
          console.time('initial-state-fetch');
          const initialState = await getDatabaseState(models, true);
          console.timeEnd('initial-state-fetch');

          if (!initialState) {
            throw new Error('Failed to fetch initial state');
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'initial',
                timestamp: new Date().toISOString(),
                data: initialState,
              })}\n\n`
            )
          );

          // Set up change streams
          console.time('change-streams-setup');
          const collections = [
            { model: models.User, name: 'users' },
            { model: models.Vote, name: 'votes' },
            { model: models.Logo, name: 'logos' },
          ];

          for (const { model, name } of collections) {
            const changeStream = model.watch(
              [{ $match: { operationType: { $in: ['insert', 'update', 'delete'] } } }],
              {
                fullDocument: 'updateLookup',
                maxAwaitTimeMS: 60000, // 1 minute timeout
              }
            );

            changeStream.on('change', async (change) => {
              if (isConnectionClosed) return;

              try {
                const newState = await getDatabaseState(models);
                if (newState) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'update',
                        timestamp: new Date().toISOString(),
                        collection: name,
                        operation: change.operationType,
                        data: newState,
                      })}\n\n`
                    )
                  );
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Error processing ${name} change:`, error);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'error',
                      timestamp: new Date().toISOString(),
                      error: `Error processing ${name} change: ${errorMessage}`,
                    })}\n\n`
                  )
                );
              }
            });

            changeStream.on('error', (error) => {
              console.error(`Error in ${name} change stream:`, error);
              if (!isConnectionClosed) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'error',
                      timestamp: new Date().toISOString(),
                      error: `${name} change stream error: ${errorMessage}`,
                    })}\n\n`
                  )
                );
              }
            });

            changeStreams.push(changeStream);
          }
          console.timeEnd('change-streams-setup');

          // Keep connection alive with heartbeat
          heartbeat = setInterval(() => {
            if (!isConnectionClosed) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'heartbeat',
                    timestamp: new Date().toISOString(),
                  })}\n\n`
                )
              );
            }
          }, 30000);

          // Clean up on client disconnect
          req.signal.addEventListener('abort', () => {
            console.log('Client disconnected, cleaning up...');
            cleanup();
            controller.close();
          });
        } catch (error) {
          console.error('Error in stream setup:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                timestamp: new Date().toISOString(),
                error: `Stream setup error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              })}\n\n`
            )
          );
          cleanup();
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: customHeaders });
  } catch (error) {
    console.error('Error creating response stream:', error);
    cleanup();
    return new Response(
      JSON.stringify({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: 'Failed to establish database connection',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(customHeaders.entries()),
        },
      }
    );
  }
}

async function getDatabaseState(models: any, initial = false) {
  try {
    const [users, votes, logos] = await Promise.all([
      models.User.find().lean(),
      models.Vote.find().lean(),
      models.Logo.find().lean(),
    ]);

    return {
      users,
      votes,
      logos,
    };
  } catch (error) {
    console.error('Error fetching database state:', error);
    return null;
  }
}
