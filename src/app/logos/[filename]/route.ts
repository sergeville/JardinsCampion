import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import LogoModel from '@/models/Logo';

export const dynamic = 'error';
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { filename: 'Logo1.png' },
    { filename: 'Logo2.png' },
    { filename: 'Logo3.png' },
    { filename: 'Logo4.png' },
    { filename: 'Logo6.png' }
  ];
}

export async function GET(request: NextRequest) {
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
