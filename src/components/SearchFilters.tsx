'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import CityAutocompleteStandalone from './CityAutocompleteStandalone';
import ServiceAutocomplete from './ServiceAutocomplete';
import Portal from './ui/Portal';
import FilterChips from './masters/FilterChips';
import type { SearchFiltersValue } from '@/types';



// Predefined languages list
const PREDEFINED_LANGUAGES = [
  "English",
  "French", 
  "Russian",
  "Ukrainian",
  "Polish",
  "Portuguese",
  "Spanish",
  "Italian",
  "German",
  "Mandarin Chinese",
  "Cantonese",
  "Punjabi",
  "Hindi",
  "Tagalog (Filipino)",
  "Korean",
  "Japanese",
  "Vietnamese",
  "Arabic",
  "Persian (Farsi)",
  "Turkish"
];

type Props = {
 value: SearchFiltersValue;
 onChange: (value: SearchFiltersValue) => void;
 className?: string;
};

export default function SearchFilters({ value, onChange, className }: Props) {
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState(value.service);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    control,
    watch,
    setValue,
    handleSubmit
  } = useForm<SearchFiltersValue>({
    defaultValues: value
  });

  const watchedValues = watch();

  // Debounced search update for all fields
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onChange(watchedValues);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [watchedValues, onChange]);

  // Handle service selection
  const handleServiceSelect = useCallback((service: string) => {
    setSelectedService(service);
    setValue('service', service);
  }, [setValue]);

  // Handle language selection
  const handleLanguageToggle = useCallback((language: string) => {
    const currentLanguages = watchedValues.languages || [];
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(l => l !== language)
      : [...currentLanguages, language];
    
    setValue('languages', newLanguages);
  }, [setValue, watchedValues.languages]);

  // Handle clicks outside language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    const clearedValues: SearchFiltersValue = {
      q: '',
      city: '',
      service: '',
      languages: [],
      price: 'all',
    };
    setValue('q', '');
    setValue('city', '');
    setValue('service', '');
    setValue('languages', []);
    setValue('price', 'all');
    setSelectedService('');
    onChange(clearedValues);
  }, [onChange, setValue]);

 const update = (key: keyof SearchFiltersValue) => 
 (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
 onChange({ ...value, [key]: e.target.value });
 };

 return (
    <form className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <Controller
          name="q"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              placeholder="Search by name, city, or service..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          )}
        />
      </div>

      {/* City Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <div data-testid="filter-city">
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <CityAutocompleteStandalone
                value={field.value}
                onChange={(city) => field.onChange(city)}
              />
            )}
          />
        </div>
      </div>

      {/* Service Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Service
        </label>
        <div data-testid="filter-service">
          <ServiceAutocomplete
            onSelect={handleServiceSelect}
            placeholder="Type to search services..."
          />
          {selectedService && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                {selectedService}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedService('');
                    setValue('service', '');
                  }}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-pink-400 hover:bg-pink-200 hover:text-pink-500 focus:outline-none focus:bg-pink-200"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Language Filter */}
      <div className="relative" ref={languageDropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Languages
        </label>
        <div data-testid="filter-language">
          <button
            type="button"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-left focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 flex items-center justify-between"
          >
          <span className={watchedValues.languages && watchedValues.languages.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
            {watchedValues.languages && watchedValues.languages.length > 0 
              ? `${watchedValues.languages.length} selected`
              : 'Select languages...'
            }
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Language Dropdown via Portal */}
        {showLanguageDropdown && languageDropdownRef.current && (
          <Portal>
            <div
              className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              style={{
                top: languageDropdownRef.current.getBoundingClientRect().bottom + window.scrollY + 4,
                left: languageDropdownRef.current.getBoundingClientRect().left + window.scrollX,
                width: languageDropdownRef.current.getBoundingClientRect().width,
              }}
            >
              {PREDEFINED_LANGUAGES.map((language) => (
                <label
                  key={language}
                  className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={watchedValues.languages?.includes(language) || false}
                    onChange={() => handleLanguageToggle(language)}
                    className="mr-3 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  {language}
                </label>
              ))}
            </div>
          </Portal>
        )}

        {/* Selected Languages Tags */}
        {watchedValues.languages && watchedValues.languages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {watchedValues.languages.map((language) => (
              <span
                key={language}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
              >
                {language}
                <button
                  type="button"
                  onClick={() => handleLanguageToggle(language)}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-pink-400 hover:bg-pink-200 hover:text-pink-500 focus:outline-none focus:bg-pink-200"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Rating
        </label>
        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="all">All Ratings</option>
              <option value="4.4">4.4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="5">5.0 Stars</option>
            </select>
          )}
        />
      </div>

      {/* Filter Chips */}
      <FilterChips
        filters={watchedValues}
        onChange={onChange}
        onClearAll={handleClearAll}
      />
    </form>
  );
}