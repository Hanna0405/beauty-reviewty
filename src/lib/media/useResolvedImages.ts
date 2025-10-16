"use client";
import { useEffect, useState } from "react";
import { resolvePublicUrl } from "./resolvePublicUrl";

// Accepts various image fields from a review/listing and resolves to https URLs
export function useResolvedImages(source: any, limit?: number) {
  const [urls, setUrls] = useState<string[]>([]);
  
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pool: any[] = [];
      if (!source) { setUrls([]); return; }

      // Prefer already processed field
      if (Array.isArray(source._images)) pool.push(...source._images);

      // Common fields for reviews
      if (Array.isArray(source.imageUrls)) pool.push(...source.imageUrls);
      if (Array.isArray(source.photos)) pool.push(...source.photos);
      if (Array.isArray(source.images)) pool.push(...source.images);
      if (Array.isArray(source.gallery)) pool.push(...source.gallery);

      // Single-field fallbacks
      if (source.imageUrl) pool.push(source.imageUrl);
      if (source.photoUrl) pool.push(source.photoUrl);
      if (source.coverUrl) pool.push(source.coverUrl);
      if (source.image?.url) pool.push(source.image?.url);
      if (source.photo?.url) pool.push(source.photo?.url);

      const flat = pool.flat().filter(Boolean);
      const resolved = await Promise.all(flat.map(resolvePublicUrl));
      const unique = Array.from(new Set((resolved.filter(Boolean) as string[])));
      if (!cancelled) {
        setUrls(typeof limit === "number" ? unique.slice(0, limit) : unique);
      }
    })();
    return () => { cancelled = true; };
  }, [JSON.stringify(source), limit]); // stringify is fine for small objects

  return urls;
}
