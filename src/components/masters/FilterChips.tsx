'use client';

import { useMemo } from 'react';
import type { SearchFiltersValue } from '@/types';

export interface FilterChipsProps {
  filters: SearchFiltersValue;
  onChange: (next: SearchFiltersValue) => void;
  onClearAll: () => void;
}

export default function FilterChips({ filters, onChange, onClearAll }: FilterChipsProps) {
  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.q?.trim()) count++;
    if (filters.city?.trim()) count++;
    if (filters.service?.trim()) count++;
    if (filters.price && filters.price !== 'all') count++;
    if (filters.languages?.length) count += filters.languages.length;
    return count;
  }, [filters]);

  // Helper to check if any filter is active
  const hasActiveFilters = activeFiltersCount > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header with count and clear all */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Filters active: {activeFiltersCount}
        </span>
        <button
          onClick={onClearAll}
          className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-pink-200 rounded"
        >
          Clear all
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {/* Search query chip */}
        {filters.q?.trim() && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-pink-50 border border-pink-200 text-pink-800">
            <span>Search: "{filters.q}"</span>
            <button
              onClick={() => onChange({ ...filters, q: "" })}
              aria-label={`Remove search filter "${filters.q}"`}
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-pink-400 hover:bg-pink-200 hover:text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        )}

        {/* City chip */}
        {filters.city?.trim() && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-blue-50 border border-blue-200 text-blue-800">
            <span>City: {filters.city}</span>
            <button
              onClick={() => onChange({ ...filters, city: "" })}
              aria-label={`Remove city filter "${filters.city}"`}
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        )}

        {/* Service chip */}
        {filters.service?.trim() && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-green-50 border border-green-200 text-green-800">
            <span>Service: {filters.service}</span>
            <button
              onClick={() => onChange({ ...filters, service: "" })}
              aria-label={`Remove service filter "${filters.service}"`}
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        )}

        {/* Language chips */}
        {filters.languages?.map((language) => (
          <span
            key={language}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-purple-50 border border-purple-200 text-purple-800"
          >
            <span>Language: {language}</span>
            <button
              onClick={() => onChange({ ...filters, languages: filters.languages.filter(l => l !== language) })}
              aria-label={`Remove language filter "${language}"`}
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}

        {/* Price chip */}
        {filters.price && filters.price !== 'all' && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-orange-50 border border-orange-200 text-orange-800">
            <span>Rating: {filters.price}+ Stars</span>
            <button
              onClick={() => onChange({ ...filters, price: "all" })}
              aria-label="Remove rating filter"
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-orange-400 hover:bg-orange-200 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
