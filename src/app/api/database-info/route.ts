import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose, { Model, Document, UpdateQuery } from 'mongoose';
import type { IUser } from '@/models/User';
import type { IVote } from '@/models/Vote';
import type { ILogo } from '@/models/Logo';
import type { Collection, Db } from 'mongodb';

type ModelType = IUser | IVote | ILogo;
type ModelDoc = Document & ModelType;

interface Models {
  User: Model<IUser>;
  Vote: Model<IVote>;
  Logo: Model<ILogo>;
}

interface CollectionStats {
  ns: string;
  count: number;
  size: number;
  avgObjSize: number;
  storageSize: number;
  totalIndexSize: number;
  totalSize: number;
  scaleFactor: number;
}

let models: Models | null = null;

// Lazy load models to avoid initialization issues in tests
const getModels = async (): Promise<Models> => {
  if (!models) {
    const { default: UserModel } = await import('@/models/User');
    const { default: VoteModel } = await import('@/models/Vote');
    const { default: LogoModel } = await import('@/models/Logo');
    models = {
      User: UserModel,
      Vote: VoteModel,
      Logo: LogoModel,
    };
  }
  return models;
};

async function updateDocument(
  model: Model<any>,
  id: string,
  data: any,
  session?: mongoose.mongo.ClientSession
) {
  return (model as Model<Document>).findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: data },
    { new: true, session }
  );
}

async function deleteDocument(
  model: Model<any>,
  id: string,
  session?: mongoose.mongo.ClientSession
) {
  return (model as Model<Document>).findOneAndDelete(
    { _id: new mongoose.Types.ObjectId(id) },
    { session }
  );
}

export async function POST(request: NextRequest) {
  let session;
  try {
    const body = await request.json();
    const { action, collectionName, data, id, useTransaction } = body;

    const models = await getModels();
    const collections = {
      users: models.User,
      votes: models.Vote,
      logos: models.Logo,
    };

    if (!collections[collectionName as keyof typeof collections]) {
      return NextResponse.json(
        { success: false, error: 'Invalid collection name' },
        { status: 400 }
      );
    }

    const Collection = collections[collectionName as keyof typeof collections];
    await connectDB();

    if (useTransaction) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    let result;
    switch (action) {
      case 'stats': {
        const db = mongoose.connection.db as unknown as Db;
        const stats = (await db.command({
          collStats: Collection.collection.collectionName,
        })) as CollectionStats;
        result = {
          success: true,
          stats: {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            totalSize: stats.totalSize,
            totalIndexSize: stats.totalIndexSize,
          },
        };
        break;
      }

      case 'add': {
        const doc = new Collection(data);
        const newItem = await doc.save({ session });
        result = { success: true, data: newItem };
        break;
      }

      case 'update': {
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'ID is required for update' },
            { status: 400 }
          );
        }
        const updatedItem = await updateDocument(Collection, id, data, session);
        if (!updatedItem) {
          return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }
        result = { success: true, data: updatedItem };
        break;
      }

      case 'delete': {
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'ID is required for deletion' },
            { status: 400 }
          );
        }
        const deletedItem = await deleteDocument(Collection, id, session);
        if (!deletedItem) {
          return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }
        result = { success: true };
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    if (session) {
      await session.commitTransaction();
      await session.endSession();
    }

    return NextResponse.json(result);
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      await session.endSession();
    }
    console.error('Database operation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const models = await getModels();
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collections = {
      users: models.User,
      votes: models.Vote,
      logos: models.Logo,
    };

    const stats = await Promise.all(
      Object.entries(collections).map(async ([name, model]) => {
        const stats = (await db.command({
          collStats: model.collection.collectionName,
        })) as CollectionStats;
        return [
          name,
          {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            totalSize: stats.totalSize,
            totalIndexSize: stats.totalIndexSize,
          },
        ];
      })
    );

    const data = {
      schemas: {
        User: models.User.schema.obj,
        Vote: models.Vote.schema.obj,
        Logo: models.Logo.schema.obj,
      },
      collections: {
        users: await models.User.find().lean(),
        votes: await models.Vote.find().lean(),
        logos: await models.Logo.find().lean(),
      },
      stats: Object.fromEntries(stats),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching database info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch database information' },
      { status: 500 }
    );
  }
}
