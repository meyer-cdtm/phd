'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPreviousPage,
  onNextPage,
}: PaginationProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
      <button
        onClick={onPreviousPage}
        disabled={currentPage === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        Previous
      </button>
      <span className="text-gray-700">
        Page {currentPage + 1} of {totalPages} ({totalItems} questions)
      </span>
      <button
        onClick={onNextPage}
        disabled={currentPage >= totalPages - 1}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
