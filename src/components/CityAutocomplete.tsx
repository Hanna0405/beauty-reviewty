'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { CityNorm } from '@/lib/city';
import { normalizePlace } from '@/lib/city';

// IMPORTANT: Do NOT instantiate LoadScript here. Rely on the provider higher in the tree.
// Ensure you create the Autocomplete using `google.maps.places.Autocomplete` or PlaceAutocompleteElement.
// For now keep legacy Autocomplete to avoid wide refactor, but behind try/catch:
declare const google: any;

function waitForGoogle(timeoutMs = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const ok = !!(window as any)?.google?.maps?.places?.Autocomplete;
      if (ok) return resolve(true);
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(tick, 75);
    };
    tick();
  });
}

type Props = {
  value?: CityNorm | null;
  onChange: (v: CityNorm | null) => void; // fires ONLY when a prediction is picked
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  disabled?: boolean;
};

export default function CityAutocomplete({ value, onChange, placeholder='Select city', className='', allowClear=true, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [selected, setSelected] = React.useState<CityNorm | null>(value ?? null);
  const [raw, setRaw] = React.useState<string>(value?.formatted ?? '');
  const [ready, setReady] = useState(false);

  React.useEffect(() => {
    if (!value) return;
    setSelected(value);
    setRaw(value?.formatted || '');
  }, [value?.slug]);

  const initAutocomplete = useCallback(async () => {
    if (acRef.current || !inputRef.current) return;
    if (!(await waitForGoogle())) return;
    const Google = (window as any).google as typeof google;
    if (!Google?.maps?.places?.Autocomplete) return;
    
    try {
      const ac = new Google.maps.places.Autocomplete(inputRef.current!, {
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
      
      acRef.current = ac;
      setReady(true);
    } catch (e) {
      console.error('[BR] Autocomplete init error', e);
    }
  }, [onChange]);

  useEffect(() => {
    // try init on mount
    initAutocomplete();
    return () => {
      if (acRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(acRef.current);
        acRef.current = null;
      }
    };
  }, [initAutocomplete]);

  const handleFocus = async () => {
    if (!acRef.current) await initAutocomplete();
  };

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
        onFocus={handleFocus}
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