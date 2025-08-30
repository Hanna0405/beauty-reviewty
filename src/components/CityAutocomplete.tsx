'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Portal from '@/components/ui/Portal';

type Props = {
  value: string;
  onChange?: (val: string) => void;
  onSelect?: (city: string, lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
};

interface PlaceSuggestion {
  place_id: string;
  description: string;
}

export default function CityAutocomplete({ value, onChange, onSelect, placeholder = "Start typing a city...", className = "" }: Props) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) throw new Error('Failed to fetch suggestions');

      const data = await response.json();
      
      if (data.status === 'OK') {
        setSuggestions(data.predictions.slice(0, 8)); // Limit to top 8
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching city suggestions:', error);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    setShowSuggestions(true);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchCities(newValue);
    }, 300);
  }, [searchCities]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.description);
    onChange?.(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // If onSelect is provided, get coordinates and call it
    if (onSelect) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.result?.geometry?.location) {
            const { lat, lng } = data.result.geometry.location;
            onSelect(suggestion.description, lat, lng);
          }
        }
      } catch (error) {
        console.error('Error getting place coordinates:', error);
      }
    }
  }, [onChange, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionSelect]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update container rect for portal positioning
  useEffect(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
  }, [showSuggestions]);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition ${className}`}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Suggestions dropdown via Portal */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && containerRect && (
        <Portal>
          <div
            className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            style={{
              top: containerRect.bottom + window.scrollY + 4,
              left: containerRect.left + window.scrollX,
              width: containerRect.width,
            }}
          >
            {isLoading ? (
              <div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
            ) : (
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 ${
                      index === selectedIndex ? 'bg-pink-50 text-pink-700' : ''
                    }`}
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}