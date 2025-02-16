import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Here you would typically validate against your database
    // For testing purposes, we'll use a mock validation
    if (username === 'test' && password === 'password') {
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
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
