'use client';

interface FilterBarProps {
  statusFilter: string;
  difficultyFilter: string;
  searchText: string;
  onStatusFilterChange: (value: string) => void;
  onDifficultyFilterChange: (value: string) => void;
  onSearchTextChange: (value: string) => void;
}

export function FilterBar({
  statusFilter,
  difficultyFilter,
  searchText,
  onStatusFilterChange,
  onDifficultyFilterChange,
  onSearchTextChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm text-gray-600 whitespace-nowrap">
            Filter:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Questions</option>
            <option value="deleted">Deleted Only</option>
            <option value="bulk">Bulk Deletes</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="difficulty-filter" className="text-sm text-gray-600 whitespace-nowrap">
            Difficulty:
          </label>
          <select
            id="difficulty-filter"
            value={difficultyFilter}
            onChange={(e) => onDifficultyFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <label htmlFor="search-text" className="text-sm text-gray-600 whitespace-nowrap">
            Search:
          </label>
          <input
            type="text"
            id="search-text"
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            placeholder="Search questions..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
