'use client';
import { useMemo } from 'react';

type Props = {
  query: string; setQuery: (v: string) => void;
  city: string; setCity: (v: string) => void;
  service: string; setService: (v: string) => void;
  cities: string[]; services: string[];
};

export default function SearchFilters({
  query, setQuery, city, setCity, service, setService, cities, services
}: Props) {
  const uniqCities = useMemo(() => ['All', ...Array.from(new Set(cities))], [cities]);
  const uniqServices = useMemo(() => ['All', ...Array.from(new Set(services))], [services]);

  return (
    <div className="grid gap-3 md:grid-cols-3 mb-6">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or service…"
        className="border rounded px-3 py-2"
      />
      <select value={city} onChange={(e)=>setCity(e.target.value)} className="border rounded px-3 py-2">
        {uniqCities.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={service} onChange={(e)=>setService(e.target.value)} className="border rounded px-3 py-2">
        {uniqServices.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

