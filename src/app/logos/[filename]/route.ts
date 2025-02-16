import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LogoModel from '@/models/Logo';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const filename = request.url.split('/').pop();
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Extract the logo value from the filename
    const value = filename.replace(/\.(png|jpg|jpeg|gif|svg)$/i, '');

    // Find the logo in the database
    const logo = await LogoModel.findActiveLogo(value);

    if (!logo) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    const response = new NextResponse(logo.src);

    // Return the image with appropriate content type
    return response;
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json({ error: 'Error fetching logo' }, { status: 500 });
  }
}
