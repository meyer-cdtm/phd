import { NextResponse } from 'next/server';
import { loadAllData } from '@/lib/data-loader';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { answers } = await loadAllData();
    const questionAnswers = answers.filter(a => a.id === id);
    return NextResponse.json(questionAnswers);
  } catch (error) {
    console.error('Error loading answers:', error);
    return NextResponse.json(
      { error: 'Failed to load answers' },
      { status: 500 }
    );
  }
}
