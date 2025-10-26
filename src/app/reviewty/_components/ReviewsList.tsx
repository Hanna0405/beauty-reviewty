"use client";

import React, { useMemo } from "react";
import { useReviews } from "@/features/reviewty/hooks/useReviews";
import { buildThreadedFeed } from "@/app/reviewty/_utils/threading";

type ReviewItem = {
  id: string;
  isPublic?: boolean;
  publicCardId?: string;
  masterDisplay?: string;
  masterName?: string;
  cityKey?: string;
  rating?: number | string;
  text?: string;
  [key: string]: any;
};

export default function ReviewsList({ cityKey }: { cityKey?: string | null }) {
  const { reviews } = useReviews({ cityKey });

  // items = your current merged list (attached + public) AFTER filters/pagination
  const feed = useMemo(() => {
    const threaded = buildThreadedFeed(reviews);
    // Quick debug log (temporary)
    console.debug(
      "THREAD_DEBUG",
      (reviews as ReviewItem[]).map((x) => ({
        id: x.id,
        isPublic: x.isPublic,
        publicCardId: x.publicCardId,
        masterName: x.masterName,
        cityKey: x.cityKey,
      }))
    );
    return threaded;
  }, [reviews]);

  if (!feed.length) {
    return <div className="text-sm text-gray-500">No reviews yet.</div>;
  }

  return (
    <ul className="space-y-4">
      {feed.map((node, idx) => {
        if (node.type === "flat") {
          const r = node.item as ReviewItem;
          return (
            <li key={`flat-${r.id}`} className="rounded-lg border p-4">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                {r.isPublic ? "PUBLIC CARD" : "REVIEW"}
              </div>
              <div className="font-medium">
                {r.masterDisplay || r.masterName || "Master"}
              </div>
              <div className="text-xs">Rating: {r.rating}★</div>
              {r.text ? <p className="mt-2 text-sm">{r.text}</p> : null}
              {/* keep your existing photos gallery component; here just a stub */}
            </li>
          );
        }

        // public thread
        const { head, replies } = node;
        const headItem = head as ReviewItem;
        return (
          <li
            key={`thread-${head.id}-${idx}`}
            className="rounded-lg border overflow-hidden"
          >
            {/* Head */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                PUBLIC CARD
              </div>
              <div className="font-medium">
                {headItem.masterName || "Master"}
              </div>
              <div className="text-xs">Rating: {headItem.rating}★</div>
              {headItem.text ? (
                <p className="mt-2 text-sm">{headItem.text}</p>
              ) : null}
            </div>

            {/* Replies */}
            {replies.length > 0 ? (
              <ul className="divide-y">
                {replies.map((r) => {
                  const replyItem = r as ReviewItem;
                  return (
                    <li key={replyItem.id} className="p-4">
                      <div className="text-xs text-gray-500 mb-1">Review</div>
                      <div className="text-xs">Rating: {replyItem.rating}★</div>
                      {replyItem.text ? (
                        <p className="mt-1 text-sm">{replyItem.text}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
