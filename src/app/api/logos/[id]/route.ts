import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import LogoModel from '@/models/Logo';

export const dynamic = 'error';
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' }
  ];
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
