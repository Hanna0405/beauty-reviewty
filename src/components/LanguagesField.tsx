'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Portal from './ui/Portal';

const LANGS = [
  'English', 'Ukrainian', 'Russian', 'Polish', 'French',
  'Spanish', 'Portuguese', 'Arabic', 'Mandarin', 'Hindi',
];

interface LanguagesFieldProps {
  value: string[];
  onChange: (val: string[]) => void;
  label?: string;
  className?: string;
}

export default function LanguagesField({ value, onChange, label, className = '' }: LanguagesFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = (lang: string) => {
    onChange(value.includes(lang) ? value.filter(l => l !== lang) : [...value, lang]);
  };

  const handleToggle = useCallback(() => {
    setIsOpen(!isOpen);
    setSelectedIndex(-1);
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % LANGS.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? LANGS.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < LANGS.length) {
          toggle(LANGS[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update container rect for portal positioning
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerRect(rect);
    }
  }, [isOpen]);

  // Calculate dropdown position with overflow handling
  const getDropdownPosition = useCallback(() => {
    if (!containerRect) return {};
    
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(240, LANGS.length * 40 + 16); // Approximate height
    const spaceBelow = viewportHeight - containerRect.bottom;
    const spaceAbove = containerRect.top;
    
    let top = containerRect.bottom + window.scrollY + 4;
    let maxHeight = dropdownHeight;
    
    // If not enough space below, show above
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      top = containerRect.top + window.scrollY - dropdownHeight - 4;
      maxHeight = Math.min(dropdownHeight, spaceAbove - 8);
    } else {
      maxHeight = Math.min(dropdownHeight, spaceBelow - 8);
    }
    
    return {
      top,
      left: containerRect.left + window.scrollX,
      width: containerRect.width,
      maxHeight,
    };
  }, [containerRect]);

  return (
    <div className={`${className} overflow-visible`}>
      {label && <div className="text-sm font-medium mb-2">{label}</div>}

      <div className="relative overflow-visible" ref={containerRef}>
        {/* Selected languages display */}
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map(lang => (
            <span
              key={lang}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
            >
              {lang}
              <button
                type="button"
                onClick={() => toggle(lang)}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Dropdown trigger button */}
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
        >
          {value.length > 0 
            ? `${value.length} language(s) selected`
            : 'Select languages'
          }
          <span className={`float-right transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Dropdown via Portal */}
        {isOpen && containerRect && (
          <Portal>
            <div
              ref={dropdownRef}
              className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
              style={getDropdownPosition()}
            >
              <div className="p-2">
                {LANGS.map((language, index) => (
                  <label 
                    key={language} 
                    className={`flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer ${
                      index === selectedIndex ? 'bg-pink-50 text-pink-700' : ''
                    }`}
                    onClick={() => toggle(language)}
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(language)}
                      onChange={() => toggle(language)}
                      className="mr-2"
                    />
                    <span className="text-sm">{language}</span>
                  </label>
                ))}
              </div>
            </div>
          </Portal>
        )}
      </div>
    </div>
  );
}