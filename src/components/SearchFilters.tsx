'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import CityAutocomplete from './CityAutocomplete';
import Portal from './ui/Portal';
import FilterChips from './masters/FilterChips';
import { SERVICES } from '@/data/services';
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
  const [serviceInput, setServiceInput] = useState(value.service);
  const [searchInput, setSearchInput] = useState(value.q);
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [filteredServices, setFilteredServices] = useState<string[]>([]);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(-1);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  
  const serviceInputRef = useRef<HTMLInputElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search update for q field
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onChange({ ...value, q: searchInput });
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchInput, onChange, value]);

  // Filter services based on input
  useEffect(() => {
    if (!serviceInput.trim()) {
      setFilteredServices(SERVICES.slice(0, 12)); // Show first 12 when empty
    } else {
      const filtered = SERVICES.filter(service =>
        service.toLowerCase().includes(serviceInput.toLowerCase())
      );
      setFilteredServices(filtered.slice(0, 12)); // Limit to 12 suggestions
    }
  }, [serviceInput]);

  // Handle service selection
  const handleServiceSelect = useCallback((selectedService: string) => {
    setServiceInput(selectedService);
    onChange({ ...value, service: selectedService });
    setShowServiceSuggestions(false);
    setSelectedServiceIndex(-1);
  }, [onChange, value]);

  // Handle service input change
  const handleServiceInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setServiceInput(newValue);
    setShowServiceSuggestions(true);
    setSelectedServiceIndex(-1);
  }, []);

  // Handle service input focus
  const handleServiceInputFocus = useCallback(() => {
    setShowServiceSuggestions(true);
  }, []);

  // Handle service keyboard navigation
  const handleServiceKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showServiceSuggestions || filteredServices.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedServiceIndex(prev => (prev + 1) % filteredServices.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedServiceIndex(prev => prev <= 0 ? filteredServices.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedServiceIndex >= 0 && selectedServiceIndex < filteredServices.length) {
          handleServiceSelect(filteredServices[selectedServiceIndex]);
        }
        break;
      case 'Escape':
        setShowServiceSuggestions(false);
        setSelectedServiceIndex(-1);
        break;
    }
  }, [showServiceSuggestions, filteredServices, selectedServiceIndex, handleServiceSelect]);

  // Handle language selection
  const handleLanguageToggle = useCallback((language: string) => {
    const currentLanguages = value.languages || [];
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(l => l !== language)
      : [...currentLanguages, language];
    
    onChange({ ...value, languages: newLanguages });
  }, [onChange, value]);

  // Handle clicks outside service suggestions and language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceInputRef.current && !serviceInputRef.current.contains(event.target as Node)) {
        setShowServiceSuggestions(false);
        setSelectedServiceIndex(-1);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update container rect for portal positioning
  useEffect(() => {
    if (serviceInputRef.current && showServiceSuggestions) {
      setContainerRect(serviceInputRef.current.getBoundingClientRect());
    }
  }, [showServiceSuggestions]);

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    onChange({
      q: '',
      city: '',
      service: '',
      languages: [],
      price: 'all',
    });
    setServiceInput('');
    setSearchInput('');
  }, [onChange]);

 const update = (key: keyof SearchFiltersValue) => 
 (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
 onChange({ ...value, [key]: e.target.value });
 };

 return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, city, or service..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
        />
      </div>

      {/* City Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <CityAutocomplete
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
        />
      </div>

      {/* Service Filter */}
      <div className="relative" ref={serviceInputRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Service
        </label>
        <input
          type="text"
          value={serviceInput}
          onChange={handleServiceInputChange}
          onFocus={handleServiceInputFocus}
          onKeyDown={handleServiceKeyDown}
          placeholder="Start typing a service..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
        />
        
        {/* Service Suggestions via Portal */}
        {showServiceSuggestions && filteredServices.length > 0 && containerRect && (
          <Portal>
            <div
              className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              style={{
                top: containerRect.bottom + window.scrollY + 4,
                left: containerRect.left + window.scrollX,
                width: containerRect.width,
              }}
            >
              <ul>
                {filteredServices.map((service, index) => (
                  <li
                    key={index}
                    onClick={() => handleServiceSelect(service)}
                    className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      index === selectedServiceIndex ? 'bg-pink-50 text-pink-700' : ''
                    }`}
                  >
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </Portal>
        )}
      </div>

      {/* Language Filter */}
      <div className="relative" ref={languageDropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Languages
        </label>
        <button
          type="button"
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-left focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 flex items-center justify-between"
        >
          <span className={value.languages && value.languages.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
            {value.languages && value.languages.length > 0 
              ? `${value.languages.length} selected`
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
                    checked={value.languages?.includes(language) || false}
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
        {value.languages && value.languages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {value.languages.map((language) => (
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

      {/* Rating Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Rating
        </label>
 <select
 value={value.price ?? "all"}
 onChange={update("price")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
        >
          <option value="all">All Ratings</option>
          <option value="4.4">4.4+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
          <option value="5">5.0 Stars</option>
 </select>
 </div>

      {/* Filter Chips */}
      <FilterChips
        filters={value}
        onChange={onChange}
        onClearAll={handleClearAll}
      />
 </div>
 );
}