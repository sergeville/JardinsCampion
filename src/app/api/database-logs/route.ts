import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    const logs = await DatabaseService.getLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch database logs' },
      { status: 500 }
    );
  }
}
