"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
} from "firebase/firestore";

export default function PublicCardReviewStats({
  publicCardSlug,
}: {
  publicCardSlug: string;
}) {
  const [count, setCount] = useState(0);
  const [avg, setAvg] = useState(0);

  useEffect(() => {
    if (!publicCardSlug) return;
    // берем до 500 последних — достаточно для UI, индексы не нужны
    const q = query(
      collection(db, "publicReviews"),
      where("publicCardSlug", "==", publicCardSlug),
      limit(500)
    );
    const unsub = onSnapshot(q, (snap) => {
      let c = 0,
        s = 0;
      snap.forEach((d) => {
        const r = (d.data() as any).rating;
        const num = Number(r);
        if (!Number.isNaN(num)) {
          c += 1;
          s += num;
        }
      });
      setCount(c);
      setAvg(c ? s / c : 0);
    });
    return () => unsub();
  }, [publicCardSlug]);

  // simple stars
  const full = Math.round(avg || 0);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-rose-500 text-base">
        {"★".repeat(full)}
        {"☆".repeat(5 - full)}
      </span>
      <span className="font-medium">{avg.toFixed(1)}</span>
      <span className="text-gray-500">
        · {count} {count === 1 ? "review" : "reviews"}
      </span>
    </div>
  );
}
