'use client';

import { useState } from 'react';

type Props = { photos: string[] };

export default function Gallery({ photos }: Props) {
 const imgs = (photos ?? []).filter(Boolean);
 const [i, setI] = useState(0);

 if (imgs.length === 0) {
 return (
 <div className="aspect-square w-full rounded-lg bg-gray-100 grid place-items-center text-gray-400">
 No photo yet
 </div>
 );
 }

 const prev = () => setI((v) => (v - 1 + imgs.length) % imgs.length);
 const next = () => setI((v) => (v + 1) % imgs.length);

 return (
 <div className="w-full">
 {/* main square */}
 <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
 <img
 src={imgs[i]}
 alt={`photo ${i + 1}`}
 className="h-full w-full object-cover"
 draggable={false}
 />
 {imgs.length > 1 && (
 <>
 <button
 onClick={prev}
 className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 shadow hover:bg-white"
 aria-label="Previous"
 >
 ‹
 </button>
 <button
 onClick={next}
 className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 shadow hover:bg-white"
 aria-label="Next"
 >
 ›
 </button>
 </>
 )}
 </div>

 {/* thumbnails */}
 {imgs.length > 1 && (
 <div className="mt-3 flex gap-2 overflow-x-auto">
 {imgs.map((src, idx) => (
 <button
 key={src + idx}
 onClick={() => setI(idx)}
 className={`h-16 w-16 flex-none overflow-hidden rounded border ${idx === i ? 'ring-2 ring-pink-500' : 'border-gray-200'}`}
 aria-label={`Open photo ${idx + 1}`}
 >
 <img src={src} alt="" className="h-full w-full object-cover" />
 </button>
 ))}
 </div>
 )}
 </div>
 );
}
