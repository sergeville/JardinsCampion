import { NextResponse } from 'next/server';

export async function GET() {
  // For now, return empty history
  const mockHistory: any[] = [];

  return NextResponse.json(mockHistory);
}
