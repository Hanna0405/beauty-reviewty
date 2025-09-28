"use client";
import { useEffect, useState } from "react";

export function useUnreadChatMap(userId?: string) {
 const [byBooking, setByBooking] = useState<Record<string, number>>({});

 const fetchMap = async () => {
 if (!userId) return;
 try {
 const r = await fetch("/api/notifications/unread-map", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ userId })
 });
 const d = await r.json();
 if (d?.ok) setByBooking(d.byBooking || {});
 } catch {}
 };

 useEffect(() => {
 fetchMap();
 const onPing = () => fetchMap();
 const onFocus = () => fetchMap();
 window.addEventListener("notify:refresh", onPing as any);
 window.addEventListener("focus", onFocus);
 const id = setInterval(fetchMap, 20000);
 return () => {
 window.removeEventListener("notify:refresh", onPing as any);
 window.removeEventListener("focus", onFocus);
 clearInterval(id);
 };
 }, [userId]);

 return { byBooking, refreshUnreadMap: fetchMap };
}
