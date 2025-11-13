'use client';
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "@/lib/firebaseClient";
import { useAuth } from "@/contexts/AuthContext";

const db = app ? getFirestore(app) : null;

export default function BookingsPage() {
 const { user } = useAuth();
 const [bookings, setBookings] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!user || !db) return;
 setLoading(true);

 const base = collection(db, "bookings");
 const q1 = query(base, where("clientId", "==", user.uid));
 const q2 = query(base, where("clientUid", "==", user.uid));

 Promise.all([getDocs(q1), getDocs(q2)])
 .then(([snap1, snap2]) => {
 const map = new Map<string, any>();
 snap1.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
 snap2.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
 const list = Array.from(map.values()).sort((a, b) => {
 const t1 = a.startMs ?? a.startISO ?? a.createdAt?._seconds ?? 0;
 const t2 = b.startMs ?? b.startISO ?? b.createdAt?._seconds ?? 0;
 return Number(t2) - Number(t1);
 });
 setBookings(list);
 setError(null);
 })
 .catch((e) => setError(e?.message || "Failed to load bookings"))
 .finally(() => setLoading(false));
 }, [user?.uid]);

 if (!user) return <div className="p-6">Please sign in</div>;
 if (loading) return <div className="p-6">Loading…</div>;
 if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

 return (
 <div className="space-y-4 p-6">
 <Link href="/dashboard" className="inline-block">
 <h1 className="text-2xl font-bold hover:text-pink-600 transition">My bookings</h1>
 </Link>
 <div className="space-y-4">
 {bookings.length === 0 ? (
 <p className="text-sm text-gray-500">No bookings yet.</p>
 ) : (
 bookings.map((booking) => {
 const chatId =
 booking.masterUid && booking.clientId
 ? `${booking.masterUid}_${booking.clientId}`
 : null;

 return (
 <div
 key={booking.id}
 className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-pink-100 bg-white/80 shadow-sm px-4 py-3"
 >
 <div className="space-y-1">
 <p className="text-xs uppercase tracking-wide text-pink-400">
 Booking #{booking.id?.slice?.(0, 6) || ""}
 </p>
 <p className="text-sm font-semibold text-gray-900">
 To: {booking.masterName || booking.masterId || "Master"}
 </p>
 <p className="text-xs text-gray-500">
 Date &amp; time:{" "}
 {booking.startISO ||
 booking.date ||
 booking.startAt ||
 "—"}
 </p>
 </div>

 <div className="flex gap-2 items-center">
 <span
 className={`px-3 py-1 rounded-full text-xs font-medium ${
 booking.status === "confirmed"
 ? "bg-green-100 text-green-700"
 : booking.status === "declined"
 ? "bg-red-100 text-red-600"
 : "bg-yellow-50 text-yellow-700"
 }`}
 >
 {booking.status || "pending"}
 </span>
 {chatId ? (
 <Link
 href={`/dashboard/chat/${chatId}`}
 className="inline-flex items-center gap-1 rounded-lg bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1 hover:bg-pink-200 transition"
 >
 Chat
 </Link>
 ) : null}
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 );
}