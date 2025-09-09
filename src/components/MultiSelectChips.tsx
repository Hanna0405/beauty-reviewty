"use client";
import React, { useEffect, useRef, useState } from "react";

interface MultiSelectChipsProps {
  value: string[];
  onChange: (arr: string[]) => void;
  options: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  allowCustom?: boolean;
  error?: string;
  required?: boolean;
}

/**
 * Multi-select component with chips for services/languages
 * Supports typeahead filtering, keyboard navigation, and validation
 */
export default function MultiSelectChips({
  value = [],
  onChange,
  options = [],
  placeholder = "Type to search...",
  min = 0,
  max = Infinity,
  allowCustom = true,
  error,
  required = false
}: MultiSelectChipsProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on input and exclude already selected
  const filteredOptions = options
    .filter(option => 
      option.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(option)
    )
    .slice(0, 10); // Limit to 10 suggestions

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(newValue.length > 0);
    setSelectedIndex(-1);
  };

  // Add item to selection
  const addItem = (item: string) => {
    if (value.includes(item) || value.length >= max) return;
    
    const newValue = [...value, item];
    onChange(newValue);
    setInputValue("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Remove item from selection
  const removeItem = (item: string) => {
    const newValue = value.filter(v => v !== item);
    onChange(newValue);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
        addItem(filteredOptions[selectedIndex]);
      } else if (inputValue.trim() && allowCustom && !value.includes(inputValue.trim())) {
        addItem(inputValue.trim());
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last item on backspace when input is empty
      removeItem(value[value.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  // Handle focus
  const handleFocus = () => {
    if (inputValue.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasError = error || (required && value.length < min);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium"
            >
              {item}
              <button
                type="button"
                className="text-pink-600 hover:text-pink-800 font-bold text-lg leading-none"
                onClick={() => removeItem(item)}
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : "Add more..."}
        className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
          hasError ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white hover:border-pink-300'
        }`}
        disabled={value.length >= max}
      />

      {/* Error message */}
      {hasError && (
        <p className="text-red-500 text-sm mt-1">
          {error || `Please select at least ${min} item${min > 1 ? 's' : ''}`}
        </p>
      )}

      {/* Help text */}
      {min > 0 && !error && (
        <p className="text-gray-500 text-xs mt-1">
          {value.length < min ? `${min - value.length} more required` : `${value.length} selected`}
        </p>
      )}

      {/* Dropdown suggestions */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-pink-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={option}
              type="button"
              className={`w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors ${
                index === selectedIndex ? 'bg-pink-100' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === filteredOptions.length - 1 ? 'rounded-b-lg' : 'border-b border-pink-100'
              }`}
              onClick={() => addItem(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Custom option hint */}
      {isOpen && inputValue.trim() && !filteredOptions.includes(inputValue.trim()) && allowCustom && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-pink-200 rounded-lg shadow-lg">
          <button
            type="button"
            className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors rounded-lg"
            onClick={() => addItem(inputValue.trim())}
          >
            Add "{inputValue.trim()}"
          </button>
        </div>
      )}
    </div>
  );
}
