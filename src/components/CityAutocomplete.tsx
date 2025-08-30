'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/googleMaps';
import Portal from '@/components/ui/Portal';

interface CityAutocompleteProps {
  value: string;
  onChange?: (text: string) => void;
  onSelect: (city: { label: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
}

export default function CityAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Start typing a city..." 
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Initialize Google Maps services
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        await loadGoogleMaps();
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(
          document.createElement('div')
        );
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initGoogleMaps();
  }, []);

  // Debounced search function
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2 || !autocompleteServiceRef.current) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        types: ['(cities)'],
      };

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions.slice(0, 8));
          } else {
            setPredictions([]);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setIsLoading(false);
      setPredictions([]);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    setSelectedIndex(-1);
    setShowDropdown(true);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchCities(newValue);
    }, 300);
  }, [onChange, searchCities]);

  // Handle prediction selection
  const handlePredictionSelect = useCallback(async (prediction: PlacePrediction) => {
    if (!placesServiceRef.current) return;

    try {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.place_id,
        fields: ['name', 'geometry'],
      };

      placesServiceRef.current.getDetails(
        request,
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const label = place.name || prediction.description;
            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();

            if (lat && lng) {
              onSelect({ label, lat, lng });
              setInputValue(label);
              onChange?.(label);
              setShowDropdown(false);
              setPredictions([]);
              setSelectedIndex(-1);
            }
          }
        }
      );
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  }, [onChange, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % predictions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? predictions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handlePredictionSelect(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setPredictions([]);
        setSelectedIndex(-1);
        break;
    }
  }, [showDropdown, predictions, selectedIndex, handlePredictionSelect]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setPredictions([]);
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
  }, [showDropdown]);

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
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Predictions dropdown via Portal */}
      {showDropdown && (predictions.length > 0 || isLoading) && containerRect && (
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
                {predictions.map((prediction, index) => (
                  <li
                    key={prediction.place_id}
                    onClick={() => handlePredictionSelect(prediction)}
                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 ${
                      index === selectedIndex ? 'bg-pink-50 text-pink-700' : ''
                    }`}
                  >
                    {prediction.description}
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