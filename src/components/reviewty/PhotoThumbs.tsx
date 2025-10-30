"use client";
import React from "react";
import Image from "next/image";
import { normalizePhotos } from "./getPhotoUrl";

type Props = { photos?: any; max?: number; className?: string };

export default function PhotoThumbs({ photos, max = 3, className }: Props) {
  const urls = normalizePhotos(photos).slice(0, max);
  if (urls.length === 0) return null;

  return (
    <div className={className ?? "mt-3 flex gap-2"}>
      {urls.map((u, i) => (
        <div
          key={i}
          className="relative h-16 w-16 overflow-hidden rounded-md border"
        >
          {/* next/image keeps layout stable */}
          <Image src={u} alt={`photo-${i + 1}`} fill className="object-cover" />
        </div>
      ))}
    </div>
  );
}
