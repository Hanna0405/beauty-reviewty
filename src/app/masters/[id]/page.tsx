"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc as fsDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Listing = {
 title?: string;
 city?: string | {name: string; lat?: number; lng?: number};
 services?: string[];
 languages?: string[];
 status?: "active" | "hidden";
 photos?: string[];
 ratingAvg?: number;
 ratingCount?: number;
 ownerId?: string;
};

export default function MasterViewPage() {
 const { id } = useParams() as { id: string };
 const router = useRouter();

 const [data, setData] = useState<Listing | null>(null);
 const [loading, setLoading] = useState(true);
 const [notFound, setNotFound] = useState(false);

 useEffect(() => {
 let cancelled = false;
 (async () => {
 try {
 // IMPORTANT: use modular Firestore 'doc' (aliased to avoid collisions)
 const ref = fsDoc(db, "listings", id);
 const snap = await getDoc(ref);
 if (!cancelled) {
 if (snap.exists()) {
 setData(snap.data() as Listing);
 } else {
 setNotFound(true);
 }
 }
 } catch (err) {
 console.error("[masters/[id]] load error:", err);
 if (!cancelled) setNotFound(true);
 } finally {
 if (!cancelled) setLoading(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [id]);

 if (loading) {
 return (
 <div className="mx-auto max-w-5xl px-4 py-8">
 <p className="text-gray-500">Loading…</p>
 </div>
 );
 }

 if (notFound || !data) {
 return (
 <div className="mx-auto max-w-5xl px-4 py-12">
 <p className="text-gray-500 mb-6">Master not found.</p>
 <button
 onClick={() => router.push("/masters")}
 className="rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
 >
 ← Back to All Masters
 </button>
 </div>
 );
 }

 const {
 title = "—",
 city = "—",
 services = [],
 languages = [],
 status = "active",
 photos = [],
 ratingAvg,
 ratingCount,
 } = data;

 const cityName = typeof city === "string" ? city : city?.name || "—";

 return (
 <div className="mx-auto max-w-6xl px-4 py-8">
 <button
 onClick={() => router.push("/masters")}
 className="mb-6 text-sm text-pink-700 hover:underline"
 >
 ← Back to All Masters
 </button>

 <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
 {/* LEFT: gallery */}
 <div className="md:col-span-2">
 <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
 {photos?.length ? (
 <img
 src={photos[0]}
 alt={title}
 className="h-full w-full object-cover"
 loading="lazy"
 />
 ) : (
 <div className="flex h-full items-center justify-center text-gray-400">
 No photo
 </div>
 )}
 </div>

 {photos?.length > 1 && (
 <div className="mt-3 grid grid-cols-5 gap-2">
 {photos.slice(1, 6).map((url, i) => (
 <img
 key={url + i}
 src={url}
 alt={`${title} ${i + 2}`}
 className="h-16 w-full rounded-md object-cover"
 loading="lazy"
 />
 ))}
 </div>
 )}
 </div>

 {/* RIGHT: info */}
 <div className="md:col-span-3">
 <div className="mb-3 flex items-center gap-3">
 <h1 className="text-2xl font-semibold">{title}</h1>
 <span
 className={`rounded-full px-2 py-0.5 text-xs ${
 status === "active"
 ? "bg-green-100 text-green-700"
 : "bg-gray-100 text-gray-600"
 }`}
 >
 {status}
 </span>
 </div>

 <p className="text-gray-600 mb-4">{cityName}</p>

 {typeof ratingAvg === "number" && (
 <div className="mb-4 flex items-center gap-2">
 <Stars value={ratingAvg} />
 <span className="text-sm text-gray-500">
 {ratingAvg.toFixed(1)} {ratingCount ? `(${ratingCount})` : ""}
 </span>
 </div>
 )}

 <Section title="Services">
 <TagList items={services} tone="blue" />
 </Section>

 <Section title="Languages">
 <TagList items={languages} tone="green" />
 </Section>

 <div className="mt-6">
 <button
 className="rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
 onClick={() => alert("Booking flow coming soon")}
 >
 Book now
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

/* ---- tiny UI helpers (local-only) ---- */
function Section({
 title,
 children,
}: React.PropsWithChildren<{ title: string }>) {
 return (
 <div className="mb-4">
 <h2 className="mb-2 text-sm font-medium text-gray-700">{title}</h2>
 {children}
 </div>
 );
}

function TagList({
 items,
 tone = "blue",
}: {
 items: string[];
 tone?: "blue" | "green";
}) {
 const toneClass =
 tone === "green"
 ? "bg-green-100 text-green-700"
 : "bg-blue-100 text-blue-700";
 if (!items?.length) return <p className="text-gray-400">—</p>;
 return (
 <div className="flex flex-wrap gap-2">
 {items.map((v) => (
 <span key={v} className={`rounded px-2 py-1 text-xs ${toneClass}`}>
 {v}
 </span>
 ))}
 </div>
 );
}

function Stars({ value = 0 }: { value?: number }) {
 const full = Math.floor(value);
 const half = value - full >= 0.5;
 const total = 5;
 return (
 <div className="flex items-center">
 {Array.from({ length: total }).map((_, i) => {
 const idx = i + 1;
 const filled = idx <= full;
 const isHalf = !filled && idx === full + 1 && half;
 return (
 <svg
 key={i}
 width="18"
 height="18"
 viewBox="0 0 24 24"
 className={`mr-0.5 ${
 filled || isHalf ? "text-yellow-500" : "text-gray-300"
 }`}
 fill="currentColor"
 >
 <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.87 1.402-8.168L.132 9.211l8.2-1.193z" />
 </svg>
 );
 })}
 </div>
 );
}