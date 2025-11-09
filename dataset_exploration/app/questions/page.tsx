'use client';

import { useEffect, useState } from 'react';
import { QuestionWithAnswers, Stats } from '@/lib/types';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar } from '@/components/FilterBar';
import { QuestionCard } from '@/components/QuestionCard';
import { Pagination } from '@/components/Pagination';

const QUESTIONS_PER_PAGE = 10;

export default function Home() {
  const [allQuestions, setAllQuestions] = useState<QuestionWithAnswers[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionWithAnswers[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Load data
  useEffect(() => {
    Promise.all([
      fetch('/api/questions').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ])
      .then(([questions, statsData]) => {
        setAllQuestions(questions);
        setStats(statsData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = allQuestions;

    // Status filter
    if (statusFilter === 'deleted') {
      filtered = filtered.filter((q) => q.isDeleted);
    } else if (statusFilter === 'bulk') {
      filtered = filtered.filter((q) => q.isBulkDelete);
    } else if (statusFilter === 'published') {
      filtered = filtered.filter((q) => q.isPublished);
    } else if (statusFilter === 'unpublished') {
      filtered = filtered.filter((q) => !q.isPublished);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((q) => q.question.toLowerCase().includes(search));
    }

    setFilteredQuestions(filtered);
    setCurrentPage(0);
  }, [allQuestions, statusFilter, difficultyFilter, searchText]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Question Viewer</h1>
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const start = currentPage * QUESTIONS_PER_PAGE;
  const end = start + QUESTIONS_PER_PAGE;
  const pageQuestions = filteredQuestions.slice(start, end);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Question Viewer</h1>

        <StatsBar stats={stats} />

        <FilterBar
          statusFilter={statusFilter}
          difficultyFilter={difficultyFilter}
          searchText={searchText}
          onStatusFilterChange={setStatusFilter}
          onDifficultyFilterChange={setDifficultyFilter}
          onSearchTextChange={setSearchText}
        />

        {pageQuestions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No questions match your filters</p>
          </div>
        ) : (
          <>
            {pageQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredQuestions.length}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
