import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  return NextResponse.json({ valid: true }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    // Verify the token
    verify(token, JWT_SECRET);

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
