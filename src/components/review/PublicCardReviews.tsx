"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
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
  const [activeImageIndex, setActiveImageIndex] = useState<{ reviewIndex: number; photoIndex: number } | null>(null);

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
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex({ reviewIndex: i, photoIndex: idx })}
                      className="relative w-20 h-20 overflow-hidden rounded border bg-slate-100"
                      aria-label={`Open review photo ${idx + 1}`}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/* Image preview modal */}
      {activeImageIndex !== null && (() => {
        const reviewItem =
          items?.[activeImageIndex?.reviewIndex || 0]?.photos?.[activeImageIndex?.photoIndex || 0];
        return reviewItem ? (
          <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setActiveImageIndex(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-3xl aspect-[4/3]">
              <Image
                src={reviewItem}
                alt={`review photo ${activeImageIndex?.photoIndex != null ? activeImageIndex.photoIndex + 1 : ""}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
              {/* Controls */}
              {(() => {
                const photos = items?.[activeImageIndex?.reviewIndex || 0]?.photos;
                return photos && photos.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!photos || activeImageIndex === null) return;
                        const newIndex = activeImageIndex.photoIndex > 0 
                          ? activeImageIndex.photoIndex - 1 
                          : photos.length - 1;
                        setActiveImageIndex({ reviewIndex: activeImageIndex.reviewIndex, photoIndex: newIndex });
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/70 px-3 py-2 text-sm hover:bg-white/90"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!photos || activeImageIndex === null) return;
                        const newIndex = (activeImageIndex.photoIndex + 1) % photos.length;
                        setActiveImageIndex({ reviewIndex: activeImageIndex.reviewIndex, photoIndex: newIndex });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/70 px-3 py-2 text-sm hover:bg-white/90"
                    >
                      ›
                    </button>
                  </>
                ) : null;
              })()}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(null);
                }}
                className="absolute right-2 top-2 rounded bg-white/80 px-3 py-1 text-sm hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[4/3] bg-gray-200" />
        );
      })()}
    </div>
  );
}
