'use client';
import { useEffect, useState } from 'react';
import CityAutocomplete from '@/components/CityAutocomplete';
import MultiSelectAutocomplete from '@/components/inputs/MultiSelectAutocomplete';
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/catalog'; // ← use shared options

type Props = {
  value: { city?: string; services: string[]; languages: string[]; minRating?: number; name?: string };
  onChange: (v: Props['value']) => void;
  showName?: boolean;
};

export default function MasterFilters({ value, onChange, showName }: Props) {
  const [city, setCity] = useState<string | undefined>(value.city);
  const [cityPlaceId, setCityPlaceId] = useState<string | undefined>((value as any).cityPlaceId);
  const [services, setServices] = useState<string[]>(value.services ?? []);
  const [languages, setLanguages] = useState<string[]>(value.languages ?? []);
  const [minRating, setMinRating] = useState<number | undefined>(value.minRating);
  const [name, setName] = useState<string>(value.name ?? '');

  useEffect(() => { onChange({ city, cityPlaceId, services, languages, minRating, name }); }, [city, cityPlaceId, services, languages, minRating, name, onChange]);

  const clearAll = () => {
    onChange({ city: undefined, cityPlaceId: undefined, services: [], languages: [], minRating: undefined, name: '' });
    // sync local states so inputs reflect immediately
    setCity(undefined);
    setCityPlaceId(undefined);
    setServices([]);
    setLanguages([]);
    setMinRating(undefined);
    setName('');
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <CityAutocomplete 
        value={city} 
        onChange={(label, meta) => { setCity(label); setCityPlaceId(meta?.placeId); }} 
      />

      {/* Services — SAME dataset & UX as New Listing */}
      <MultiSelectAutocomplete
        label="Services"
        options={SERVICE_OPTIONS}
        value={services}
        onChange={setServices}
        placeholder="Search services…"
      />

      {/* Languages — SAME dataset & UX as New Listing */}
      <MultiSelectAutocomplete
        label="Languages"
        options={LANGUAGE_OPTIONS}
        value={languages}
        onChange={setLanguages}
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
