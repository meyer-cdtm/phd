'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuestionWithAnswers, VersionInfo, Answer } from '@/lib/types';
import { format } from 'date-fns';

interface VersionModalProps {
  currentQuestion: QuestionWithAnswers;
  version: VersionInfo;
  onClose: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), 'PPpp');
  } catch {
    return dateStr;
  }
}

function highlightDifferences(original: string, changed: string): React.ReactElement {
  if (original === changed) {
    return <span>{original}</span>;
  }

  // LCS-based word diff algorithm
  const originalWords = original.split(/\s+/);
  const changedWords = changed.split(/\s+/);

  // Helper to normalize word for comparison (strip trailing punctuation)
  const normalizeWord = (word: string) => word.replace(/[.,;:!?]+$/, '').toLowerCase();

  // Compute LCS (Longest Common Subsequence)
  const lcs: number[][] = Array(originalWords.length + 1)
    .fill(0)
    .map(() => Array(changedWords.length + 1).fill(0));

  for (let i = 1; i <= originalWords.length; i++) {
    for (let j = 1; j <= changedWords.length; j++) {
      if (normalizeWord(originalWords[i - 1]) === normalizeWord(changedWords[j - 1])) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to find the diff
  const result: React.ReactElement[] = [];
  let i = originalWords.length;
  let j = changedWords.length;
  let key = 0;

  const diff: Array<{ type: 'same' | 'removed' | 'added'; word: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalizeWord(originalWords[i - 1]) === normalizeWord(changedWords[j - 1])) {
      // Words match (ignoring punctuation), but check if punctuation changed
      if (originalWords[i - 1] === changedWords[j - 1]) {
        // Exact match, including punctuation
        diff.unshift({ type: 'same', word: originalWords[i - 1] });
      } else {
        // Word is same but punctuation changed - show both
        diff.unshift({ type: 'removed', word: originalWords[i - 1] });
        diff.unshift({ type: 'added', word: changedWords[j - 1] });
      }
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      diff.unshift({ type: 'added', word: changedWords[j - 1] });
      j--;
    } else if (i > 0) {
      diff.unshift({ type: 'removed', word: originalWords[i - 1] });
      i--;
    }
  }

  // Render the diff
  diff.forEach((item) => {
    if (item.type === 'same') {
      result.push(<span key={key++}>{item.word} </span>);
    } else if (item.type === 'removed') {
      result.push(
        <span key={key++} className="bg-red-200 line-through">
          {item.word}{' '}
        </span>
      );
    } else if (item.type === 'added') {
      result.push(
        <span key={key++} className="bg-green-200">
          {item.word}{' '}
        </span>
      );
    }
  });

  return <>{result}</>;
}

export function VersionModal({ currentQuestion, version, onClose }: VersionModalProps) {
  const [versionAnswers, setVersionAnswers] = useState<Answer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);

  // Load answers for the version
  useEffect(() => {
    fetch(`/api/questions/${version.id}/answers`)
      .then(r => r.json())
      .then(answers => {
        setVersionAnswers(answers);
        setLoadingAnswers(false);
      })
      .catch(error => {
        console.error('Error loading version answers:', error);
        setLoadingAnswers(false);
      });
  }, [version.id]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const isNewer = version.isNext;
  const versionLabel = isNewer ? 'Newer Version' : 'Previous Version';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {versionLabel}: {version.id.substring(0, 12)}...
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(version.created)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Question Comparison */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Question Text</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {isNewer ? 'Current Version' : 'Current Version'}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-900">{currentQuestion.question}</p>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {versionLabel}
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-gray-900">{version.question}</p>
                </div>
              </div>
            </div>

            {/* Highlighted differences */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Changes Highlighted
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-yellow-200">
                <p className="text-gray-900 leading-relaxed">
                  {highlightDifferences(
                    isNewer ? currentQuestion.question : version.question,
                    isNewer ? version.question : currentQuestion.question
                  )}
                </p>
              </div>
              <div className="mt-2 text-xs text-gray-600 flex gap-4">
                <span>
                  <span className="inline-block w-4 h-4 bg-red-200 border align-middle mr-1"></span>
                  Removed
                </span>
                <span>
                  <span className="inline-block w-4 h-4 bg-green-200 border align-middle mr-1"></span>
                  Added
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Comparison */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata Changes</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Version ID:</span>
                  <br />
                  <span className="text-gray-600">{version.id}</span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <br />
                  <span className="text-gray-600">{formatDate(version.created)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tip Comparison */}
          {(currentQuestion.tip || version.tip) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tip Comparison</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Current Version
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    currentQuestion.tip === version.tip
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    {currentQuestion.tip ? (
                      <p className="text-gray-700">{currentQuestion.tip}</p>
                    ) : (
                      <p className="text-gray-400 italic">No tip</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {isNewer ? 'Newer' : 'Previous'} Version
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    currentQuestion.tip === version.tip
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    {version.tip ? (
                      <p className="text-gray-700">{version.tip}</p>
                    ) : (
                      <p className="text-gray-400 italic">No tip</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="mt-3">
                {currentQuestion.tip === version.tip ? (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">
                    ✓ <strong>No changes</strong> - Tips are identical
                  </div>
                ) : (
                  <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded">
                    ⚠ <strong>Changed</strong> - Tips are different
                  </div>
                )}
              </div>

              {/* Highlighted differences for tips */}
              {currentQuestion.tip && version.tip && currentQuestion.tip !== version.tip && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Changes Highlighted
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-yellow-200">
                    <p className="text-gray-900 leading-relaxed">
                      {highlightDifferences(
                        isNewer ? currentQuestion.tip : version.tip,
                        isNewer ? version.tip : currentQuestion.tip
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Answers Comparison */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Answer Options Comparison
            </h3>

            {loadingAnswers ? (
              <div className="text-center py-8 text-gray-600">
                Loading version answers...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Answers */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Current Version ({currentQuestion.answers.length} answers)
                  </div>
                  <div className="space-y-2">
                    {currentQuestion.answers.map((answer) => (
                      <div
                        key={answer.answerId}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-sm ${
                          answer.isCorrect
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span className="font-bold flex-shrink-0">
                          {answer.isCorrect ? '✓' : '○'}
                        </span>
                        <div className="flex-1 prose prose-sm max-w-none">
                          <ReactMarkdown>{answer.answer}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Version Answers */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {isNewer ? 'Newer' : 'Previous'} Version ({versionAnswers.length} answers)
                  </div>
                  {versionAnswers.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-gray-600">
                      No answer options found for this version
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {versionAnswers.map((answer) => (
                        <div
                          key={answer.answerId}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-sm ${
                            answer.isCorrect
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <span className="font-bold flex-shrink-0">
                            {answer.isCorrect ? '✓' : '○'}
                          </span>
                          <div className="flex-1 prose prose-sm max-w-none">
                            <ReactMarkdown>{answer.answer}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Answer Changes Summary */}
            {!loadingAnswers && versionAnswers.length > 0 && (() => {
              // Check if answers are identical by content (not by answerId)
              // Sort both arrays by answer text and correctness for comparison
              const sortedCurrent = [...currentQuestion.answers].sort((a, b) => {
                if (a.answer !== b.answer) return a.answer.localeCompare(b.answer);
                return a.isCorrect === b.isCorrect ? 0 : a.isCorrect ? -1 : 1;
              });
              const sortedVersion = [...versionAnswers].sort((a, b) => {
                if (a.answer !== b.answer) return a.answer.localeCompare(b.answer);
                return a.isCorrect === b.isCorrect ? 0 : a.isCorrect ? -1 : 1;
              });

              const answersIdentical =
                sortedCurrent.length === sortedVersion.length &&
                sortedCurrent.every((currentAnswer, index) => {
                  const versionAnswer = sortedVersion[index];
                  return (
                    currentAnswer.answer === versionAnswer.answer &&
                    currentAnswer.isCorrect === versionAnswer.isCorrect
                  );
                });

              return (
                <div className="mt-4">
                  {answersIdentical ? (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded">
                      ✓ <strong>No changes</strong> - Answer options are identical
                    </div>
                  ) : (
                    <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded">
                      ⚠ <strong>Changed</strong> - Answer options are different
                      {currentQuestion.answers.length !== versionAnswers.length && (
                        <span className="ml-2">
                          (Count changed from {versionAnswers.length} to {currentQuestion.answers.length})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
