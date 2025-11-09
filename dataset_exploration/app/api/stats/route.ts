import { NextResponse } from 'next/server';
import { getStats } from '@/lib/data-loader';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error loading stats:', error);
    return NextResponse.json(
      { error: 'Failed to load statistics' },
      { status: 500 }
    );
  }
}
