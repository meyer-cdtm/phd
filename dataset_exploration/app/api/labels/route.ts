import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';

const CSV_PATH = path.join(process.cwd(), '../data/v0/judge_prompts.csv');

interface LabelRow {
  QuestionId: string;
  QuestionText: string;
  Type: string;
  Difficulty: string;
  IsDeleted: string;
  HasPreviousVersion: string;
  IsPublished: string;
  JudgePrompt: string;
  EvaluationCriteria: string;
  PassFail: string;
  Reasoning: string;
  Created: string;
}

interface JudgeLabel {
  questionId: string;
  passFail: string;
  reasoning: string;
}

// GET - Fetch all existing labels
export async function GET() {
  try {
    const fileContent = await fs.readFile(CSV_PATH, 'utf-8');
    const parsed = Papa.parse<LabelRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    const rows = parsed.data;

    const labels: JudgeLabel[] = rows
      .filter((row) => row.QuestionId && row.PassFail)
      .map((row) => ({
        questionId: row.QuestionId,
        passFail: row.PassFail,
        reasoning: row.Reasoning || '',
      }));

    return NextResponse.json(labels);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if ((error as any).code === 'ENOENT') {
      return NextResponse.json([]);
    }
    console.error('Error reading labels:', error);
    return NextResponse.json({ error: 'Failed to load labels' }, { status: 500 });
  }
}

// POST - Save or update a label
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionId, passFail, reasoning } = body as JudgeLabel;

    if (!questionId || !passFail) {
      return NextResponse.json(
        { error: 'questionId and passFail are required' },
        { status: 400 }
      );
    }

    // Read existing CSV
    let rows: LabelRow[] = [];
    try {
      const fileContent = await fs.readFile(CSV_PATH, 'utf-8');
      const parsed = Papa.parse<LabelRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
      });
      rows = parsed.data;
    } catch (error) {
      // File doesn't exist yet, that's ok
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    // Find if this question already has a row
    const existingIndex = rows.findIndex((row) => row.QuestionId === questionId);

    if (existingIndex >= 0) {
      // Update existing row
      rows[existingIndex].PassFail = passFail;
      rows[existingIndex].Reasoning = reasoning || '';
    } else {
      // Add new row - we'll need to fetch question details
      const questionsResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/questions`);
      const questions = await questionsResponse.json();
      const question = questions.find((q: any) => q.id === questionId);

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      // Format question text with answers
      const correctAnswers = question.answers.filter((a: any) => a.isCorrect);
      const incorrectAnswers = question.answers.filter((a: any) => !a.isCorrect);

      let questionText = `Question: ${question.question}\n`;
      if (question.tip) questionText += `Tip: ${question.tip}\n`;
      questionText += `\nCorrect Answer(s):\n${correctAnswers.map((a: any) => `- ${a.answer}`).join('\n')}`;
      if (incorrectAnswers.length > 0) {
        questionText += `\n\nIncorrect Answer(s):\n${incorrectAnswers.map((a: any) => `- ${a.answer}`).join('\n')}`;
      }

      const newRow: LabelRow = {
        QuestionId: questionId,
        QuestionText: questionText,
        Type: question.type || '',
        Difficulty: question.difficulty || '',
        IsDeleted: question.isDeleted ? 'true' : 'false',
        HasPreviousVersion: question.previousVersionId ? 'true' : 'false',
        IsPublished: question.isPublished ? 'true' : 'false',
        JudgePrompt: '',
        EvaluationCriteria: '',
        PassFail: passFail,
        Reasoning: reasoning || '',
        Created: new Date().toISOString(),
      };

      rows.push(newRow);
    }

    // Write back to CSV
    const csvContent = Papa.unparse(rows, {
      columns: [
        'QuestionId',
        'QuestionText',
        'Type',
        'Difficulty',
        'IsDeleted',
        'HasPreviousVersion',
        'IsPublished',
        'JudgePrompt',
        'EvaluationCriteria',
        'PassFail',
        'Reasoning',
        'Created',
      ],
    });

    await fs.writeFile(CSV_PATH, csvContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving label:', error);
    return NextResponse.json({ error: 'Failed to save label' }, { status: 500 });
  }
}
