'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAnchoredPopup } from '@/lib/useAnchoredPopup';
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
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rect = useAnchoredPopup(buttonRef.current);

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
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={className}>
      {label && <div className="text-sm font-medium mb-2">{label}</div>}

      <div className="relative">
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
                onMouseDown={() => toggle(lang)}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Dropdown trigger button */}
        <button
          ref={buttonRef}
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
        {isOpen && rect && (
          <Portal>
            <div
              className="bg-white border shadow-lg rounded-md max-h-60 overflow-auto"
              style={{ 
                position: "fixed", 
                top: rect.bottom + 4, 
                left: rect.left, 
                width: rect.width, 
                zIndex: 9999 
              }}
            >
              <div className="p-2">
                {LANGS.map((language, index) => (
                  <label 
                    key={language} 
                    className={`flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer ${
                      index === selectedIndex ? 'bg-pink-50 text-pink-700' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(language)}
                      onMouseDown={() => toggle(language)}
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