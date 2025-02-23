import { NextResponse } from 'next/server';

export const dynamic = 'error';
export const dynamicParams = false;

export async function POST(request: Request) {
  return new NextResponse(
    JSON.stringify({
      error: 'This API route is not available in static export. Please use client-side authentication instead.',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
