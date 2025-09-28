'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import Image from 'next/image';

type Item = {
  id: string;
  displayName?: string;
  city?: string;
  services?: string[];
  photos?: { url: string }[];
  ratingAvg?: number;
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
        const qy = query(
          collection(db, 'listings'), // adapt if your collection differs
          where('status','==','active'),
          orderBy('displayName'),
          limit(3) // STRICT: 3 items
        );
        const snap = await getDocs(qy);
        setItems(snap.docs.map(d=>({ id: d.id, ...(d.data() as any) })));
      } catch { setItems([]); }
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
          const photo = it.photos?.[0]?.url;
          const name = it.displayName ?? 'Beauty master';
          const city = it.city ?? '';
          const service = it.services?.[0] ?? '';
          return (
            <article key={it.id} className="w-[150px] md:w-[170px] rounded-xl border border-rose-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="relative w-full aspect-[3/4] bg-rose-50">
                {photo ? <Image src={photo} alt={name} fill className="object-cover" /> : null}
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