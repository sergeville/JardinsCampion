import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    // Here you would typically validate the refresh token
    // For testing purposes, we'll just issue a new token
    const token = sign(
      {
        sub: 'user123',
        name: 'Test User',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET
    );

    return NextResponse.json({ accessToken: token }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
  }
}
