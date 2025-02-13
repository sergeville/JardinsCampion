import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Vote } from '@/models/Vote';
import { Logo } from '@/models/Logo';

const collections = {
  users: User,
  votes: Vote,
  logos: Logo,
};

export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  try {
    const { action } = params;
    const body = await request.json();
    const { collectionName, data, id } = body;

    if (!collections[collectionName as keyof typeof collections]) {
      return NextResponse.json(
        { success: false, error: 'Invalid collection name' },
        { status: 400 }
      );
    }

    const Collection = collections[collectionName as keyof typeof collections];
    await connectToDatabase();

    switch (action) {
      case 'add':
        const newItem = new Collection(data);
        await newItem.save();
        return NextResponse.json({ success: true, data: newItem });

      case 'update':
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'ID is required for update' },
            { status: 400 }
          );
        }
        const updatedItem = await Collection.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!updatedItem) {
          return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: updatedItem });

      case 'delete':
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'ID is required for deletion' },
            { status: 400 }
          );
        }
        const deletedItem = await Collection.findByIdAndDelete(id);
        if (!deletedItem) {
          return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database operation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
