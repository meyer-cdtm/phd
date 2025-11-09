export interface Question {
  id: string;
  question: string;
  tip: string;
  type: string;
  difficulty: string;
  courseId: string;
  isPublished: boolean;
  created: string | null;
  previousVersionId: string;
  deleted: string | null;
  topicId: string;
  originalVersionId: string;
  language: string;
}

export interface Answer {
  id: string;
  answerId: string;
  answer: string;
  questionId: string;
  isCorrect: boolean;
}

export interface QuestionWithAnswers extends Question {
  answers: Answer[];
  versions: VersionInfo[];
  isDeleted: boolean;
  isBulkDelete: boolean;
  bulkDeleteInfo?: BulkDeleteInfo;
}

export interface VersionInfo {
  id: string;
  created: string | null;
  question: string;
  tip: string;
  isNext?: boolean;
}

export interface BulkDeleteInfo {
  count: number;
  questions: Array<{
    id: string;
    question: string;
  }>;
}

export interface Stats {
  totalQuestions: number;
  deletedQuestions: number;
  bulkDeletes: number;
  publishedQuestions: number;
  totalAnswers: number;
}
