"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { normalizePhotos } from "@/lib/normalize";
import { normalizeImageUrl } from '@/lib/normalizeImageUrl';
import { resolveGsUrl } from '@/lib/resolveGsUrl';

type Props = {
photos: string[]; // array of image URLs
title?: string;
className?: string;
};

export default function ListingGallery({ photos = [], title = "Photo", className = "" }: Props) {
const [active, setActive] = useState(0);
const [urls, setUrls] = useState<string[]>([]);

useEffect(() => {
  const run = async () => {
    const normalized = await Promise.all(
      (photos ?? []).map(async (p) => {
        const n = normalizeImageUrl(p);
        if (n) return n;
        if (typeof p === 'string' && p.startsWith('gs://')) return await resolveGsUrl(p);
        return null;
      })
    );
    setUrls(normalized.filter(Boolean) as string[]);
  };
  run();
}, [photos]);

const src = urls[active] || urls[0] || "/placeholder.png";

return (
<div className={className}>
{/* Main image */}
<div className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] rounded-xl overflow-hidden bg-neutral-100">
{urls.length > 0 ? (
  <Image
    src={src}
    alt={title}
    fill
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 720px"
    className="object-cover"
    priority
    unoptimized
  />
) : (
  <div className="flex h-full w-full items-center justify-center text-gray-400">No photos</div>
)}
</div>

{/* Thumbs */}
{urls.length > 1 && (
<div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
{urls.map((p, i) => (
<button
key={i}
onClick={() => setActive(i)}
className={`relative h-16 w-20 shrink-0 rounded-md overflow-hidden border ${i === active ? "border-pink-500" : "border-transparent"}`}
aria-label={`photo ${i + 1}`}
>
<Image src={p} alt={`${title} ${i + 1}`} fill className="object-cover" unoptimized />
</button>
))}
</div>
)}
</div>
);
}
