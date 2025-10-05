'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { onSnapshot, getDocs } from 'firebase/firestore';
import { buildMastersQuery } from '@/lib/mastersQuery';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import MapContainer from '@/components/map/MapContainer';

const CityAutocomplete = dynamic(() => import('@/components/CityAutocompleteSimple'), { ssr: false });
const ServiceAutocomplete = dynamic(() => import('@/components/masters/ServiceAutocomplete'), { ssr: false });
const LanguageAutocomplete = dynamic(() => import('@/components/LanguageAutocomplete'), { ssr: false });

import { SERVICE_GROUPS } from '@/constants/services';
import { LANGUAGE_OPTIONS } from '@/constants/options';

type MasterItem = {
  id: string;
  displayName?: string;
  city?: string;
  services?: string[];
  languages?: string[];
  photos?: { url: string; path?: string; w?: number; h?: number }[];
  location?: { lat: number; lng: number };
  ratingAvg?: number;
  status?: string;
};

// Using imported SERVICE_GROUPS and LANGUAGE_OPTIONS

// Removed unused TextInput and Chip components - now using autocomplete components

function Stars({ rating = 0 }: { rating?: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div aria-label={`${r} out of 5`} className="text-rose-500">
      {'★★★★★'.slice(0, r)}<span className="text-rose-200">{'★★★★★'.slice(r)}</span>
    </div>
  );
}

function MasterCard({ item }: { item: MasterItem }) {
  const name = item.displayName || 'Beauty master';
  const city = item.city || '';
  const service = (item.services && item.services[0]) ? item.services[0] : '';
  const photo = item.photos?.[0]?.url;

  return (
    <article className="group rounded-2xl border border-rose-100 bg-white shadow-sm motion-safe:hover:shadow-md motion-safe:hover:-translate-y-0.5 transition-transform transition-shadow duration-200 ease-out overflow-hidden">
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-rose-50">
        {photo ? (
          <Image src={photo} alt={name} fill className="object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-300 ease-out" />
        ) : null}
      </div>
      <div className="p-3 md:p-4">
        <h3 className="text-sm md:text-base font-semibold text-rose-900 line-clamp-1">{name}</h3>
        <p className="text-xs md:text-sm text-rose-700/80 line-clamp-2">{city}{service ? ` · ${service}` : ''}</p>
        <div className="mt-2"><Stars rating={item.ratingAvg ?? 5} /></div>
      </div>
    </article>
  );
}

function useMastersRealtime(filters: { city: string; service?: string|null; language?: string|null; }) {
  const { city, service, language } = filters;
  const [data, setData] = useState<MasterItem[]|null>(null);

  useEffect(()=>{
    let unsub: (()=>void)|null = null;
    let cancelled = false;

    async function attach() {
      setData(null); // show skeletons
      const q = buildMastersQuery({ city, service, language });

      unsub = onSnapshot(
        q,
        (snap)=>{
          if (cancelled) return;
          const arr: MasterItem[] = snap.docs.map(d=>({ id: d.id, ...(d.data() as any) }));
          setData(arr);
        },
        async (err: any)=>{
          // If Firestore needs a composite index, message usually includes a link.
          console.warn('[MastersRealtime] onSnapshot error (likely missing index):', err?.message || err);
          try {
            // Fallback to one-time read to keep UI alive
            const snap = await getDocs(q);
            if (cancelled) return;
            const arr: MasterItem[] = snap.docs.map(d=>({ id: d.id, ...(d.data() as any) }));
            // Client-side sort to mimic orderBy if backend refused it
            arr.sort((a, b)=> (a.displayName||'').localeCompare(b.displayName||''));
            setData(arr);
          } catch (e) {
            console.error('[MastersRealtime] fallback getDocs failed:', e);
            if (!cancelled) setData([]);
          }
        }
      );
    }

    attach();
    return ()=>{ cancelled = true; if (unsub) unsub(); };
  }, [city, service, language]);

  return data;
}

/** Lightweight Google Map using JS API via next/script (no extra deps). */
function MapView({ points }: { points: { id:string; lat:number; lng:number; title?:string }[] }) {
  const mapRef = useRef<HTMLDivElement|null>(null);
  const mapObj = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // init map after script
  useEffect(()=>{
    if (!window.google || !mapRef.current) return;
    if (!mapObj.current) {
      mapObj.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 43.6532, lng: -79.3832 }, // Toronto default
        zoom: 8,
        mapTypeControl: false,
        streetViewControl: false,
      });
    }
  }, []);

  // update markers
  useEffect(()=>{
    if (!window.google || !mapObj.current) return;
    // clear old
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach(p=>{
      const m = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapObj.current,
        title: p.title || '',
      });
      markersRef.current.push(m);
      bounds.extend(m.getPosition()!);
    });
    if (points.length > 0) {
      mapObj.current.fitBounds(bounds);
    }
  }, [points]);

  // Initialize map when Google Maps API is loaded
  useEffect(() => {
    if (mapRef.current && window.google && !mapObj.current) {
      mapObj.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 43.6532, lng: -79.3832 },
        zoom: 8,
        mapTypeControl: false,
        streetViewControl: false,
      });
    }
  }, []);

  return (
    <div className="w-full h-[300px] md:h-[420px] rounded-2xl border border-rose-100 overflow-hidden bg-rose-50">
      <MapContainer>
        <div ref={mapRef} className="w-full h-full" />
      </MapContainer>
    </div>
  );
}

declare global {
  interface Window { google: any }
}

export default function MastersRealtime() {
  const [city, setCity] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  
  // Convert arrays to single values for query compatibility
  const service = selectedServices.length > 0 ? selectedServices[0] : null;
  const language = selectedLanguages.length > 0 ? selectedLanguages[0] : null;

  const rawData = useMastersRealtime({ city, service, language });
  const isLoading = rawData === null;

  // Apply client-side rating filter and sort:
  const filtered = useMemo(()=>{
    const arr = (rawData ?? []).filter(it => {
      const okRating = minRating ? (Number(it.ratingAvg ?? 0) >= minRating) : true;
      return okRating;
    });
    // keep stable sort by name for nice UX
    arr.sort((a,b)=> (a.displayName||'').localeCompare(b.displayName||''));
    return arr;
  }, [rawData, minRating]);

  const markers = useMemo(()=> {
    return filtered
      .filter(d => d.location && typeof d.location.lat === 'number' && typeof d.location.lng === 'number')
      .map(d => ({ id: d.id, lat: d.location!.lat, lng: d.location!.lng, title: d.displayName || '' }));
  }, [filtered]);

  return (
    <section className="container mx-auto px-4 my-6 md:my-8 flex flex-col gap-5">
      {/* Filters row */}
      <div className="rounded-2xl border border-rose-100 bg-white/90 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* City */}
        <div className="min-w-[240px]">
          <CityAutocomplete
            value={city}
            onChange={setCity}
            placeholder="City (e.g., Toronto, ON)"
          />
          <p className="text-xs text-rose-500/70 mt-1">Start typing to search cities.</p>
        </div>

        {/* Service */}
        <div className="min-w-[220px]">
          <ServiceAutocomplete
            value={selectedServices}
            onChange={setSelectedServices}
            groups={SERVICE_GROUPS}
            placeholder="Service"
          />
        </div>

        {/* Language */}
        <div className="min-w-[200px]">
          <LanguageAutocomplete
            value={selectedLanguages}
            onChange={setSelectedLanguages}
            options={LANGUAGE_OPTIONS.map(l => l.value)}
            placeholder="Language"
          />
        </div>

        {/* Min rating */}
        <div className="min-w-[160px]">
          <label className="text-xs text-rose-600/80 block mb-1">Min rating</label>
          <select
            value={minRating}
            onChange={(e)=> setMinRating(Number(e.target.value))}
            className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value={0}>Any</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5</option>
          </select>
        </div>
      </div>

      {/* Map */}
      <MapView points={markers} />

      {/* List */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4 md:gap-6">
        {isLoading ? (
          Array.from({length:8}).map((_,i)=>(
            <div key={i} className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
              <div className="relative w-full aspect-[4/5] bg-rose-100/70 skeleton-shimmer" />
              <div className="p-3 md:p-4 space-y-2">
                <div className="h-4 rounded-md bg-rose-100/80 skeleton-shimmer w-3/4" />
                <div className="h-3 rounded-md bg-rose-100/70 skeleton-shimmer w-2/3" />
                <div className="h-3 rounded-md bg-rose-100/60 skeleton-shimmer w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.map(item=>(
          <MasterCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
