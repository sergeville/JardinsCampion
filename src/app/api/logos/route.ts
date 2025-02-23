import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import LogoModel from '@/models/Logo';

export const dynamic = 'error';
export const dynamicParams = false;

export async function POST(request: NextRequest) {
  return new NextResponse(
    JSON.stringify({
      error: 'This API route is not available in static export. Please use client-side data management instead.',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function GET() {
  return new NextResponse(
    JSON.stringify({
      error: 'This API route is not available in static export. Please use client-side data management instead.',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function DELETE(request: NextRequest) {
  return new NextResponse(
    JSON.stringify({
      error: 'This API route is not available in static export. Please use client-side data management instead.',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
