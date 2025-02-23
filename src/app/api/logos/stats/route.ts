import { NextResponse } from 'next/server';

// Configure route for static export
export const dynamic = 'error';
export const dynamicParams = false;

export async function GET() {
  return new Response(
    'This API route is not available in static export. Please use client-side data fetching.',
    { status: 404 }
  );
}
