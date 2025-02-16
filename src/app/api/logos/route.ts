import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import LogoModel from '@/models/Logo';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const alt = formData.get('alt') as string;

    if (!file || !name || !alt) {
      return NextResponse.json({ error: 'File, name, and alt text are required' }, { status: 400 });
    }

    if (alt.length < 10) {
      return NextResponse.json(
        { error: 'Alt text must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');

    // Generate src URL (you might want to adjust this based on your file storage strategy)
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const src = `/logos/${name.toLowerCase().replace(/\s+/g, '-')}.${fileExtension}`;

    // Connect to database
    await connectDB();

    // Create new logo document
    const logo = new LogoModel({
      value: name,
      src,
      alt,
      status: 'active',
      data: base64String,
      contentType: file.type,
      uploadedAt: new Date(),
      voteStats: {
        totalVotes: 0,
        uniqueVoters: 0,
      },
    });

    await logo.save();

    return NextResponse.json({
      message: 'Logo uploaded successfully',
      logo: {
        id: logo._id,
        src: logo.src,
        alt: logo.alt,
        status: logo.status,
        createdAt: logo.createdAt,
      },
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const logos = await LogoModel.find({}, { data: 0 }).sort({ uploadedAt: -1 });

    return NextResponse.json(logos);
  } catch (error) {
    console.error('Error fetching logos:', error);
    return NextResponse.json({ error: 'Failed to fetch logos' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Logo ID is required' }, { status: 400 });
    }

    await connectDB();
    const logo = await LogoModel.findById(id);

    if (!logo) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    await logo.deleteOne();

    return NextResponse.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 });
  }
}
