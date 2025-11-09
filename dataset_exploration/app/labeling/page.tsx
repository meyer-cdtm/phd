'use client';

import { useEffect, useState } from 'react';
import { QuestionWithAnswers, VersionInfo } from '@/lib/types';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { VersionModal } from '@/components/VersionModal';

interface JudgeLabel {
  questionId: string;
  passFail: string;
  reasoning: string;
  judgePrompt: string;
}

interface ConfirmationData {
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  reasoning: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), 'PPpp');
  } catch {
    return dateStr;
  }
}

function generateJudgePrompt(question: QuestionWithAnswers, reasoning?: string, label?: string): string {
  const isFreeText = question.type === 'FreeText' || question.type === 'free-text';

  // TODO: Add few-shot examples here when available

  let prompt = `Question: ${question.question}
${question.tip ? `Tip: ${question.tip}\n` : ''}Type: ${question.type}
Difficulty: ${question.difficulty}

${isFreeText
  ? `Correct Answer:\n${question.answers[0]?.answer || 'N/A'}`
  : `Answer Options:\n${question.answers.map((answer, idx) => `${String.fromCharCode(65 + idx)}. ${answer.answer}${answer.isCorrect ? ' [CORRECT ANSWER]' : ' [INCORRECT ANSWER]'}`).join('\n')}`
}`;

  if (reasoning) {
    prompt += `\n\nReasoning: ${reasoning}`;
  }

  if (label) {
    prompt += `\nLabel: ${label}`;
  }

  return prompt;
}

export default function LabelingPage() {
  const [allQuestions, setAllQuestions] = useState<QuestionWithAnswers[]>([]);
  const [labels, setLabels] = useState<Map<string, JudgeLabel>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);

  // Load questions and existing labels
  useEffect(() => {
    Promise.all([
      fetch('/api/questions').then((r) => r.json()),
      fetch('/api/labels').then((r) => r.json()),
    ])
      .then(([questions, existingLabels]) => {
        setAllQuestions(questions);
        const labelMap = new Map<string, JudgeLabel>();
        existingLabels.forEach((label: JudgeLabel) => {
          labelMap.set(label.questionId, label);
        });
        setLabels(labelMap);

        // Find first unlabeled question
        const firstUnlabeled = questions.findIndex(
          (q: QuestionWithAnswers) => !labelMap.has(q.id)
        );
        setCurrentQuestionIndex(firstUnlabeled >= 0 ? firstUnlabeled : 0);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
  }, []);

  const currentQuestion = currentQuestionIndex !== null ? allQuestions[currentQuestionIndex] : null;
  const currentLabel = currentQuestion ? labels.get(currentQuestion.id) : null;

  // Load existing reasoning if viewing labeled question
  useEffect(() => {
    if (currentLabel) {
      setReasoning(currentLabel.reasoning);
    } else {
      setReasoning('');
    }
  }, [currentQuestionIndex, currentLabel]);

  const handleLabelClick = (status: 'PASS' | 'FAIL' | 'UNKNOWN') => {
    setConfirmationData({ status, reasoning: reasoning.trim() });
  };

  const handleConfirmLabel = async () => {
    if (!currentQuestion || !confirmationData) return;

    setSaving(true);
    try {
      const label: JudgeLabel = {
        questionId: currentQuestion.id,
        passFail: confirmationData.status,
        reasoning: confirmationData.reasoning,
        judgePrompt: generateJudgePrompt(currentQuestion, confirmationData.reasoning, confirmationData.status),
      };

      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(label),
      });

      if (!response.ok) throw new Error('Failed to save label');

      // Update local state
      const newLabels = new Map(labels);
      newLabels.set(currentQuestion.id, label);
      setLabels(newLabels);

      // Close confirmation modal
      setConfirmationData(null);

      // Move to next unlabeled question or stay if updating
      if (!currentLabel && currentQuestionIndex !== null) {
        const nextUnlabeled = allQuestions.findIndex(
          (q, idx) => idx > currentQuestionIndex && !newLabels.has(q.id)
        );
        if (nextUnlabeled >= 0) {
          setCurrentQuestionIndex(nextUnlabeled);
        }
      }
    } catch (error) {
      console.error('Error saving label:', error);
      alert('Failed to save label. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setShowMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-12 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Done!</h2>
          <p className="text-gray-600 mb-6">You've labeled all questions.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowMenu(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Review Labels
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const labeledCount = labels.size;
  const totalCount = allQuestions.length;
  const progress = totalCount > 0 ? (labeledCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {selectedVersion && (
        <VersionModal
          currentQuestion={currentQuestion}
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmationData && currentQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Confirm Label</h2>
              <p className="text-gray-600 mt-1">Please review all details before submitting</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Label Status */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                <h3 className="font-semibold text-gray-700 mb-2">Selected Label:</h3>
                <span
                  className={`inline-block px-4 py-2 text-lg font-bold rounded ${
                    confirmationData.status === 'PASS'
                      ? 'bg-green-600 text-white'
                      : confirmationData.status === 'FAIL'
                      ? 'bg-red-600 text-white'
                      : 'bg-yellow-600 text-white'
                  }`}
                >
                  {confirmationData.status}
                </span>
              </div>

              {/* Question Text - Full question with all answer options */}
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <h3 className="font-semibold text-blue-900 mb-3">Question Text:</h3>
                <div className="space-y-3">
                  <p className="text-gray-900 font-medium">{currentQuestion.question}</p>

                  {currentQuestion.tip && (
                    <div className="bg-blue-100 p-3 rounded border border-blue-200">
                      <span className="text-sm font-semibold text-blue-900">Tip: </span>
                      <span className="text-sm text-gray-900">{currentQuestion.tip}</span>
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-semibold text-blue-900">
                      {currentQuestion.type === 'FreeText' ? 'Expected Answer:' : 'Answer Options:'}
                    </p>
                    {currentQuestion.type === 'FreeText' ? (
                      <div className="bg-green-100 border border-green-300 p-3 rounded">
                        <div className="text-sm prose prose-sm max-w-none">
                          <ReactMarkdown>{currentQuestion.answers[0]?.answer || 'N/A'}</ReactMarkdown>
                        </div>
                        <span className="text-green-700 font-bold text-sm mt-2 inline-block">✓ CORRECT ANSWER</span>
                      </div>
                    ) : (
                      currentQuestion.answers.map((answer, idx) => (
                        <div
                          key={answer.answerId}
                          className={`flex items-start gap-2 p-2 rounded ${
                            answer.isCorrect
                              ? 'bg-green-100 border border-green-300'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <span className="text-sm font-bold flex-shrink-0 mt-0.5">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <div className="flex-1 text-sm prose prose-sm max-w-none">
                            <ReactMarkdown>{answer.answer}</ReactMarkdown>
                          </div>
                          {answer.isCorrect && (
                            <span className="text-green-700 font-bold text-sm flex-shrink-0">✓ CORRECT</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Judge Prompt - Formatted evaluation template */}
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
                <h3 className="font-semibold text-purple-900 mb-3">Judge Prompt:</h3>
                <div className="bg-white p-4 rounded border border-purple-200 font-mono text-xs whitespace-pre-wrap text-gray-900">
                  {generateJudgePrompt(currentQuestion, confirmationData.reasoning, confirmationData.status)}
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                <h3 className="font-semibold text-gray-700 mb-2">Additional Metadata:</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="font-medium">ID:</span> {currentQuestion.id}</div>
                  <div><span className="font-medium">Course ID:</span> {currentQuestion.courseId}</div>
                  <div><span className="font-medium">Topic ID:</span> {currentQuestion.topicId}</div>
                  <div><span className="font-medium">Created:</span> {formatDate(currentQuestion.created)}</div>
                  {currentQuestion.deleted && (
                    <div className="col-span-2"><span className="font-medium">Deleted:</span> {formatDate(currentQuestion.deleted)}</div>
                  )}
                </div>
              </div>

              {/* Your Reasoning */}
              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                <h3 className="font-semibold text-yellow-900 mb-2">Your Reasoning:</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{confirmationData.reasoning}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-4">
              <button
                onClick={() => setConfirmationData(null)}
                disabled={saving}
                className="flex-1 py-3 bg-gray-600 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLabel}
                disabled={saving}
                className={`flex-1 py-3 text-white text-lg font-semibold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
                  confirmationData.status === 'PASS'
                    ? 'bg-green-600 hover:bg-green-700'
                    : confirmationData.status === 'FAIL'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {saving ? 'Saving...' : `Confirm ${confirmationData.status}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Home
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Question Labeling</h1>
              <p className="text-gray-600 mt-1">
                {labeledCount} / {totalCount} labeled ({progress.toFixed(1)}%)
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
          >
            {showMenu ? 'Close Menu' : 'Question Menu'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Menu */}
        {showMenu && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-6 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">All Questions</h2>
            <div className="grid grid-cols-10 gap-2">
              {allQuestions.map((q, idx) => {
                const isLabeled = labels.has(q.id);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`p-2 rounded text-sm font-medium ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : isLabeled
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                    title={`Question ${idx + 1}${isLabeled ? ' (labeled)' : ' (unlabeled)'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Labeled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span>Unlabeled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded ring-2 ring-blue-400"></div>
                <span>Current</span>
              </div>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Question {currentQuestionIndex !== null ? currentQuestionIndex + 1 : 0} / {totalCount}
              </span>
              {currentLabel && (
                <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                  Already Labeled: {currentLabel.passFail}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.isDeleted && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  DELETED
                </span>
              )}
              {currentQuestion.isBulkDelete && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  BULK DELETE
                </span>
              )}
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  currentQuestion.isPublished
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {currentQuestion.isPublished ? 'Published' : 'Unpublished'}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {currentQuestion.difficulty}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                {currentQuestion.type}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentQuestion.question}
          </h3>

          <div className="text-sm text-gray-600 mb-4">
            <p><strong>ID:</strong> {currentQuestion.id}</p>
            <p><strong>Created:</strong> {formatDate(currentQuestion.created)}</p>
            {currentQuestion.deleted && (
              <p><strong>Deleted:</strong> {formatDate(currentQuestion.deleted)}</p>
            )}
            <p><strong>Language:</strong> {currentQuestion.language}</p>
          </div>

          {currentQuestion.tip && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 text-sm text-gray-700">
              <strong>Tip:</strong> {currentQuestion.tip}
            </div>
          )}

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Answer Options ({currentQuestion.answers.length}):
            </h4>
            <div className="space-y-2">
              {currentQuestion.answers.map((answer) => (
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

          {currentQuestion.versions.length > 0 && (
            <div className="border-t pt-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Version History ({currentQuestion.versions.length}):
              </h4>
              <div className="space-y-2">
                {currentQuestion.versions.map((version) => (
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

          {currentQuestion.bulkDeleteInfo && (
            <div className="border-t pt-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                  ⚠ Part of Bulk Delete
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  {currentQuestion.bulkDeleteInfo.count} other question(s) deleted at the same time:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {currentQuestion.bulkDeleteInfo.questions.map((q) => (
                    <li key={q.id}>{q.question}...</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why is this a good or bad question? (Reasoning)
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Explain what makes this question good or bad..."
              disabled={saving}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleLabelClick('PASS')}
              disabled={saving || !reasoning.trim()}
              className="flex-1 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              PASS
            </button>
            <button
              onClick={() => handleLabelClick('UNKNOWN')}
              disabled={saving || !reasoning.trim()}
              className="flex-1 py-4 bg-yellow-600 text-white text-lg font-semibold rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              UNKNOWN
            </button>
            <button
              onClick={() => handleLabelClick('FAIL')}
              disabled={saving || !reasoning.trim()}
              className="flex-1 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              FAIL
            </button>
          </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => currentQuestionIndex !== null && setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === null || currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() =>
              currentQuestionIndex !== null && setCurrentQuestionIndex(Math.min(allQuestions.length - 1, currentQuestionIndex + 1))
            }
            disabled={currentQuestionIndex === null || currentQuestionIndex >= allQuestions.length - 1}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
