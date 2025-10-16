'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import Link from 'next/link';
import ReviewtyCreateModal from './ReviewtyCreateModal';
import Filters, { ReviewtyFilters } from './Filters';
import { fetchMastersByUids, type MinimalMaster } from './lib/joinMasters';
import { buildPersonLabel } from './lib/personLabel';
import { cityToDisplay } from '@/lib/city/format';

function safeJoin(v: any): string {
  if (!v) return '';
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  return String(v);
}

function safeText(v: any): string {
  if (v == null) return '';
  if (typeof v === 'object') {
    // Do NOT render objects; try to stringify most common cases
    if ('name' in v) return String((v as any).name ?? '');
    return '';
  }
  return String(v);
}

type ReviewDoc = {
  id: string;
  text: string;
  rating: number;
  photos?: { url: string; path: string }[];
  city?: string;
  services?: string[];
  languages?: string[];
  createdAt?: any;
  masterRef?: { type: 'listing'|'community', id: string, slug?: string, listingId?: string };
  masterUid?: string;
  displayName?: string;
  nickname?: string;
  contactName?: string;
  phone?: string;
  // Denormalized fields for public reviews
  masterId?: string;
  masterCity?: string;
  masterServices?: string[];
  masterLanguages?: string[];
  masterDisplay?: string;
  masterKeywords?: string[];
  masterSlug?: string;
};

const PAGE_SIZE = 12;

const initialFilters: ReviewtyFilters = {
  city: null,
  services: [],
  languages: [],
  ratingGte: null,
  personQuery: undefined,
};

export default function ReviewtyPage() {
  const [filters, setFilters] = useState<ReviewtyFilters>(initialFilters);

  const [items, setItems] = useState<ReviewDoc[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mastersMap, setMastersMap] = useState<Record<string, MinimalMaster>>({});

  const queryParams = useMemo(() => {
    const params: any = {};
    if (filters.city) {
      params.city = filters.city;
    }
    if (filters.services.length) {
      params.services = filters.services.map((s) => s.value);
    }
    if (filters.languages.length) {
      params.languages = filters.languages.map((l) => l.value);
    }
    if (filters.ratingGte != null) {
      params.ratingGte = filters.ratingGte;
    }
    return params;
  }, [filters]);

  async function fetchPage(reset = false) {
    if (loading || (done && !reset)) return;
    setLoading(true);
    try {
      // Build Firestore query with proper ordering and filters
      const constraints: any[] = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
      
      // Add filters using denormalized fields
      if (queryParams.city) constraints.unshift(where('masterCity', '==', queryParams.city));
      if (queryParams.services?.length) {
        constraints.unshift(where('masterServices', 'array-contains', queryParams.services[0]));
      }
      if (queryParams.languages?.length) {
        constraints.unshift(where('masterLanguages', 'array-contains', queryParams.languages[0]));
      }
      if (filters.personQuery?.trim()) {
        const keyword = filters.personQuery.trim().toLowerCase();
        const phoneDigits = keyword.replace(/\D+/g, '');
        const term = phoneDigits.length >= 6 ? phoneDigits : keyword;
        if (term) constraints.unshift(where('masterKeywords', 'array-contains', term));
      }
      
      const q = query(collection(db, 'publicReviews'), ...constraints);

      const snap = await getDocs(reset ? query(q, limit(PAGE_SIZE)) : (cursor ? query(q, startAfter(cursor)) : q));
      
      // Normalize data before setState
      const normalized = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          rating: Number(data.rating ?? 0),
          text: safeText(data.text),
          photos: Array.isArray(data.photos) ? data.photos : [],
          city: data.city, // keep as-is, render via cityName()
          services: data.services, // can be string[] or string
          languages: data.languages,
          listingId: data.listingId,
          createdAt: data.createdAt,
          author: data.author ?? data.authorMasked ?? null,
          masterRef: data.masterRef,
          masterUid: data.masterUid,
          displayName: data.displayName,
          nickname: data.nickname,
          contactName: data.contactName,
          phone: data.phone,
          masterId: data.masterId,
          masterCity: data.masterCity,
          masterServices: data.masterServices,
          masterLanguages: data.masterLanguages,
          masterDisplay: data.masterDisplay,
          masterKeywords: data.masterKeywords,
          masterSlug: data.masterSlug,
        };
      }) as ReviewDoc[];
      
      const last = snap.docs[snap.docs.length - 1] ?? null;

      // client-side filtering with safe utilities
      let filtered = normalized;
      if (queryParams.ratingGte != null) {
        filtered = filtered.filter(d => (d.rating ?? 0) >= queryParams.ratingGte);
      }

      console.log("[reviewty] loaded", filtered.length);

      setItems(reset ? filtered : [...items, ...filtered]);
      setCursor(last);
      setDone(snap.size < PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }

  // Fetch master data when items change
  const masterUids = useMemo(
    () => Array.from(new Set(items.map((r: any) => r.masterUid).filter(Boolean))),
    [items]
  );

  useEffect(() => {
    if (masterUids.length > 0) {
      fetchMastersByUids(masterUids).then(setMastersMap);
    }
  }, [masterUids]);

  // Apply person query filter
  const filteredItems = useMemo(() => {
    if (!filters.personQuery?.trim()) return items;
    
    const q = filters.personQuery.trim().toLowerCase();
    return items.filter((r: any) => {
      const m = mastersMap[r.masterUid];
      const label = buildPersonLabel(r, m)?.toLowerCase() ?? "";
      const extra = [
        r.displayName, r.nickname, r.contactName, r.phone,
        m?.displayName, m?.nickname, m?.phone
      ].filter(Boolean).join(" ").toLowerCase();
      
      return label.includes(q) || extra.includes(q);
    });
  }, [items, mastersMap, filters.personQuery]);

  useEffect(() => {
    // refetch when filters change (except personQuery which is client-side)
    setCursor(null);
    setDone(false);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.city, filters.services, filters.languages, filters.ratingGte]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">People's Reviews</h1>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('reviewty:openCreate'))}
          className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
        >Add review</button>
      </header>

      {/* Filters */}
      <div className="rounded-xl border p-4">
        <Filters
          value={filters}
          onChange={setFilters}
          onReset={() => setFilters(initialFilters)}
        />
      </div>

      {/* Feed */}
      <ul className="grid md:grid-cols-2 gap-4">
        {filteredItems.map(r => {
          const master = mastersMap[r.masterUid || ''];
          const personLabel = buildPersonLabel(r, master);
          
          return (
            <li key={r.id} className="rounded-xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{'★'.repeat(Math.round(r.rating || 0))}</div>
                <div className="text-sm text-gray-500">{safeText(r.masterCity) || cityToDisplay(r.city) || '—'}</div>
              </div>
              <p className="text-gray-800 line-clamp-4">{safeText(r.text)}</p>
              {!!r.photos?.length && (
                <div className="flex gap-2">
                  {r.photos.slice(0,3).map((p,i)=>(
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.path ?? i} src={p.url} alt={`photo ${i+1}`} className="h-24 w-24 object-cover rounded" />
                  ))}
                </div>
              )}
              {/* Master info and link */}
              <div className="mt-2 text-sm text-zinc-600">
                <span className="font-medium">{safeText(r.masterCity) || "—"}</span>
              </div>
              <div className="mt-1">
                {/* Link to master */}
                {r.masterRef?.type === 'listing' && r.masterRef.id && (
                  <Link href={`/masters/${String(r.masterRef.id)}`} className="text-pink-600 underline">
                    Master card — {safeText(r.masterDisplay) || safeText(personLabel) || "Unknown"}
                  </Link>
                )}
                {r.masterRef?.type === 'community' && r.masterRef.slug && (
                  <Link href={`/reviewty/m/${r.masterRef.slug}`} className="text-pink-600 underline">
                    Master card — {safeText(r.masterDisplay) || safeText(personLabel) || "Unknown"}
                  </Link>
                )}
                {!r.masterRef && r.masterId && (
                  <Link href={`/reviewty/m/${r.masterSlug || r.masterId}`} className="text-pink-600 underline">
                    Master card — {safeText(r.masterDisplay) || "Unknown"}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pt-4 flex justify-center">
        {!done && !filters.personQuery ? (
          <button onClick={()=>fetchPage()} disabled={loading} className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60">
            {loading ? 'Loading...' : 'Show more'}
          </button>
        ) : <div className="text-gray-500">That's all</div>}
      </div>

      {/* Creation modal is handled below */}
      <ReviewtyCreateModal />
    </div>
  );
}
