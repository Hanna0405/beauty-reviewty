'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

type Item = {
  id: string;
  image?: string;
  name?: string;
  title?: string;
  displayName?: string;
  city?: string;
  cityName?: string;
  services?: { name?: string; key?: string }[];
  photos?: any[];
  coverUrl?: string;
  imageUrl?: string;
  ratingAvg?: number;
  rating?: number;
};

type ServiceOption = {
  name?: string;
  key?: string;
};

function Stars({ rating = 0 }: { rating?: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return <div className="text-rose-500 text-xs">{'★★★★★'.slice(0, r)}<span className="text-rose-200">{'★★★★★'.slice(r)}</span></div>;
}

export default function FeaturedMastersRow() {
  const [items, setItems] = useState<Item[]|null>(null);

  useEffect(()=>{
    (async ()=>{
      try {
        // Use the same query approach as /masters page: collection('listings') with orderBy createdAt
        const qy = query(
          collection(db, 'listings'),
          orderBy('createdAt', 'desc'),
          limit(3) // STRICT: 3 items
        );
        const snap = await getDocs(qy);
        
        // Normalize listings data similar to fetchListingsOnce
        const featured = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || data.name || data.displayName || "Listing",
            displayName: data.displayName || data.title || data.name || "Listing",
            city: data.cityName || data.city?.formatted || data.city?.name || data.city || "",
            services: data.services || [],
            // Normalize image field - try multiple possible sources
            image:
              (data.photos && Array.isArray(data.photos) && data.photos.length > 0 && 
                (typeof data.photos[0] === 'string' ? data.photos[0] : data.photos[0]?.url)) ||
              data.coverUrl ||
              data.imageUrl ||
              data.photoUrl ||
              null,
            ratingAvg: data.ratingAvg || data.rating || 0,
          };
        });
        
        setItems(featured);
      } catch (error) {
        console.error('[FeaturedMastersRow] Failed to load listings:', error);
        setItems([]);
      }
    })();
  }, []);

  const data = items ?? [];

  // skeletons to preserve height
  if (!items) {
    return (
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex gap-3 w-max">
          {Array.from({length:3}).map((_,i)=>(
            <div key={i} className="w-[150px] md:w-[170px] rounded-xl border border-rose-100 bg-white shadow-sm">
              <div className="w-full aspect-[3/4] bg-rose-100/70 skeleton-shimmer rounded-t-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex gap-3 w-max">
        {data.map((it)=> {
          const name = it.displayName || it.title || it.name || 'Beauty master';
          const city = it.city || '';
          const firstService = (it.services && it.services[0]) as ServiceOption | string | undefined;

          let service = "";
          if (typeof firstService === "string") {
            service = firstService;
          } else if (firstService) {
            service = firstService.name || firstService.key || "";
          }
          return (
            <article key={it.id} className="w-[150px] md:w-[170px] rounded-xl border border-rose-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="relative w-full aspect-[3/4] bg-rose-50">
                {it.image ? (
                  <Image 
                    src={it.image} 
                    alt={name} 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 768px) 150px, 170px"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                    No photo
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="text-[12.5px] md:text-sm font-semibold text-rose-900 truncate">{name}</h3>
                <p className="text-[11px] md:text-xs text-rose-700/80 truncate">{city}{service ? ` · ${service}` : ''}</p>
                <div className="mt-1"><Stars rating={it.ratingAvg ?? 5} /></div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}