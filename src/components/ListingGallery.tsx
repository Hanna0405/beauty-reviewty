"use client";

import Image from "next/image";
import { useState } from "react";
import { normalizePhotos } from "@/lib/normalize";

type Props = {
photos: string[]; // array of image URLs
title?: string;
className?: string;
};

export default function ListingGallery({ photos = [], title = "Photo", className = "" }: Props) {
const [active, setActive] = useState(0);
const list = normalizePhotos(photos);
const src = list[active] || list[0] || "/placeholder.png";

return (
<div className={className}>
{/* Main image */}
<div className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] rounded-xl overflow-hidden bg-neutral-100">
<Image
src={src}
alt={title}
fill
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 720px"
className="object-cover"
priority
/>
</div>

{/* Thumbs */}
{list.length > 1 && (
<div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
{list.map((p, i) => (
<button
key={i}
onClick={() => setActive(i)}
className={`relative h-16 w-20 shrink-0 rounded-md overflow-hidden border ${i === active ? "border-pink-500" : "border-transparent"}`}
aria-label={`photo ${i + 1}`}
>
<Image src={p} alt={`${title} ${i + 1}`} fill className="object-cover" />
</button>
))}
</div>
)}
</div>
);
}
