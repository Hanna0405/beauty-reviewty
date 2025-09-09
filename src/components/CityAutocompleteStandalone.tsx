'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string, meta?: { 
    coords?: { lat: number; lng: number }; 
    placeId?: string 
  }) => void;
  placeholder?: string;
  className?: string;
}

export default function CityAutocompleteStandalone({
  value,
  onChange,
  placeholder = "City / location",
  className = ""
}: CityAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Initialize Google Maps Autocomplete widget
  const initializeAutocomplete = useCallback(() => {
    // Guard against SSR and missing Google Maps API
    if (typeof window === 'undefined' || !(window as any).google?.maps?.places?.Autocomplete) {
      return;
    }

    if (!inputRef.current || isInitialized) {
      return;
    }

    try {
      // Create the Autocomplete widget
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'], // Only show cities
        fields: ['place_id', 'formatted_address', 'geometry', 'name'], // Minimal fields for performance
      });

      // Add place_changed listener
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.place_id) {
          return; // No place selected
        }

        // Extract city data
        const cityName = place.name || place.formatted_address || '';
        const coords = place.geometry?.location ? {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        } : undefined;
        const placeId = place.place_id;

        // Update input value
        setInputValue(cityName);
        
        // Call onChange with value and metadata
        onChange(cityName, { coords, placeId });
        
        console.log('[CityAutocomplete] Place selected:', { cityName, coords, placeId });
      });

      autocompleteRef.current = autocomplete;
      setIsInitialized(true);
      
      console.log('[CityAutocomplete] Autocomplete widget initialized successfully');
    } catch (error) {
      console.error('[CityAutocomplete] Failed to initialize Autocomplete:', error);
    }
  }, [isInitialized, onChange]);

  // Initialize on mount and when dependencies change
  useEffect(() => {
    // Small delay to ensure Google Maps API is fully loaded
    const timer = setTimeout(() => {
      initializeAutocomplete();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [initializeAutocomplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      setIsInitialized(false);
    };
  }, []);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Call onChange immediately for real-time updates
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        className={`w-full rounded-md border px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 ${className}`}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {/* Loading indicator while initializing */}
      {!isInitialized && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
        </div>
      )}
    </div>
  );
}
