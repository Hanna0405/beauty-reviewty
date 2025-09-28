'use client';
import React, { useEffect, useState } from "react";
import { fetchBookings, updateBooking } from "@/components/booking/api";
import { BookingCard } from "@/components/booking/BookingCard";
import { useAuth } from "@/contexts/AuthContext";

export default function BookingsPage() {
 const { user, profile } = useAuth();
 const [items, setItems] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 async function load() {
 if (!user) return;
 try {
 setLoading(true);
 const role = profile?.role || "client";
 const list = await fetchBookings(role === "master" ? "master" : "client", user.uid);
 setItems(list);
 setError(null);
 } catch (e:any) {
 setError(e?.message || "Error");
 } finally {
 setLoading(false);
 }
 }

 useEffect(() => { load(); }, [user?.uid, profile?.role]);

 async function act(id:string, action:"confirm"|"decline"|"delete") {
 if (!user) return;
 await updateBooking(id, action, user.uid);
 await load();
 }

 if (!user) return <div>Please sign in</div>;
 if (loading) return <div>Loading...</div>;
 if (error) return <div className="text-red-600">Error: {error}</div>;

 return (
 <div className="space-y-4 p-6">
 <a href="/dashboard" className="inline-block">
 <h1 className="text-2xl font-bold hover:text-pink-600 transition">My bookings</h1>
 </a>
 {!items.length && <div className="text-gray-500">No bookings yet</div>}
 <ul className="space-y-3">
 {items.map(b => (
 <BookingCard key={b.id} item={b} role={profile?.role === "master" ? "master" : "client"} onAction={act} />
 ))}
 </ul>
 </div>
 );
}