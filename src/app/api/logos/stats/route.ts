import { NextResponse } from 'next/server';

export async function GET() {
  // For now, return mock data
  const mockStats = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };

  return NextResponse.json(mockStats);
}
