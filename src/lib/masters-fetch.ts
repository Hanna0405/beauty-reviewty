"use client";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase.client";
import { shouldMasterBeVisibleInPublicSearch } from "@/lib/settings/masterVisibility";

export type MastersFilters = {
  city?: string;
  service?: string;
  languages?: string[]; // optional
  q?: string;
};

export async function fetchMastersSafe(filters: MastersFilters) {
  if (!db) {
    if (process.env.NODE_ENV !== "production")
      console.warn("Firestore is not initialized (missing env).");
    return []; // return empty list instead of calling Firestore
  }

  // Single predicate avoids composite indexes.
  const baseQ = query(
    collection(db, "masters"),
    where("isPublished", "==", true),
    limit(200)
  );
  const snap = await getDocs(baseQ);
  let list = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    // Filter out deleted masters
    .filter((item: any) => !item.deleted) as any[];

  // Client-side filters (no indexes required).
  if (filters.city) {
    const c = filters.city.toLowerCase();
    list = list.filter((m) => (m.city || "").toLowerCase() === c);
  }
  if (filters.service) {
    const s = filters.service.toLowerCase();
    list = list.filter(
      (m) =>
        Array.isArray(m.services) &&
        m.services.some(
          (v: any) =>
            (v?.category || "").toLowerCase() === s ||
            (v?.subservice || "").toLowerCase() === s
        )
    );
  }
  if (filters.languages?.length) {
    const want = new Set(filters.languages.map((x) => x.toLowerCase()));
    list = list.filter(
      (m) =>
        Array.isArray(m.languages) &&
        m.languages.some((lng: string) => want.has((lng || "").toLowerCase()))
    );
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (m) =>
        (m.displayName || "").toLowerCase().includes(q) ||
        (m.city || "").toLowerCase().includes(q)
    );
  }

  // Sort by updatedAt desc if present.
  list.sort((a, b) => {
    const ta = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
    const tb = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
    return tb - ta;
  });

  // Filter by master visibility: exclude masters with isPublicProfile === false
  const visibilityFiltered: any[] = [];
  for (const item of list) {
    const masterUid =
      item.uid || item.userId || item.ownerId || item.userUID || item.id;
    if (masterUid) {
      const isVisible = await shouldMasterBeVisibleInPublicSearch(masterUid);
      if (isVisible) {
        visibilityFiltered.push(item);
      }
    } else {
      // If no UID found, include it (backward compatible)
      visibilityFiltered.push(item);
    }
  }

  return visibilityFiltered;
}
