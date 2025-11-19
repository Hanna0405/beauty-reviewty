"use client";
import { useEffect, useState } from "react";

// Notification model: uses notifications collection (not flags on documents)
// add at the top (once)
const POLL_MS = Number(process.env.NEXT_PUBLIC_NOTIFS_POLL_MS ?? "0") || 0;

export function useNotificationsBadge(
  userId?: string,
  role?: "master" | "client"
) {
  const [count, setCount] = useState(0);
  const fetchCount = async () => {
    if (!userId) return;
    try {
      const r = await fetch("/api/notifications/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const d = await r.json();
      if (d?.ok) setCount(Number(d.total || 0));
    } catch {}
  };
  useEffect(() => {
    fetchCount(); // сразу при монтировании
    const onFocus = () => fetchCount();
    const onVis = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    const onPing = () => fetchCount(); // внутреннее событие
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("notify:refresh", onPing as any);

    if (POLL_MS > 0) {
      const id = setInterval(fetchCount, POLL_MS);
      return () => {
        clearInterval(id);
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("notify:refresh", onPing as any);
      };
    } else {
      // in dev with 0 -> do a one-time fetch or skip entirely:
      // optional one-time:
      // fetchCount();
      return () => {
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("notify:refresh", onPing as any);
      };
    }
  }, [userId, role]);
  return { count, refresh: fetchCount };
}
