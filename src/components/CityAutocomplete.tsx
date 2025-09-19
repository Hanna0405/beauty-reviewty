'use client';
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/gmapsLoader';
import { normalizeFromPlace, NormalizedCity } from '@/lib/cityNormalize';

type Props = {
  apiKey: string;
  label?: string;
  value?: NormalizedCity | null;
  onChange: (city: NormalizedCity | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  region?: string;
};

type Prediction = google.maps.places.AutocompletePrediction;

export default function CityAutocomplete({
  apiKey,
  label = 'City',
  value,
  onChange,
  placeholder = 'Start typing your city…',
  disabled,
  required,
  className,
  region = 'CA',
}: Props) {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState(value?.formatted || '');
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadGoogleMaps(apiKey, 'en', region || 'CA')
      .then((g) => {
        serviceRef.current = new g.maps.places.AutocompleteService();
        const el = document.createElement('div');
        placesRef.current = new g.maps.places.PlacesService(el);
        setReady(true);
      })
      .catch(console.error);
  }, [apiKey, region]);

  useEffect(() => {
    if (value?.formatted) setInput(value.formatted);
    if (!value) setInput('');
  }, [value]);

  useEffect(() => {
    if (!ready || !serviceRef.current) return;
    if (!open) return;

    if (!input || input.trim().length < 1) {
      setPreds([]);
            return;
          }

    serviceRef.current.getPlacePredictions(
      {
        input,
        types: ['(cities)'],
        language: 'en',
        ...(region ? { componentRestrictions: { country: [region.toLowerCase()] } } : {}),
      },
      (res) => setPreds(res || [])
    );
  }, [input, open, ready, region]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleSelect(p: Prediction) {
    if (!placesRef.current) return;
    const placeId = p.place_id;
    if (!placeId) return;
    placesRef.current.getDetails(
      { placeId, language: 'en', fields: ['address_component', 'geometry.location', 'name', 'place_id'] },
      (details, status) => {
        if (!details || status !== google.maps.places.PlacesServiceStatus.OK) return;
        const normalized = normalizeFromPlace(details);
        setInput(normalized.formatted);
        onChange(normalized);
        setOpen(false);
        setPreds([]);
      }
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (preds[0]) handleSelect(preds[0]);
    }
    if (e.key === 'ArrowDown') setOpen(true);
  }

  const showError = touched && required && !value;

  return (
    <div ref={containerRef} className={`w-full ${className || ''}`}>
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      )}
      <input
        type="text"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        value={input}
        onChange={(e) => {
          setTouched(true);
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={`w-full rounded-md border ${showError ? 'border-red-400' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300`}
        placeholder={placeholder}
        disabled={!ready || disabled}
      />
      {open && preds.length > 0 && (
        <ul className="mt-1 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {preds.map((p) => (
            <li
              key={p.place_id}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(p)}
            >
              {p.structured_formatting?.main_text}
              <span className="text-gray-500">, {p.structured_formatting?.secondary_text}</span>
            </li>
          ))}
        </ul>
      )}
      {showError && <p className="mt-1 text-xs text-red-500">Please choose a city from the list.</p>}
      {!value && touched && (
        <p className="mt-1 text-xs text-gray-500">Select a city from suggestions — free text will not be saved.</p>
      )}
    </div>
  );
}