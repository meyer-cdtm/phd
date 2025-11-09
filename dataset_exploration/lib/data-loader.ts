import Papa from 'papaparse';
import { promises as fs } from 'fs';
import path from 'path';
import { Question, Answer, QuestionWithAnswers, Stats } from './types';

const DATA_DIR = path.join(process.cwd(), '../data/v0');

interface CSVQuestion {
  ID: string;
  Question: string;
  Tip: string;
  Type: string;
  Difficulty: string;
  CourseId: string;
  IsPublished: string;
  Created: string;
  PreviousVersionId: string;
  Deleted: string;
  TopicId: string;
  OriginalVersionId: string;
  Language: string;
}

interface CSVAnswer {
  ID: string;
  'Answer → ID': string;
  'Answer → Answer': string;
  'Answer → QuestionId': string;
  'Answer → IsCorrect': string;
}

async function loadCSV<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, filename);
  const fileContent = await fs.readFile(filePath, 'utf-8');

  return new Promise((resolve, reject) => {
    Papa.parse<T>(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr);
  } catch {
    return null;
  }
}

function identifyBulkDeletes(questions: Question[]): Set<string> {
  const bulkDeleteIds = new Set<string>();
  const deletedQuestions = questions
    .filter(q => q.deleted)
    .sort((a, b) => {
      const dateA = parseDate(a.deleted!);
      const dateB = parseDate(b.deleted!);
      return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });

  for (let i = 0; i < deletedQuestions.length; i++) {
    const nearbyDeletes = deletedQuestions.filter((q, idx) => {
      if (idx === i) return false;
      // Compare deletion timestamps - must be exactly the same
      return q.deleted === deletedQuestions[i].deleted;
    });

    if (nearbyDeletes.length > 0) {
      bulkDeleteIds.add(deletedQuestions[i].id);
    }
  }

  return bulkDeleteIds;
}

export async function loadAllData(): Promise<{
  questions: Question[];
  answers: Answer[];
  bulkDeleteIds: Set<string>;
}> {
  const [csvQuestions, csvAnswers] = await Promise.all([
    loadCSV<CSVQuestion>('QuestionsGenerated_04_11.csv'),
    loadCSV<CSVAnswer>('AnswerOptions_04_11.csv'),
  ]);

  const questions: Question[] = csvQuestions.map(q => ({
    id: q.ID,
    question: q.Question,
    tip: q.Tip,
    type: q.Type,
    difficulty: q.Difficulty,
    courseId: q.CourseId,
    isPublished: q.IsPublished === 'true',
    created: q.Created || null,
    previousVersionId: q.PreviousVersionId,
    deleted: q.Deleted || null,
    topicId: q.TopicId,
    originalVersionId: q.OriginalVersionId,
    language: q.Language,
  }));

  const answers: Answer[] = csvAnswers.map(a => ({
    id: a.ID,
    answerId: a['Answer → ID'],
    answer: a['Answer → Answer'],
    questionId: a['Answer → QuestionId'],
    isCorrect: a['Answer → IsCorrect'] === 'true',
  }));

  const bulkDeleteIds = identifyBulkDeletes(questions);

  return { questions, answers, bulkDeleteIds };
}

export async function getQuestionsWithAnswers(): Promise<QuestionWithAnswers[]> {
  const { questions, answers, bulkDeleteIds } = await loadAllData();

  const questionMap = new Map(questions.map(q => [q.id, q]));
  const answersMap = new Map<string, Answer[]>();

  // Group answers by question ID
  answers.forEach(answer => {
    if (!answersMap.has(answer.id)) {
      answersMap.set(answer.id, []);
    }
    answersMap.get(answer.id)!.push(answer);
  });

  return questions.map(question => {
    const questionAnswers = answersMap.get(question.id) || [];

    // Find version history - traverse full chain
    const versions: any[] = [];

    // Find all previous versions by following the chain backwards
    let currentPrevId = question.previousVersionId;
    while (currentPrevId) {
      const prevQuestion = questionMap.get(currentPrevId);
      if (!prevQuestion) break;

      versions.push({
        id: prevQuestion.id,
        created: prevQuestion.created,
        question: prevQuestion.question,
        tip: prevQuestion.tip,
      });

      currentPrevId = prevQuestion.previousVersionId;
    }

    // Find all next versions by following the chain forwards
    const findNextVersions = (questionId: string) => {
      questions.forEach(q => {
        if (q.previousVersionId === questionId) {
          versions.push({
            id: q.id,
            created: q.created,
            question: q.question,
            tip: q.tip,
            isNext: true,
          });
          // Recursively find next versions of this version
          findNextVersions(q.id);
        }
      });
    };

    findNextVersions(question.id);

    // Find bulk delete companions
    let bulkDeleteInfo = undefined;
    const isDeleted = !!question.deleted;
    const isBulkDelete = bulkDeleteIds.has(question.id);

    if (isBulkDelete) {
      const nearbyDeletes = questions.filter(q => {
        if (q.id === question.id || !q.deleted) return false;
        // Compare deletion timestamps - must be exactly the same
        return q.deleted === question.deleted;
      });

      bulkDeleteInfo = {
        count: nearbyDeletes.length,
        questions: nearbyDeletes.slice(0, 10).map(q => ({
          id: q.id,
          question: q.question.substring(0, 100),
        })),
      };
    }

    return {
      ...question,
      answers: questionAnswers,
      versions,
      isDeleted,
      isBulkDelete,
      bulkDeleteInfo,
    };
  });
}

export async function getStats(): Promise<Stats> {
  const { questions, answers, bulkDeleteIds } = await loadAllData();

  return {
    totalQuestions: questions.length,
    deletedQuestions: questions.filter(q => q.deleted).length,
    bulkDeletes: bulkDeleteIds.size,
    publishedQuestions: questions.filter(q => q.isPublished).length,
    totalAnswers: answers.length,
  };
}
