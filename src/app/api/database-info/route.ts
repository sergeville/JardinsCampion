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

// Configure route for static export
export const dynamic = 'error';
export const dynamicParams = false;

export async function POST(request: NextRequest) {
  return new Response(
    'This API route is not available in static export. Please use client-side data management.',
    { status: 404 }
  );
}

export async function GET(request: NextRequest) {
  return new Response(
    'This API route is not available in static export. Please use client-side data fetching.',
    { status: 404 }
  );
}
