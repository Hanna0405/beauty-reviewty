'use client';

import { Loader } from '@googlemaps/js-api-loader';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  country?: string; // default 'CA'
  required?: boolean;
  error?: string;
};

export default function CityAutocomplete({ value, onChange, placeholder='Start typing your city', country='CA', required, error }: Props) {
  const [preds, setPreds] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [input, setInput] = useState(value ?? '');
  const svcRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => { setInput(value ?? ''); }, [value]);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
    });
    loader.load().then(() => {
      svcRef.current = new google.maps.places.AutocompleteService();
    });
  }, []);

  useEffect(() => {
    const q = input.trim();
    if (!svcRef.current || q.length < 2) { setPreds([]); return; }
    svcRef.current.getPlacePredictions(
      {
        input: q,
        types: ['(cities)'],
        componentRestrictions: { country: [country.toLowerCase()] as any },
      },
      (res) => setPreds(res ?? []),
    );
  }, [input, country]);

  const choose = (p: google.maps.places.AutocompletePrediction) => {
    // format "Main, Secondary" e.g., "Barrie, ON, Canada"
    const f = p.structured_formatting;
    const label = f?.main_text && f?.secondary_text ? `${f.main_text}, ${f.secondary_text}` : p.description;
    onChange(label);
    setInput(label);
    setPreds([]);
  };

  return (
    <div className="relative">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-2 ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
        autoComplete="off"
        required={required}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {preds.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-white shadow">
          {preds.map((p) => (
            <li
              key={p.place_id}
              className="cursor-pointer px-3 py-2 hover:bg-gray-100"
              onClick={() => choose(p)}
            >
              <span className="font-medium">{p.structured_formatting?.main_text}</span>
              {p.structured_formatting?.secondary_text && (
                <span className="text-gray-500">, {p.structured_formatting.secondary_text}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}