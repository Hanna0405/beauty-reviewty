"use client";
import React, { useEffect, useMemo, useState } from "react";
import { listenAllMasters } from "@/lib/firestore-listings";
import Link from "next/link";

type Item = {
id: string;
title: string;
city?: string | {name: string; lat?: number; lng?: number};
services?: string[];
languages?: string[];
rating?: number; // 0..5
status?: "active" | "hidden";
lat?: number;
lng?: number;
coverUrl?: string | null;
};

export default function MastersPage() {
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);

// filters
const [qName, setQName] = useState("");
const [qService, setQService] = useState("");
const [qCity, setQCity] = useState("");
const [qLang, setQLang] = useState("");
const [qRating, setQRating] = useState<number | "">("");

useEffect(() => {
const unsub = listenAllMasters((docs: Item[]) => {
setItems(docs);
setLoading(false);
// draw markers when script loaded
setTimeout(() => drawMap(docs), 0);
});
return () => unsub?.();
}, []);

const filtered = useMemo(() => {
return items.filter(i => {
if (qName && !i.title?.toLowerCase().includes(qName.toLowerCase())) return false;
if (qService && !(i.services || []).some(s => s.toLowerCase().includes(qService.toLowerCase()))) return false;
if (qCity && !(typeof i.city === "string" ? i.city : i.city?.name || "").toLowerCase().includes(qCity.toLowerCase())) return false;
if (qLang && !(i.languages || []).some(l => l.toLowerCase().includes(qLang.toLowerCase()))) return false;
if (qRating !== "" && (i.rating || 0) < Number(qRating)) return false;
return true;
});
}, [items, qName, qService, qCity, qLang, qRating]);

return (
<div className="px-4 py-6 max-w-6xl mx-auto">
<h1 className="text-xl font-semibold mb-4">All Masters</h1>

{/* Filters */}
<div className="grid md:grid-cols-5 gap-3 mb-5">
<input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Name"
value={qName} onChange={e=>setQName(e.target.value)} />
<input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Service"
value={qService} onChange={e=>setQService(e.target.value)} />
<input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="City"
value={qCity} onChange={e=>setQCity(e.target.value)} />
<input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Language"
value={qLang} onChange={e=>setQLang(e.target.value)} />
<select className="rounded-lg border border-gray-200 px-3 py-2" value={qRating} onChange={e=>setQRating(e.target.value === "" ? "" : Number(e.target.value))}>
<option value="">Rating</option>
<option value="4">4.0+</option>
<option value="4.5">4.5+</option>
<option value="5">5.0</option>
</select>
</div>

{/* Map */}
<div id="masters-map" className="w-full h-64 rounded-xl border border-gray-200 mb-6"></div>

{/* Cards */}
{loading ? <p>Loading...</p> : (
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
{filtered.map(i => (
<div key={i.id} className="rounded-xl border border-gray-200 p-4 bg-white">
<div className="aspect-[4/3] rounded-lg bg-gray-100 mb-3 overflow-hidden flex items-center justify-center">
{i.coverUrl ? <img src={i.coverUrl} alt={i.title} className="w-full h-full object-cover" /> : <span className="text-gray-400">No photo</span>}
</div>
<div className="flex items-center justify-between">
<div>
<div className="font-semibold">{i.title || "—"}</div>
<div className="text-sm text-gray-500">{typeof i.city === "string" ? i.city : i.city?.name || "—"}</div>
</div>
<span className={`text-xs px-2 py-1 rounded-md ${i.status==="active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{i.status || "—"}</span>
</div>
<div className="mt-2 text-sm text-yellow-500">{renderStars(i.rating || 0)}</div>
<Link href={`/masters/${i.id}`} className="mt-3 inline-block rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm px-3 py-2">
View
</Link>
</div>
))}
</div>
)}
</div>
);
}

function renderStars(r: number) {
const full = Math.round(r * 2) / 2;
return "★★★★★☆☆☆☆☆".slice(5 - Math.round(full), 10 - Math.round(full));
}

function drawMap(items: Item[]) {
const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
if (!document.getElementById("gmaps")) {
const s = document.createElement("script");
s.id = "gmaps";
s.async = true; s.defer = true;
s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=marker&v=weekly`;
document.head.appendChild(s);
s.onload = () => draw(items);
} else draw(items);

function draw(list: Item[]) {
const target = document.getElementById("masters-map");
if (!target) return;
const center = { lat: list.find(i=>i.lat)?.lat || 43.6532, lng: list.find(i=>i.lng)?.lng || -79.3832 };
const map = new (window as any).google.maps.Map(target, { center, zoom: 7 });
list.forEach(i => {
if (i.lat && i.lng) {
new (window as any).google.maps.Marker({ position: { lat: i.lat, lng: i.lng }, map, title: i.title });
}
});
}
}