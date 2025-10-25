// components/common/CityAutocomplete.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { slugifyCity } from '@/lib/slugify';

type CityNormalized = {
  city: string;
  state?: string;
  stateCode?: string;
  country: string;
  countryCode: string;
  formatted: string;
  lat: number;
  lng: number;
  placeId: string;
  slug: string;
};

type Props = {
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  value?: string; // controlled display value (formatted)
  onSelect: (normalized: CityNormalized) => void;
  onClear?: () => void;
  noManualInput?: boolean; // PATCH: prevent free text input
};

async function loadPlacesLibrary(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  if (!key) {
    console.warn('CityAutocomplete: missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    return false;
  }
  try {
    // Prefer the new importLibrary API when present
    const g: any = (window as any).google;
    if (g?.maps?.importLibrary) {
      await g.maps.importLibrary('places');
      return true;
    }
  } catch (e) {
    console.warn('importLibrary places failed, will try js-api-loader', e);
  }

  try {
    const { Loader } = await import('@googlemaps/js-api-loader');
    const loader = new Loader({
      apiKey: key,
      version: 'weekly',
      libraries: ['places'],
      language: 'en',
    });
    await loader.load();
    return !!(window as any).google?.maps?.places;
  } catch (e) {
    console.error('Google JS API loader failed', e);
    return false;
  }
}

function usePlacesLoader() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    loadPlacesLibrary().then((ok) => {
      if (!mounted) return;
      if (!ok) {
        console.warn('Places not ready (check API key, billing, enable Places API)');
        setReady(false);
        return;
      }
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);
  return ready;
}

export default function CityAutocomplete({
  label,
  placeholder = 'Select city',
  required,
  className,
  value,
  onSelect,
  onClear,
  noManualInput = false,
}: Props) {
  const ready = usePlacesLoader();
  const [query, setQuery] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const [preds, setPreds] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const svcRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placeSvcRef = useRef<google.maps.places.PlacesService | null>(null);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    const g: any = (window as any).google;
    if (!g?.maps?.places) return;

    try {
      if (!svcRef.current) {
        svcRef.current = new g.maps.places.AutocompleteService();
      }
      if (!placeSvcRef.current) {
        const dummy = document.createElement('div');
        placeSvcRef.current = new g.maps.places.PlacesService(dummy);
      }
      if (!tokenRef.current) {
        tokenRef.current = new g.maps.places.AutocompleteSessionToken();
      }
    } catch (e) {
      console.warn('Failed to init Places services', e);
    }
  }, [ready]);

  useEffect(() => {
    // Keep controlled display text in sync
    if (value !== undefined) setQuery(value);
  }, [value]);

  // Fetch predictions (debounced)
  useEffect(() => {
    if (!ready || !svcRef.current || !('getPlacePredictions' in svcRef.current)) {
      setPreds([]);
      return;
    }
    if (!query || query.length < 2) {
      setPreds([]);
      return;
    }

    const h = setTimeout(() => {
      svcRef.current!.getPlacePredictions(
        {
          input: query,
          types: ['(cities)'],
          sessionToken: tokenRef.current || undefined,
        },
        (predictions) => {
          setPreds(predictions || []);
          setOpen(true);
        }
      );
    }, 160);

    return () => clearTimeout(h);
  }, [query, ready]);

  function handlePick(p: google.maps.places.AutocompletePrediction) {
    if (!placeSvcRef.current) return;
    const placeId = p.place_id!;
    placeSvcRef.current.getDetails(
      {
        placeId,
        fields: ['address_components', 'geometry', 'name', 'formatted_address'],
        sessionToken: tokenRef.current || undefined,
      },
      (place, status) => {
        if (!place || status !== google.maps.places.PlacesServiceStatus.OK) {
          // Fallback: build normalized object from prediction text
          const formatted = p.description || query;
          const slug = slugifyCity(formatted);
          const normalized = {
            city: p.structured_formatting?.main_text || formatted,
            state: '',
            stateCode: '',
            country: '',
            countryCode: '',
            formatted,
            lat: 0,
            lng: 0,
            placeId: p.place_id || '',
            slug,
          };
          setQuery(formatted);
          setOpen(false);
          setPreds([]);
          onSelect(normalized);
          return;
        }
        const comps = place.address_components || [];
        const get = (type: string) =>
          comps.find((c) => c.types.includes(type));

        const cityComp = get('locality') || get('postal_town') || get('administrative_area_level_2') || get('administrative_area_level_3');
        const stateComp = get('administrative_area_level_1');
        const countryComp = get('country');

        const city = cityComp?.long_name || place.name || '';
        const state = stateComp?.long_name || '';
        const stateCode = stateComp?.short_name || '';
        const country = countryComp?.long_name || '';
        const countryCode = countryComp?.short_name || '';

        const lat = place.geometry?.location?.lat() ?? 0;
        const lng = place.geometry?.location?.lng() ?? 0;
        const formatted = place.formatted_address || [city, stateCode, countryCode].filter(Boolean).join(', ');
        const slug = slugifyCity(`${city}-${stateCode}-${countryCode}`);

        const normalized: CityNormalized = {
          city,
          state,
          stateCode,
          country,
          countryCode,
          formatted,
          lat,
          lng,
          placeId,
          slug,
        };

        setQuery(formatted);
        setOpen(false);
        setPreds([]);
        onSelect(normalized);
      }
    );
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!listRef.current || !inputRef.current) return;
      if (
        !listRef.current.contains(e.target as Node) &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={className} style={{ position: 'relative' }}>
      {label ? (
        <label className="block text-sm font-medium mb-1">
          {label} {required ? <span className="text-pink-500">*</span> : null}
        </label>
      ) : null}
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          if (noManualInput) {
            // PATCH: prevent manual typing when noManualInput is true
            return;
          }
          setQuery(e.target.value);
          if (onClear) onClear();
        }}
        onFocus={() => {
          if (noManualInput) {
            // PATCH: show message that manual input is not allowed
            return;
          }
          query.length >= 2 && setOpen(true);
        }}
        className="w-full rounded-md border px-3 py-2 outline-none"
        readOnly={noManualInput}
      />
      {noManualInput && (
        <p className="text-xs text-gray-500 mt-1">
          Please select from the dropdown list (manual input not allowed)
        </p>
      )}
      {open && preds.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 mt-1 max-h-64 overflow-auto rounded-md border bg-white shadow-lg z-[9999]"
        >
          {preds.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => handlePick(p)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              {p.structured_formatting?.main_text || p.description}
              <div className="text-xs text-gray-500">
                {p.structured_formatting?.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
