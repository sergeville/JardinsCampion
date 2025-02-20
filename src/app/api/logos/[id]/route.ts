import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import LogoModel from '@/models/Logo';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const id = request.url.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Logo ID is required' }, { status: 400 });
    }

    const result = await LogoModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json({ error: 'Error deleting logo' }, { status: 500 });
  }
}
