'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { ReviewsSection } from '@/components/ReviewsSection';
import { fetchProfileByUid } from '@/lib/data/profiles';

type Photo = { url: string; path: string; width?: number; height?: number };
type Listing = {
  title: string;
  city?: string;
  citySlug?: string;
  masterUid?: string;
  services?: string[];
  languages?: string[];
  status?: string;
  photos?: Photo[];
};
type Profile = {
  uid: string;
  displayName?: string;
  avatarUrl?: string;
  city?: string;
  cityLabel?: string;
  services?: string[];
  ratingAvg?: number;
  reviewsCount?: number;
  slug?: string;
};

export default function ListingView() {
 const params = useParams();
 const id = params?.id as string;
 const [data, setData] = useState<Listing | null>(null);
 const [master, setMaster] = useState<Profile | null>(null);
 const [idx, setIdx] = useState(0);

 useEffect(() => {
 async function load() {
 const snap = await getDoc(doc(db, 'listings', id));
 if (snap.exists()) {
 const d = snap.data() as any;
 setData(d);
 setIdx(0);
 
        // Load master profile if masterUid is available
        if (d.masterUid) {
          try {
            const masterProfile = await fetchProfileByUid(d.masterUid);
            setMaster(masterProfile);
          } catch (error) {
            console.error('Error loading master profile:', error);
          }
        }
 }
 }
 load();
 }, [id]);

 // Keyboard navigation
 useEffect(() => {
 const onKey = (e: KeyboardEvent) => {
 if (!data?.photos?.length) return;
 if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % data.photos!.length);
 if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + data.photos!.length) % data.photos!.length);
 };
 window.addEventListener('keydown', onKey);
 return () => window.removeEventListener('keydown', onKey);
 }, [data]);

 const photos = data?.photos ?? [];
 const active = photos[idx];

 return (
 <div className="max-w-6xl mx-auto p-6">
 {/* Breadcrumbs */}
 <nav className="breadcrumbs text-sm mb-3">
 <ul>
 <li><a href="/masters">Masters</a></li>
 {data?.citySlug && <li><a href={`/masters?city=${data.citySlug}`}>{data.city || 'City'}</a></li>}
 {master?.slug && <li><a href={`/masters/${master.slug}`}>{master.displayName}</a></li>}
 <li>Listing</li>
 </ul>
 </nav>

 <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
 {/* GALLERY */}
 <div>
 <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
 {active?.url ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={active.url} alt={`${data?.title} ${idx+1}`} className="h-full w-full object-cover select-none" />
 ) : (
 <div className="h-full w-full flex items-center justify-center text-gray-400">No photos yet</div>
 )}
 {photos.length > 1 && (
 <>
 <button onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
 aria-label="Prev" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-3 py-2 hover:bg-white">
 ←
 </button>
 <button onClick={() => setIdx((i) => (i + 1) % photos.length)}
 aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-3 py-2 hover:bg-white">
 →
 </button>
 </>
 )}
 </div>

 {photos.length > 1 && (
 <div className="mt-3 flex gap-2 overflow-x-auto">
 {photos.map((p, i) => (
 <button key={p.path ?? p.url} onClick={() => setIdx(i)}
 className={`relative h-20 w-28 rounded-lg overflow-hidden border ${i===idx ? 'border-pink-600' : 'border-transparent'}`}>
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={p.url} alt={`thumb ${i+1}`} className="h-full w-full object-cover" />
 </button>
 ))}
 </div>
 )}
 </div>

 {/* DETAILS */}
 <aside className="space-y-4">
 <h1 className="text-3xl font-semibold">{data?.title}</h1>
 <div className="flex flex-wrap gap-2 items-center text-sm">
 {data?.status && <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">{data.status}</span>}
 {data?.city && <span className="text-gray-600">{data.city}</span>}
 </div>

 {data?.services?.length ? (
 <div>
 <div className="font-medium mb-1">Services</div>
 <div className="flex flex-wrap gap-2">
 {data.services.map(s => <span key={s} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{s}</span>)}
 </div>
 </div>
 ) : null}

 {data?.languages?.length ? (
 <div>
 <div className="font-medium mb-1">Languages</div>
 <div className="flex flex-wrap gap-2">
 {data.languages.map(l => <span key={l} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{l}</span>)}
 </div>
 </div>
 ) : null}

 <a href="/booking" className="inline-flex items-center justify-center w-full md:w-auto px-5 py-3 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition">
 Book now
 </a>
 </aside>

 {/* About the Master Card */}
 {master && (
 <aside className="card bg-base-100 border p-4 mt-4">
 <div className="flex items-center gap-3">
 <img src={master.avatarUrl || '/placeholder.jpg'} alt={master.displayName} className="w-12 h-12 rounded-full object-cover" />
 <div>
 <a href={`/masters/${master.slug || master.uid}`} className="font-medium hover:underline">{master.displayName}</a>
 <div className="text-sm opacity-70">{master.city || 'City'}</div>
 <div className="text-sm">★ {master.ratingAvg?.toFixed?.(1) ?? "—"} ({master.reviewsCount ?? 0})</div>
 </div>
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {/* show up to 3 service tags from the master profile */}
 {master.services?.slice(0,3).map(s => <span key={s} className="badge">{s}</span>)}
 </div>
 <a href={`/masters/${master.slug || master.uid}`} className="btn btn-sm btn-outline mt-3">View profile</a>
 </aside>
 )}

 <ReviewsSection listingId={id} />
 </div>
 </div>
 );
}