'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuestionWithAnswers, VersionInfo } from '@/lib/types';
import { format } from 'date-fns';
import { VersionModal } from './VersionModal';

interface QuestionCardProps {
  question: QuestionWithAnswers;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), 'PPpp');
  } catch {
    return dateStr;
  }
}

export function QuestionCard({ question }: QuestionCardProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);

  return (
    <>
      {selectedVersion && (
        <VersionModal
          currentQuestion={question}
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}
      <div className="bg-white rounded-lg shadow p-6 mb-5">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">
          {question.question}
        </h3>
        <div className="flex flex-wrap gap-2 ml-4">
          {question.isDeleted && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              DELETED
            </span>
          )}
          {question.isBulkDelete && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              BULK DELETE
            </span>
          )}
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              question.isPublished
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {question.isPublished ? 'Published' : 'Unpublished'}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {question.difficulty}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            {question.type}
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <p>
          <strong>ID:</strong> {question.id}
        </p>
        <p>
          <strong>Created:</strong> {formatDate(question.created)}
        </p>
        {question.deleted && (
          <p>
            <strong>Deleted:</strong> {formatDate(question.deleted)}
          </p>
        )}
        <p>
          <strong>Language:</strong> {question.language}
        </p>
      </div>

      {question.tip && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 text-sm text-gray-700">
          <strong>Tip:</strong> {question.tip}
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Answer Options ({question.answers.length}):
        </h4>
        <div className="space-y-2">
          {question.answers.map((answer) => (
            <div
              key={answer.answerId}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                answer.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span className="text-lg font-bold flex-shrink-0">
                {answer.isCorrect ? '✓' : '○'}
              </span>
              <div className="flex-1 prose prose-sm max-w-none">
                <ReactMarkdown>{answer.answer}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>

      {question.versions.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Version History ({question.versions.length}):
          </h4>
          <div className="space-y-2">
            {question.versions.map((version) => (
              <button
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className="w-full bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-sm text-left transition-colors border border-gray-200 hover:border-blue-300"
              >
                <div className="text-gray-600">
                  {version.isNext ? '→' : '←'}{' '}
                  <strong>{version.id.substring(0, 8)}...</strong> -{' '}
                  {formatDate(version.created)}
                </div>
                <div className="text-gray-700 mt-1">
                  {version.question.substring(0, 100)}...
                </div>
                <div className="text-blue-600 text-xs mt-1">
                  Click to view changes
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {question.bulkDeleteInfo && (
        <div className="border-t pt-4 mt-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">
              ⚠ Part of Bulk Delete
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              {question.bulkDeleteInfo.count} other question(s) deleted within 10 seconds:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {question.bulkDeleteInfo.questions.map((q) => (
                <li key={q.id}>{q.question}...</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
