'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CityWithNeighborhoodFields from '@/components/location/CityWithNeighborhoodFields';
import MultiSelectAutocompleteV2 from '@/components/inputs/MultiSelectAutocompleteV2';
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/catalog';
import { ensureKeyObject } from '@/lib/filters/normalize';
import type { CityNorm } from '@/lib/city';
import type { TagOption } from '@/types/tags';

type Props = {
  value: { 
    city?: string; 
    cityPlaceId?: string;
    cityKey?: string;
    lat?: number;
    lng?: number;
    neighborhoodKey?: string | null;
    neighborhoodName?: string | null;
    services: TagOption[]; 
    languages: TagOption[]; 
    minRating?: number | null; 
    name?: string 
  };
  onChange: (v: Props['value']) => void;
  showName?: boolean;
};

export default function MasterFilters({ value, onChange, showName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [city, setCity] = useState<CityNorm | null>(null);
  const [neighborhoodKey, setNeighborhoodKey] = useState<string | null>(
    value.neighborhoodKey ?? null
  );
  const [neighborhoodName, setNeighborhoodName] = useState<string | null>(
    value.neighborhoodName ?? null
  );
  const [services, setServices] = useState<TagOption[]>(value.services ?? []);
  const [languages, setLanguages] = useState<TagOption[]>(value.languages ?? []);
  const [minRating, setMinRating] = useState<number | null>(value.minRating ?? null);
  const [name, setName] = useState<string>(value.name ?? '');

  function syncUrl(c: CityNorm | null, hoodKey: string | null) {
    const sp = new URLSearchParams(searchParams?.toString() || window.location.search);
    if (c?.slug) sp.set('city', c.slug);
    else sp.delete('city');
    if (hoodKey) sp.set('neighborhood', hoodKey);
    else sp.delete('neighborhood');
    router.push(`?${sp.toString()}`);
  }

  useEffect(() => { 
    onChange({ 
      city: city?.formatted, 
      cityPlaceId: city?.placeId,
      cityKey: city?.slug,
      lat: city?.lat,
      lng: city?.lng,
      neighborhoodKey,
      neighborhoodName,
      services, 
      languages, 
      minRating, 
      name 
    }); 
  }, [city, neighborhoodKey, neighborhoodName, services, languages, minRating, name, onChange]);

  const clearAll = () => {
    onChange({
      city: undefined,
      cityPlaceId: undefined,
      cityKey: undefined,
      lat: undefined,
      lng: undefined,
      neighborhoodKey: null,
      neighborhoodName: null,
      services: [],
      languages: [],
      minRating: null,
      name: '',
    });
    setCity(null);
    setNeighborhoodKey(null);
    setNeighborhoodName(null);
    setServices([]);
    setLanguages([]);
    setMinRating(null);
    setName('');
    syncUrl(null, null);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <CityWithNeighborhoodFields
        city={city}
        neighborhoodKey={neighborhoodKey}
        neighborhoodName={neighborhoodName}
        neighborhoodMode="filter"
        cityLabel="City"
        cityPlaceholder="Select city"
        onChange={({ city: nextCity, neighborhoodKey: key, neighborhoodName: hoodName }) => {
          setCity(nextCity);
          setNeighborhoodKey(key);
          setNeighborhoodName(hoodName);
          syncUrl(nextCity, key);
        }}
      />

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
          onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : null)}
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

      <button
        type="button"
        onClick={clearAll}
        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
        Clear all ✖︎
      </button>
    </div>
  );
}
