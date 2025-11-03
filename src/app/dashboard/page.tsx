"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SafeText } from "@/components/ui/SafeText";
import { requireAuth, requireDb } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
 collection,
 query,
 where,
 onSnapshot,
 deleteDoc,
 doc,
 type DocumentData,
 type QuerySnapshot,
} from "firebase/firestore";

type ProfileRow = {
 id: string;
 displayName: string;
 city?: string;
 service?: string;
 price?: number;
 thumb?: string;
};

export default function DashboardPage() {
 const [uid, setUid] = useState<string | null>(null);
 const [rows, setRows] = useState<ProfileRow[]>([]);
 const [loading, setLoading] = useState(true);

 // get current user uid (same as in commit 87fde6a)
 useEffect(() => {
 try {
 const auth = requireAuth();
 const unsub = onAuthStateChanged(auth, (u) => {
 if (!u) {
 setUid(null);
 setRows([]);
 setLoading(false);
 return;
 }
 setUid(u.uid);
 });
 return () => unsub();
 } catch (error) {
 setUid(null);
 return;
 }
 }, []);

 // subscribe to profiles of current user
 useEffect(() => {
 if (!uid) {
 setRows([]);
 setLoading(false);
 return;
 }
 setLoading(true);
 const db = requireDb();
 const q = query(collection(db, "profiles"), where("uid", "==", uid));
 const unsub = onSnapshot(
 q,
 (snap: QuerySnapshot<DocumentData>) => {
 const list: ProfileRow[] = snap.docs.map((d) => {
 const data = d.data();
 return {
 id: d.id,
 displayName:
 (data.displayName as string) ||
 (data.name as string) ||
 "Master",
 city: (data.city as string) || "",
 service: (data.service as string) ||
 (Array.isArray(data.services) ? data.services[0] : ""),
 price: (data.price as number) ?? undefined,
 thumb:
 (data.photoUrl as string) ||
 ((data.photos?.[0] as string) ?? "/placeholder.png"),
 };
 });
 setRows(list);
 setLoading(false);
 },
 () => {
 setRows([]);
 setLoading(false);
 }
 );
 return () => unsub();
 }, [uid]);

 async function removeProfile(id: string) {
 if (!confirm("Delete this profile?")) return;
 try {
 const db = requireDb();
 await deleteDoc(doc(db, "profiles", id));
 } catch (e) {
 alert("Failed to delete profile");
 }
 }

 // if not logged in → show login block (like in old version)
 if (!uid) {
 return (
 <div className="mx-auto max-w-5xl p-6">
 <div className="mb-6 flex items-center justify-between gap-3">
 <h1 className="text-2xl font-semibold shrink-0">My profile</h1>
 <div className="min-w-0 flex-1" />
 <Link
 href="/login"
 className="shrink-0 rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
 >
 Log in
 </Link>
 </div>
 <p className="text-gray-600">Please log in to create and manage your profile.</p>
 </div>
 );
 }

 return (
 <div className="mx-auto max-w-5xl p-6">
 {/* header */}
 <div className="mb-6 flex items-center justify-between gap-3">
 <h1 className="text-2xl font-semibold shrink-0">My profile</h1>
 <div className="min-w-0 flex-1" />
 <Link
 href="/dashboard/master/profile"
 className="shrink-0 rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
 >
 + Add profile
 </Link>
 </div>

 {/* loading skeleton */}
 {loading ? (
 <div className="space-y-3">
 {[...Array(2)].map((_, i) => (
 <div
 key={i}
 className="flex items-center gap-4 rounded-lg border p-3 text-gray-200"
 >
 <div className="h-16 w-16 rounded-md bg-gray-200" />
 <div className="flex-1 space-y-2">
 <div className="h-4 w-40 bg-gray-200 rounded" />
 <div className="h-3 w-24 bg-gray-200 rounded" />
 </div>
 </div>
 ))}
 </div>
 ) : null}

 {/* empty state */}
 {!loading && rows.length === 0 ? (
 <div className="rounded-lg border p-6 text-gray-600">
 You have no profiles yet.
 <Link
 href="/dashboard/master/profile"
 className="ml-2 text-pink-600 underline"
 >
 Create one
 </Link>
 </div>
 ) : null}

 {/* list */}
 {!loading && rows.length > 0 ? (
 <div className="space-y-3">
 {rows.map((p) => (
 <div
 key={p.id}
 className="flex items-center gap-4 rounded-lg border p-3 bg-white"
 >
 <div className="h-16 w-16 overflow-hidden rounded-md bg-pink-50 relative">
 {p.thumb ? (
 <Image
 src={p.thumb}
 alt={p.displayName}
 fill
 className="object-cover"
 />
 ) : null}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium">
 <SafeText value={p.displayName} />
 </p>
 <p className="text-xs text-gray-500">
 {p.city ? `${p.city} • ` : ""}
 {p.service || "no service"}
 {typeof p.price === "number" ? ` • $${p.price} CAD` : ""}
 </p>
 </div>
 {/* actions */}
 <div className="flex gap-2">
 <Link
 href="/dashboard/master/profile"
 className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
 >
 Edit
 </Link>
 <Link
 href={`/masters/${encodeURIComponent(p.id)}`}
 className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
 >
 View
 </Link>
 <button
 onClick={() => removeProfile(p.id)}
 className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
 title="Delete profile"
 >
 Delete
 </button>
 </div>
 </div>
 ))}
 </div>
 ) : null}
 </div>
 );
}
