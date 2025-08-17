'use client';
import { useMemo, useState } from 'react';
import { masters } from '../../data/masters';
import MasterCard from '../../components/MasterCard';
import SearchFilters from '../../components/SearchFilters';

export default function MastersPage() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All');
  const [service, setService] = useState('All');

  const cities = masters.map(m => m.city);
  const services = masters.flatMap(m => m.mainServices);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return masters.filter(m => {
      const byQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.mainServices.some(s => s.toLowerCase().includes(q));

      const byCity = city === 'All' || m.city === city;
      const byService = service === 'All' || m.mainServices.includes(service);

      return byQuery && byCity && byService;
    });
  }, [query, city, service]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Masters Directory</h1>
      <SearchFilters
        query={query} setQuery={setQuery}
        city={city} setCity={setCity}
        service={service} setService={setService}
        cities={cities} services={services}
      />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map(m => <MasterCard key={m.id} master={m} />)}
      </div>
      {filtered.length === 0 && (
        <div className="text-gray-600 mt-6">Nothing found. Try another query.</div>
      )}
    </div>
  );
}