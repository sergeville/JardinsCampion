import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    // Generate a random CSRF token
    const token = randomBytes(32).toString('hex');

    // In a real application, you would store this token in a session or database
    // For testing purposes, we'll just return it
    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
}
