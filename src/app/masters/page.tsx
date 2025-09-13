'use client';
import { useEffect, useState } from 'react';
import type { Master } from '@/types/masters';
import MapMini from '@/components/MapMini';

type Filters = { service?: string; city?: string; language?: string; minRating?: number; };

export default function MastersPage() {
 const [filters, setFilters] = useState<Filters>({});
 const [items, setItems] = useState<Master[]>([]);
 const [cursor, setCursor] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function search(reset = false) {
 setLoading(true); setError(null);
 try {
 const body = {
 ...filters,
 minRating: filters.minRating ? Number(filters.minRating) : null,
 cursor: reset ? null : cursor,
 pageSize: 20,
 };
 const res = await fetch('/api/masters/search', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
 const data = await res.json();
 if (!res.ok || !data?.ok) throw new Error(data?.error || 'Search failed');
 setItems(prev => reset ? data.items : [...prev, ...data.items]);
 setCursor(data.nextCursor);
 } catch (e:any) {
 setError(e?.message || 'Search failed');
 } finally {
 setLoading(false);
 }
 }

 // initial load
 useEffect(() => { search(true); /* eslint-disable-next-line */ }, []);

 function onChange<K extends keyof Filters>(k: K, v: Filters[K]) {
 setFilters(f => ({ ...f, [k]: v }));
 }

 return (
 <div className="mx-auto max-w-6xl p-4">
 <h1 className="text-2xl font-semibold mb-4">All Masters</h1>

 <div className="grid grid-cols-5 gap-3 mb-4">
 <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Service" value={filters.service ?? ''} onChange={e=>onChange('service', e.target.value || undefined)} />
 <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="City" value={filters.city ?? ''} onChange={e=>onChange('city', e.target.value || undefined)} />
 <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Language" value={filters.language ?? ''} onChange={e=>onChange('language', e.target.value || undefined)} />
 <input className="rounded-lg border border-gray-200 px-3 py-2" type="number" step="0.1" placeholder="Min rating" value={filters.minRating ?? ''} onChange={e=>onChange('minRating', e.target.value ? Number(e.target.value) : undefined)} />
 <button className="rounded-lg bg-pink-500 hover:bg-pink-600 text-white px-4 py-2" onClick={()=>{ setCursor(null); search(true); }} disabled={loading}>Apply</button>
 </div>

 {error && <div className="text-red-600 mb-2">{error}</div>}

 {/* Map */}
 <div className="mb-4">
  <MapMini 
    markers={items.map(m => ({
      lat: m.location?.lat || 0,
      lng: m.location?.lng || 0,
      title: m.displayName
    })).filter(m => m.lat !== 0 && m.lng !== 0)}
    city={items.length > 0 ? items[0]?.city : undefined}
  />
 </div>

 <div className="border rounded">
 <div className="grid grid-cols-5 gap-2 p-2 font-medium bg-gray-50">
 <div>Name</div><div>Service</div><div>City</div><div>Language</div><div>Rating</div>
 </div>
 {items.length === 0 && !loading && <div className="p-4 text-gray-500">No results</div>}
 {items.map(m => (
 <div key={m.id} className="grid grid-cols-5 gap-2 p-2 border-t">
 <div className="truncate">{m.displayName}</div>
 <div className="truncate">{m.services?.[0] ?? '-'}</div>
 <div className="truncate">{m.city ?? '-'}</div>
 <div className="truncate">{m.languages?.[0] ?? '-'}</div>
 <div>{m.rating ?? '-'}</div>
 </div>
 ))}
 </div>

 <div className="mt-3">
 <button className="rounded-lg bg-pink-500 hover:bg-pink-600 text-white px-4 py-2" onClick={()=>search(false)} disabled={loading || !cursor}>
 {loading ? 'Loading…' : cursor ? 'Load more' : 'No more'}
 </button>
 </div>
 </div>
 );
}
