"use client";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
  getDoc,
  doc,
  getCountFromServer,
  or,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { matchesAllFilters } from "@/lib/filtering";

import type { TagOption } from "@/types/tags";

// Helper functions for normalizing different document storage formats
function extractKeys(it: any, base: "service" | "language"): string[] {
  // Try <base>Keys first (array of strings)
  const keysField = `${base}Keys`;
  const arrK =
    it && Array.isArray(it[keysField]) ? (it[keysField] as string[]) : null;
  if (arrK) return arrK.filter(Boolean);

  // Try plural field: services / languages
  const plural = base === "service" ? "services" : "languages";
  const arr = it && Array.isArray(it[plural]) ? it[plural] : null;
  if (!arr) return [];

  // If array of strings
  if (arr.length && typeof arr[0] === "string") {
    return (arr as string[]).filter(Boolean);
  }
  // If array of objects with {key}
  if (arr.length && typeof arr[0] === "object" && arr[0] && "key" in arr[0]) {
    return (arr as Array<{ key?: string }>)
      .map((x) => x?.key)
      .filter(Boolean) as string[];
  }
  return [];
}

// Post-filter helper: ensure item includes ALL selected keys
function includesAll(haystack: string[], needles: string[]) {
  if (!needles?.length) return true;
  if (!Array.isArray(haystack)) return false;
  return needles.every((k) => haystack.includes(k));
}

function readTimestampMs(data: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const v = data[key];
    if (v == null) continue;
    if (
      typeof v === "object" &&
      v !== null &&
      "toMillis" in v &&
      typeof (v as { toMillis: () => number }).toMillis === "function"
    ) {
      return (v as { toMillis: () => number }).toMillis();
    }
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}

function sortListingsByRecency(items: any[]): any[] {
  return [...items].sort((a, b) => {
    const aMs = Math.max(
      readTimestampMs(a, ["createdAt", "created_at"]),
      readTimestampMs(a, ["updatedAt", "updated_at"])
    );
    const bMs = Math.max(
      readTimestampMs(b, ["createdAt", "created_at"]),
      readTimestampMs(b, ["updatedAt", "updated_at"])
    );
    return bMs - aMs;
  });
}

/** Prefer live profile fields over stale denormalized master doc data. */
function mergeMasterWithProfile(item: any, profile: any) {
  // Same field as dashboard profile — never fall back to legacy photoURL on masters/listings
  const profileAvatar = profile?.avatarUrl ?? null;
  return {
    ...item,
    displayName: profile?.displayName || profile?.name || item.displayName,
    avatarUrl: profileAvatar,
    photoURL: profileAvatar,
    city: profile?.city ?? item.city,
    cityName: profile?.cityName ?? item.cityName,
    services:
      Array.isArray(profile?.services) && profile.services.length
        ? profile.services
        : item.services,
    serviceKeys: profile?.serviceKeys?.length
      ? profile.serviceKeys
      : item.serviceKeys,
    serviceNames: profile?.serviceNames?.length
      ? profile.serviceNames
      : item.serviceNames,
    languages:
      Array.isArray(profile?.languages) && profile.languages.length
        ? profile.languages
        : item.languages,
    languageKeys: profile?.languageKeys?.length
      ? profile.languageKeys
      : item.languageKeys,
    languageNames: profile?.languageNames?.length
      ? profile.languageNames
      : item.languageNames,
  };
}

function isProfilePublic(profile: any): boolean {
  const isPublicProfile =
    profile?.isPublicProfile ?? profile?.isVisibleAsMaster ?? true;
  return isPublicProfile !== false;
}

export type MasterFilters = {
  city?: string;
  cityKey?: string;
  cityPlaceId?: string;
  services?: Array<{ key: string; name: string; emoji?: string }>;
  languages?: Array<{ key: string; name: string; emoji?: string }>;
  minRating?: number;
  name?: string; // client-side contains
};

export async function fetchMastersOnce(
  filters: MasterFilters,
  pageSize = 60,
  cursor?: DocumentData
) {
  const colRef = collection(db, "masters");

  // Build base constraints (without role filtering)
  const buildConstraints = (): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];

    // Optional city filter - ONLY apply if explicitly provided (do not default to any city)
    if ((filters as any).cityPlaceId && (filters as any).cityPlaceId.trim()) {
      constraints.push(
        where("city.placeId", "==", (filters as any).cityPlaceId)
      );
    } else if (filters.city && filters.city.trim()) {
      constraints.push(where("city.name", "==", filters.city.trim()));
    }

    // Optional rating filter
    if (typeof filters.minRating === "number" && filters.minRating > 0) {
      constraints.push(
        where("rating", ">=", Math.max(0, Math.min(5, filters.minRating)))
      );
    }

    // Normalize filter inputs - extract keys from UI objects
    const selectedServiceKeys = (filters.services ?? [])
      .map((s) => s.key)
      .filter(Boolean);
    const selectedLanguageKeys = (filters.languages ?? [])
      .map((l) => l.key)
      .filter(Boolean);

    // Use only ONE array filter in Firestore (prefer services if both are selected)
    // The second filter will be applied client-side
    if (selectedServiceKeys.length > 0) {
      // Services filter: use array-contains for single, array-contains-any for multiple
      if (selectedServiceKeys.length === 1) {
        constraints.push(
          where("serviceKeys", "array-contains", selectedServiceKeys[0])
        );
      } else {
        constraints.push(
          where(
            "serviceKeys",
            "array-contains-any",
            selectedServiceKeys.slice(0, 10)
          )
        );
      }
    } else if (selectedLanguageKeys.length > 0) {
      // Languages filter: only use if services are NOT selected
      if (selectedLanguageKeys.length === 1) {
        constraints.push(
          where("languageKeys", "array-contains", selectedLanguageKeys[0])
        );
      } else {
        constraints.push(
          where(
            "languageKeys",
            "array-contains-any",
            selectedLanguageKeys.slice(0, 10)
          )
        );
      }
    }

    // Always add orderBy for consistent sorting (Firestore includes documents without the field, just at end)
    // Required for pagination with cursor
    constraints.push(orderBy("displayName"));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(pageSize));

    return constraints;
  };

  // Try to run two separate queries for role filtering (since Firestore doesn't support OR)
  const constraints = buildConstraints();

  // Query 1: role === 'master'
  const cons1 = [...constraints, where("role", "==", "master")];
  const snap1 = await getDocs(query(colRef, ...cons1));

  // Query 2: isMaster === true
  const cons2 = [...constraints, where("isMaster", "==", true)];
  const snap2 = await getDocs(query(colRef, ...cons2));

  // Merge results and remove duplicates by id
  const allDocs = [...snap1.docs, ...snap2.docs];
  const uniqueDocs = new Map();
  allDocs.forEach((doc) => {
    uniqueDocs.set(doc.id, doc);
  });

  let items: any[] = Array.from(uniqueDocs.values())
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // Ensure serviceKeys and languageKeys are always present as arrays
        serviceKeys: extractKeys(data, "service"),
        languageKeys: extractKeys(data, "language"),
        // Explicitly include deleted field for TypeScript
        deleted: data.deleted ?? false,
        // Ensure displayName exists for sorting (fallback to empty string so all masters are included)
        displayName: data.displayName || data.name || "",
      };
    })
    // Filter out deleted masters
    .filter((item) => !item.deleted);

  // Normalize selected keys for post-filtering
  const selectedServiceKeys = (filters.services ?? [])
    .map((s) => s.key)
    .filter(Boolean);
  const selectedLanguageKeys = (filters.languages ?? [])
    .map((l) => l.key)
    .filter(Boolean);

  // Post-filter: ensure items include ALL selected services and languages
  // This enforces "must include ALL" for multi-select cases
  items = items.filter((item) => {
    return (
      includesAll(item.serviceKeys, selectedServiceKeys) &&
      includesAll(item.languageKeys, selectedLanguageKeys)
    );
  });

  // Apply client-side filters (name search, etc.)
  items = items.filter((it) => {
    return matchesAllFilters(
      it,
      {
        ...filters,
        services: selectedServiceKeys,
        languages: selectedLanguageKeys,
      },
      /*isMaster*/ true
    );
  });

  // Visibility + merge latest profile fields (avatar, name, city, tags)
  const visibilityFiltered: any[] = [];
  for (const item of items) {
    const masterUid =
      item.uid || item.userId || item.ownerId || item.userUID || item.id;
    if (!masterUid) {
      visibilityFiltered.push(item);
      continue;
    }
    try {
      const profileSnap = await getDoc(doc(db, "profiles", masterUid));
      if (!profileSnap.exists()) {
        continue;
      }
      const profile = profileSnap.data() as any;
      if (!isProfilePublic(profile)) continue;
      visibilityFiltered.push(mergeMasterWithProfile(item, profile));
    } catch (error) {
      console.warn(
        "[fetchMastersOnce] Error loading profile for master:",
        masterUid,
        error
      );
      visibilityFiltered.push(item);
    }
  }

  return {
    items: visibilityFiltered,
    nextCursor: allDocs.length ? allDocs[allDocs.length - 1] : undefined,
  };
}

export type ListingFilters = {
  city?: string;
  cityKey?: string;
  cityPlaceId?: string;
  services?: Array<{ key: string; name: string; emoji?: string }>;
  languages?: Array<{ key: string; name: string; emoji?: string }>;
  minRating?: number;
};

export async function fetchMastersTotalCount(): Promise<number> {
  const colRef = collection(db, "masters");
  try {
    const snap = await getCountFromServer(
      query(colRef, or(where("role", "==", "master"), where("isMaster", "==", true)))
    );
    return snap.data().count;
  } catch (error) {
    console.warn("[fetchMastersTotalCount] Failed to fetch masters total count:", error);
    throw error;
  }
}

export async function fetchListingsTotalCount(): Promise<number> {
  const colRef = collection(db, "listings");
  try {
    const snap = await getCountFromServer(query(colRef));
    return snap.data().count;
  } catch (error) {
    console.warn("[fetchListingsTotalCount] Failed to fetch listings total count:", error);
    throw error;
  }
}

export async function fetchListingsOnce(
  filters: ListingFilters,
  pageSize = 60,
  cursor?: DocumentData
) {
  const colRef = collection(db, "listings");
  const cons: QueryConstraint[] = [];

  if ((filters as any).cityPlaceId)
    cons.push(where("city.placeId", "==", (filters as any).cityPlaceId));
  else if (filters.city) cons.push(where("city.name", "==", filters.city));
  if (typeof filters.minRating === "number")
    cons.push(
      where("rating", ">=", Math.max(0, Math.min(5, filters.minRating)))
    );

  // Normalize filter inputs - extract keys from UI objects
  const selectedServiceKeys = (filters.services ?? [])
    .map((s) => s.key)
    .filter(Boolean);
  const selectedLanguageKeys = (filters.languages ?? [])
    .map((l) => l.key)
    .filter(Boolean);

  // Use only ONE array filter in Firestore (prefer services if both are selected)
  // The second filter will be applied client-side
  if (selectedServiceKeys.length > 0) {
    // Services filter: use array-contains for single, array-contains-any for multiple
    if (selectedServiceKeys.length === 1) {
      cons.push(where("serviceKeys", "array-contains", selectedServiceKeys[0]));
    } else {
      cons.push(
        where(
          "serviceKeys",
          "array-contains-any",
          selectedServiceKeys.slice(0, 10)
        )
      );
    }
  } else if (selectedLanguageKeys.length > 0) {
    // Languages filter: only use if services are NOT selected
    if (selectedLanguageKeys.length === 1) {
      cons.push(
        where("languageKeys", "array-contains", selectedLanguageKeys[0])
      );
    } else {
      cons.push(
        where(
          "languageKeys",
          "array-contains-any",
          selectedLanguageKeys.slice(0, 10)
        )
      );
    }
  }

  const buildQueryConstraints = (orderField?: "createdAt" | "updatedAt") => {
    const qCons: QueryConstraint[] = [...cons];
    if (orderField) qCons.push(orderBy(orderField, "desc"));
    if (cursor && orderField) qCons.push(startAfter(cursor));
    qCons.push(limit(pageSize));
    return qCons;
  };

  // Unordered first page: Firestore orderBy(createdAt) omits docs without that field,
  // which makes the total count (all docs) disagree with rendered cards.
  let snap;
  if (!cursor) {
    snap = await getDocs(query(colRef, ...buildQueryConstraints()));
  } else {
    try {
      snap = await getDocs(query(colRef, ...buildQueryConstraints("createdAt")));
    } catch (primaryErr) {
      console.warn(
        "[fetchListingsOnce] createdAt query failed; trying updatedAt:",
        primaryErr
      );
      try {
        snap = await getDocs(query(colRef, ...buildQueryConstraints("updatedAt")));
      } catch (secondaryErr) {
        console.warn(
          "[fetchListingsOnce] updatedAt query failed; using unordered fetch:",
          secondaryErr
        );
        snap = await getDocs(query(colRef, ...buildQueryConstraints()));
      }
    }
  }

  const fetchedCount = snap.docs.length;
  let items: any[] = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // Ensure serviceKeys and languageKeys are always present as arrays
        serviceKeys: extractKeys(data, "service"),
        languageKeys: extractKeys(data, "language"),
        // Explicitly include deleted field for TypeScript
        deleted: data.deleted ?? false,
      };
    })
    // Filter out deleted listings
    .filter((item) => !item.deleted);
  const deletedSkippedCount = fetchedCount - items.length;

  // Post-filter: ensure items include ALL selected services and languages
  // This enforces "must include ALL" for multi-select cases
  items = items.filter((item) => {
    return (
      includesAll(item.serviceKeys, selectedServiceKeys) &&
      includesAll(item.languageKeys, selectedLanguageKeys)
    );
  });

  // STRICT post-filter
  items = items.filter((it) =>
    matchesAllFilters(it, filters as any, /*isMaster*/ false)
  );
  items = sortListingsByRecency(items);

  // Prefer live owner profile over stale denormalized listing fields
  const ownerIds = [
    ...new Set(
      items
        .map(
          (l) =>
            l.ownerId ||
            l.ownerUid ||
            l.masterUid ||
            l.masterId ||
            l.userId ||
            l.uid
        )
        .filter(Boolean)
    ),
  ] as string[];
  if (ownerIds.length > 0) {
    const profileByUid = new Map<string, any>();
    await Promise.all(
      ownerIds.map(async (uid) => {
        try {
          const profileSnap = await getDoc(doc(db, "profiles", uid));
          if (profileSnap.exists()) {
            profileByUid.set(uid, profileSnap.data());
          }
        } catch (err) {
          console.warn("[fetchListingsOnce] Failed to load owner profile:", uid, err);
        }
      })
    );
    items = items.map((listing) => {
      const ownerUid =
        listing.ownerId ||
        listing.ownerUid ||
        listing.masterUid ||
        listing.masterId ||
        listing.userId ||
        listing.uid;
      const profile = ownerUid ? profileByUid.get(ownerUid) : null;
      if (!profile) return listing;
      const profileAvatar = profile.avatarUrl ?? null;
      return {
        ...listing,
        masterName: profile.displayName || profile.name || listing.masterName,
        masterDisplayName:
          profile.displayName || profile.name || listing.masterDisplayName,
        masterAvatarUrl: profileAvatar,
        masterPhotoURL: profileAvatar,
      };
    });
  }

  const postFilterSkippedCount = fetchedCount - deletedSkippedCount - items.length;

  if (deletedSkippedCount > 0 || postFilterSkippedCount > 0) {
    console.warn(
      "[fetchListingsOnce] Some listing docs skipped during pagination page",
      {
        deletedSkippedCount,
        postFilterSkippedCount,
        fetchedCount,
        keptCount: items.length,
      }
    );
  }

  return {
    items,
    nextCursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : undefined,
    fetchedCount,
  };
}
