import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// Configure route for static export
export const dynamic = 'error';
export const dynamicParams = false;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  return new Response(
    'This API route is not available in static export. Please use client-side token verification.',
    { status: 404 }
  );
}

export async function POST(request: Request) {
  return new Response(
    'This API route is not available in static export. Please use client-side token verification.',
    { status: 404 }
  );
}
