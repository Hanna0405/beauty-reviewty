'use client';
import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { CityNorm } from '@/lib/city';
import { normalizePlace } from '@/lib/city';

type Props = {
  value?: CityNorm | null;
  onChange: (v: CityNorm | null) => void; // fires ONLY when a prediction is picked
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  disabled?: boolean;
};
export default function CityAutocomplete({ value, onChange, placeholder='Select city', className='', allowClear=true, disabled }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [selected, setSelected] = React.useState<CityNorm | null>(value ?? null);
  const [raw, setRaw] = React.useState<string>(value?.formatted ?? '');
  const MAP_LIBS = ['places'] as const;
  const { isLoaded } = useJsApiLoader({
    id: 'gmaps-places',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: [...MAP_LIBS],
  });

  React.useEffect(() => {
    if (!value) return;
    setSelected(value);
    setRaw(value?.formatted || '');
  }, [value?.slug]);

  React.useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    const input = inputRef.current;
    const ac = new google.maps.places.Autocomplete(input, {
      types: ['(cities)'],
      fields: ['place_id', 'address_components', 'geometry.location', 'name'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const norm = normalizePlace(place);
      if (!norm) return;
      setSelected(norm);
      setRaw(norm.formatted);
      onChange(norm);
    });
  }, [isLoaded]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setRaw(e.target.value);
    if (selected) setSelected(null);
    // IMPORTANT: do NOT call onChange here → only allow chosen prediction
  }
  function handleBlur() {
    if (!selected) setRaw('');
    else setRaw(selected.formatted);
  }
  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        autoComplete="off"
        placeholder={placeholder}
        value={raw}
        onChange={handleInput}
        onBlur={handleBlur}
        disabled={disabled}
        className="w-full rounded-md border px-3 py-2 outline-none focus:ring focus:ring-pink-200"
      />
      {allowClear && selected && !disabled && (
        <button
          type="button"
          aria-label="Clear"
          onClick={() => { setSelected(null); setRaw(''); onChange(null); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}