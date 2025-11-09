import { NextResponse } from 'next/server';
import { getQuestionsWithAnswers } from '@/lib/data-loader';

export async function GET() {
  try {
    const questions = await getQuestionsWithAnswers();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error loading questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}
