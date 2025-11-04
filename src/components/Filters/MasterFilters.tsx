'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CityAutocomplete from '@/components/CityAutocomplete';
import MultiSelectAutocompleteV2 from '@/components/inputs/MultiSelectAutocompleteV2';
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/catalog'; // ← use shared options
import { ensureKeyObject } from '@/lib/filters/normalize';
import type { CityNorm } from '@/lib/city';
import type { TagOption } from '@/types/tags';

type Props = {
  value: { 
    city?: string; 
    cityPlaceId?: string;
    lat?: number;
    lng?: number;
    services: TagOption[]; 
    languages: TagOption[]; 
    minRating?: number; 
    name?: string 
  };
  onChange: (v: Props['value']) => void;
  showName?: boolean;
};

export default function MasterFilters({ value, onChange, showName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [city, setCity] = useState<CityNorm | null>(null);
  const [services, setServices] = useState<TagOption[]>(value.services ?? []);
  const [languages, setLanguages] = useState<TagOption[]>(value.languages ?? []);
  const [minRating, setMinRating] = useState<number | undefined>(value.minRating);
  const [name, setName] = useState<string>(value.name ?? '');

  // Handle city selection with URL updates
  function onCityPicked(c: CityNorm | null) {
    const sp = new URLSearchParams(window.location.search);
    if (c?.slug) sp.set('city', c.slug); else sp.delete('city');
    router.push(`?${sp.toString()}`);
    setCity(c);
  }

  useEffect(() => { 
    onChange({ 
      city: city?.formatted, 
      cityPlaceId: city?.placeId,
      lat: city?.lat,
      lng: city?.lng,
      services, 
      languages, 
      minRating, 
      name 
    }); 
  }, [city, services, languages, minRating, name, onChange]);

  const clearAll = () => {
    onChange({ city: undefined, cityPlaceId: undefined, lat: undefined, lng: undefined, services: [], languages: [], minRating: undefined, name: '' });
    // sync local states so inputs reflect immediately
    setCity(null);
    setServices([]);
    setLanguages([]);
    setMinRating(undefined);
    setName('');
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">City</label>
        <CityAutocomplete 
          value={city}
          onChange={onCityPicked}
          placeholder="Select city"
        />
      </div>

      {/* Services — SAME dataset & UX as New Listing */}
      <MultiSelectAutocompleteV2
        label="Services"
        options={SERVICE_OPTIONS}
        value={services}
        onChange={(vals) => {
          const normalized = vals.map(v => ensureKeyObject<TagOption>(v)).filter(Boolean) as TagOption[];
          setServices(normalized);
        }}
        placeholder="Search services…"
      />

      {/* Languages — SAME dataset & UX as New Listing */}
      <MultiSelectAutocompleteV2
        label="Languages"
        options={LANGUAGE_OPTIONS}
        value={languages}
        onChange={(vals) => {
          const normalized = vals.map(v => ensureKeyObject<TagOption>(v)).filter(Boolean) as TagOption[];
          setLanguages(normalized);
        }}
        placeholder="Search languages…"
      />

      <div>
        <label className="mb-1 block text-sm">Rating (min)</label>
        <select
          value={minRating ?? ''}
          onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full rounded-md border px-3 py-2">
          <option value="">Any</option>
          {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}★ & up</option>)}
        </select>
      </div>

      {showName && (
        <div>
          <label className="mb-1 block text-sm">Name / Nickname</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border px-3 py-2" placeholder="Type a name…" />
        </div>
      )}

      {/* Clear all */}
      <button
        type="button"
        onClick={clearAll}
        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
        Clear all ✖︎
      </button>
    </div>
  );
}
