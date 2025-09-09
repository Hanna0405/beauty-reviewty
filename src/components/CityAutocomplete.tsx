"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/providers/GoogleMapsProvider";

interface CityAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
 placeholder?: string;
  required?: boolean;
  error?: string;
}

/**
 * City autocomplete component using Google Places API
 * Supports small towns and cities with debounced search
 */
export default function CityAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Start typing your city...", 
  required = false,
  error 
}: CityAutocompleteProps) {
  const { isLoaded, error: mapsError } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Initialize Google Places services
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined" && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      const div = document.createElement("div");
      placesServiceRef.current = new window.google.maps.places.PlacesService(div);
    }
  }, [isLoaded]);

  // Resolve place details with proper fields
  const resolvePlaceDetails = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) =>
      new Promise<google.maps.places.PlaceResult | null>((resolve) => {
        if (!placesServiceRef.current || !prediction.place_id) return resolve(null);

        const detailReq: google.maps.places.PlaceDetailsRequest = {
          placeId: prediction.place_id,
          fields: ["name", "address_components", "geometry"],
        };

        placesServiceRef.current.getDetails(detailReq, (place, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(null);
          } else {
            resolve(place || null);
          }
        });
      }),
    []
  );

  // Debounced search function
  const searchPlaces = useCallback((query: string) => {
    if (!query.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    // VALID AutocompletionRequest (no `fields` here!)
    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      types: ["(cities)"],
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions.slice(0, 8)); // Limit to 8 suggestions
        setIsOpen(predictions.length > 0);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    });
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounce
    debounceRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 250);
  };

  // Handle suggestion selection
  const selectSuggestion = useCallback(async (prediction: google.maps.places.AutocompletePrediction) => {
    const place = await resolvePlaceDetails(prediction);
    const cityName = place?.name ?? prediction.structured_formatting?.main_text ?? prediction.description;
    onChange(cityName);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, [resolvePlaceDetails, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle blur (with delay to allow clicks on suggestions)
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Cleanup debounce on unmount
 useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
 }, []);

  if (mapsError) {
    return (
      <div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
            error ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white hover:border-pink-300'
          }`}
          required={required}
        />
        <p className="text-xs text-gray-500 mt-1">Google Maps unavailable - manual entry only</p>
      </div>
    );
  }

 return (
    <div className="relative">
 <input
 ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
          error ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white hover:border-pink-300'
        }`}
        required={required}
        disabled={!isLoaded}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-500 border-t-transparent"></div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-pink-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              className={`w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors ${
                index === selectedIndex ? 'bg-pink-100' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-pink-100'
              }`}
              onClick={() => selectSuggestion(prediction)}
            >
              {prediction.structured_formatting?.main_text || prediction.description}
            </button>
          ))}
        </div>
      )}
    </div>
 );
}