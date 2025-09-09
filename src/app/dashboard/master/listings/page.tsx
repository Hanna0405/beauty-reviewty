"use client";
import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/lib/useAuthUser";
import { listenMyListingsSafe } from "@/lib/listen-my-listings";
import { deleteListingCascade } from "@/lib/firestore-listings";

type Row = { id:string; title?:string; city?:string | {name: string; lat?: number; lng?: number}; status?:string; photos?:string[] };

export default function MyListingsPage() {
 const { user, loading:authLoading } = useAuthUser();
 const [rows, setRows] = useState<Row[]>([]);
 const [loading, setLoading] = useState(true);
 const [err, setErr] = useState<string | null>(null);
 const offRef = useRef<null | (()=>void)>(null);

 // Guard: never keep spinner forever
 useEffect(() => {
 const t = setTimeout(() => { if (loading) setLoading(false); }, 8000);
 return () => clearTimeout(t);
 }, [loading]);

 useEffect(() => {
 if (authLoading) return;
 if (!user) { setRows([]); setLoading(false); setErr(null); return; }
 setLoading(true); setErr(null);
 try {
 offRef.current?.();
 offRef.current = listenMyListingsSafe(
 user.uid,
 (r)=>{ setRows(r); setLoading(false); },
 (e)=>{ setErr(e?.message || String(e)); setLoading(false); }
 );
 } catch (e:any) {
 setErr(e?.message || String(e));
 setLoading(false);
 }
 return () => { try { offRef.current?.(); } catch {} };
 }, [authLoading, user?.uid]);

 async function onDelete(row: Row) {
 if (!confirm("Delete this listing? This cannot be undone.")) return;
 try {
 await deleteListingCascade(row.id, row.photos || []);
 alert("Listing deleted.");
 } catch (e:any) {
 alert("Delete failed: " + (e?.message || String(e)));
 }
 }

 return (
 <div className="max-w-5xl mx-auto p-4 hl-soft">
 <div className="flex items-center justify-between mb-4">
 <h1 className="text-xl font-semibold">My Listings</h1>
 <a href="/dashboard/master/listings/new" className="btn btn-primary">+ Listing</a>
 </div>

 {loading && <p>Loading...</p>}

 {!loading && err && (
 <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
 Could not load listings. {err}
 <div className="mt-2">
 <button className="btn btn-primary" onClick={()=>location.reload()}>Try again</button>
 </div>
 </div>
 )}

 {!loading && !err && rows.length === 0 && (
 <p>No listings yet. Click <span className="font-medium">"+ Listing"</span> to create one.</p>
 )}

 {!loading && !err && rows.length > 0 && (
 <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
 {rows.map((it) => (
 <li key={it.id} className="bg-white rounded-xl border-2 border-pink-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
 <div className="aspect-video bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center relative">
 {(it.photos && it.photos.length) ? (
 <img 
  src={it.photos[0]} 
  alt={it.title || "Listing photo"}
  className="w-full h-full object-cover" 
 />
 ) : (
 <div className="text-center">
  <div className="text-4xl mb-2">📸</div>
  <span className="text-sm text-pink-400">No photo</span>
 </div>
 )}
 <div className="absolute top-2 right-2">
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
   it.status === "active" 
    ? "bg-green-100 text-green-800" 
    : "bg-gray-100 text-gray-800"
  }`}>
   {it.status || "active"}
  </span>
 </div>
 </div>
 <div className="p-4">
 <div className="flex items-start justify-between mb-2">
  <h3 className="font-semibold text-gray-800 truncate flex-1">{it.title || "Untitled"}</h3>
 </div>
 <div className="text-sm text-gray-600 mb-2">
  📍 {typeof it.city === "string" ? it.city : it.city?.name || "No location"}
 </div>
 <div className="text-xs text-gray-500 mb-4">
  📷 {(it.photos || []).length} photos
 </div>
 <div className="flex gap-2">
  <a 
   href={`/dashboard/master/listings/${it.id}/edit`} 
   className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors text-center"
  >
   Edit
  </a>
  <a 
   href={`/masters/${it.id}`} 
   className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors text-center"
  >
   View
  </a>
  <button 
   onClick={()=>onDelete(it)} 
   className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
  >
   Delete
  </button>
 </div>
 </div>
 </li>
 ))}
 </ul>
 )}
 </div>
 );
}