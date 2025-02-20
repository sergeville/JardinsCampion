import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import VoteModel from '@/models/Vote';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const id = request.url.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Vote ID is required' }, { status: 400 });
    }

    const result = await VoteModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Vote deleted successfully' });
  } catch (error) {
    console.error('Error deleting vote:', error);
    return NextResponse.json({ error: 'Error deleting vote' }, { status: 500 });
  }
}
