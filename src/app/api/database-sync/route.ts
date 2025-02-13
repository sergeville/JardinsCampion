import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import VoteModel from '@/models/Vote';
import LogoModel from '@/models/Logo';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    console.log('Connecting to database...');
    const db = await connectDB();
    console.log('Database connected successfully');

    // Ensure we're connected to a replica set
    const adminDb = db.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    console.log('Server status:', serverStatus.process);

    // Set up SSE headers
    const encoder = new TextEncoder();
    const customHeaders = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Initializing stream...');
          // Function to get current database state
          const getDatabaseState = async () => {
            console.log('Fetching database state...');
            try {
              const [users, votes, logos] = await Promise.all([
                UserModel.find({}).lean(),
                VoteModel.find({}).lean(),
                LogoModel.find({}).lean(),
              ]);
              console.log('Database state fetched successfully');

              return {
                schemas: {
                  User: UserModel.schema.obj,
                  Vote: VoteModel.schema.obj,
                  Logo: LogoModel.schema.obj,
                },
                users: users || [],
                votes: votes || [],
                logos: logos || [],
                timestamp: new Date().toISOString(),
              };
            } catch (fetchError) {
              console.error('Error fetching database state:', fetchError);
              throw fetchError;
            }
          };

          // Send initial state
          console.log('Sending initial state...');
          const initialState = await getDatabaseState();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialState)}\n\n`));

          // Set up change streams
          console.log('Setting up change streams...');
          const changeStreams: mongoose.ChangeStream[] = [];

          try {
            const collections = [
              { model: UserModel, name: 'users' },
              { model: VoteModel, name: 'votes' },
              { model: LogoModel, name: 'logos' },
            ];

            for (const { model, name } of collections) {
              const changeStream = model.watch([], {
                fullDocument: 'updateLookup',
              });

              changeStream.on('change', async () => {
                console.log(`Change detected in ${name} collection`);
                try {
                  const newState = await getDatabaseState();
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(newState)}\n\n`));
                } catch (updateError) {
                  console.error(`Error updating state after ${name} change:`, updateError);
                }
              });

              changeStream.on('error', (error) => {
                console.error(`Error in ${name} change stream:`, error);
              });

              changeStreams.push(changeStream);
            }
          } catch (watchError) {
            console.error('Error setting up change streams:', watchError);
            throw watchError;
          }

          // Keep connection alive with a heartbeat
          const heartbeat = setInterval(() => {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          }, 30000);

          // Clean up on client disconnect
          req.signal.addEventListener('abort', () => {
            console.log('Client disconnected, cleaning up...');
            clearInterval(heartbeat);
            changeStreams.forEach((stream) => stream.close());
          });

          console.log('Stream setup completed successfully');
        } catch (streamError) {
          console.error('Stream setup error:', streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(stream, {
      headers: customHeaders,
    });
  } catch (error) {
    console.error(
      'SSE Error:',
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error
    );

    return new Response(
      JSON.stringify({
        error: 'Failed to establish SSE connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
