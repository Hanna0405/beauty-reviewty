"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";

type Props = { publicCardSlug: string };

type Review = {
  rating: number;
  text?: string;
  photos?: string[];
  authorName?: string;
  createdAt?: { toDate: () => Date } | null;
};

export default function PublicCardReviews({ publicCardSlug }: Props) {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicCardSlug) return;
    try {
      const q = query(
        collection(db, "publicReviews"),
        where("publicCardSlug", "==", publicCardSlug),
        limit(50)
      );
      const unsub = onSnapshot(q, (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        // client-side sort by createdAt desc (safe for missing createdAt)
        rows.sort((a, b) => {
          const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tb - ta;
        });
        setItems(rows);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error("reviews live query error", e);
      setLoading(false);
    }
  }, [publicCardSlug]);

  if (loading) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Client reviews</h3>
      {!items.length ? (
        <div className="text-sm text-gray-500">No reviews yet.</div>
      ) : (
        <ul className="space-y-5">
          {items.map((r, i) => (
            <li key={i} className="border rounded-md p-3">
              {/* stars */}
              <div className="text-rose-500 text-lg">
                {"★".repeat(
                  Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)))
                )}{" "}
                {"☆".repeat(Math.max(0, 5 - Math.round(Number(r.rating) || 0)))}
              </div>
              {/* name + date */}
              <div className="text-sm text-gray-500 mt-1">
                {r.authorName || "Verified client"}
                {r.createdAt ? (
                  <> · {r.createdAt.toDate().toLocaleDateString()}</>
                ) : null}
              </div>
              {/* text */}
              {r.text ? <p className="mt-2">{r.text}</p> : null}
              {/* photos */}
              {Array.isArray(r.photos) && r.photos.length ? (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {r.photos.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt=""
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
