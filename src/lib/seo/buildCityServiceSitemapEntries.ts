import type { MetadataRoute } from "next";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmins";
import {
  recordServiceKeys,
  resolveCitySlug,
  resolveServiceSlug,
  SEO_LANDING_SERVICE_SLUGS,
} from "./cityServiceSlugs";

const SITE_URL = "https://beautyreviewty.com";
const MAX_DOCS_PER_COLLECTION = 500;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isProfilePublic(profile: Record<string, unknown>): boolean {
  const isPublicProfile =
    profile.isPublicProfile ?? profile.isVisibleAsMaster ?? true;
  return isPublicProfile !== false;
}

function readCitySlugFromRecord(record: Record<string, unknown>): string | null {
  const candidates = [
    record.cityKey,
    record.citySlug,
    (record.city as { slug?: string } | undefined)?.slug,
    record.cityName,
    (record.city as { name?: string } | undefined)?.name,
    (record.city as { formatted?: string } | undefined)?.formatted,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    const resolved = resolveCitySlug(slugify(candidate.trim()));
    if (resolved) return resolved.citySlug;
  }

  return null;
}

function serviceKeyToLandingSlug(serviceKey: string): string | null {
  const normalizedKey = serviceKey.trim().toLowerCase();
  if (!normalizedKey) return null;

  for (const landingSlug of SEO_LANDING_SERVICE_SLUGS) {
    const resolved = resolveServiceSlug(landingSlug);
    if (resolved?.serviceKeys.includes(normalizedKey)) {
      return resolved.serviceSlug;
    }
  }

  const direct = resolveServiceSlug(normalizedKey);
  return direct?.serviceSlug ?? null;
}

function collectPairsFromRecord(
  record: Record<string, unknown>,
  pairs: Set<string>
): void {
  const citySlug = readCitySlugFromRecord(record);
  if (!citySlug) return;

  const serviceKeys = recordServiceKeys(record);
  for (const serviceKey of serviceKeys) {
    const serviceSlug = serviceKeyToLandingSlug(serviceKey);
    if (!serviceSlug) continue;
    if (!resolveCitySlug(citySlug) || !resolveServiceSlug(serviceSlug)) continue;
    pairs.add(`${citySlug}/${serviceSlug}`);
  }
}

async function loadActiveMasterRecords(db: Firestore): Promise<Record<string, unknown>[]> {
  const docMap = new Map<string, QueryDocumentSnapshot>();

  const queries = [
    db.collection("masters").where("role", "==", "master").limit(MAX_DOCS_PER_COLLECTION).get(),
    db.collection("masters").where("isMaster", "==", true).limit(MAX_DOCS_PER_COLLECTION).get(),
  ];

  for (const queryPromise of queries) {
    try {
      const snap = await queryPromise;
      for (const docSnap of snap.docs) {
        docMap.set(docSnap.id, docSnap);
      }
    } catch (error) {
      console.warn("[sitemap] Master query failed:", error);
    }
  }

  if (docMap.size === 0) {
    try {
      const snap = await db.collection("masters").limit(MAX_DOCS_PER_COLLECTION).get();
      for (const docSnap of snap.docs) {
        docMap.set(docSnap.id, docSnap);
      }
    } catch (error) {
      console.warn("[sitemap] Master fallback query failed:", error);
    }
  }

  const records: Record<string, unknown>[] = [];

  for (const docSnap of docMap.values()) {
    const data = docSnap.data() as Record<string, unknown>;
    if (data.deleted === true) continue;

    const uid = String(
      data.uid || data.userId || data.ownerId || data.userUID || docSnap.id
    );

    try {
      const profileSnap = await db.collection("profiles").doc(uid).get();
      if (!profileSnap.exists) continue;

      const profile = profileSnap.data() as Record<string, unknown>;
      if (profile.deleted === true) continue;
      if (!isProfilePublic(profile)) continue;

      records.push({
        id: docSnap.id,
        ...data,
        city: profile.city ?? data.city,
        cityName: profile.cityName ?? data.cityName,
        cityKey: profile.cityKey ?? data.cityKey,
        citySlug: profile.citySlug ?? data.citySlug,
        serviceKeys: profile.serviceKeys ?? data.serviceKeys,
        services: profile.services ?? data.services,
        serviceNames: profile.serviceNames ?? data.serviceNames,
      });
    } catch (error) {
      console.warn("[sitemap] Failed to load profile for master:", uid, error);
    }
  }

  return records;
}

async function loadActiveListingRecords(db: Firestore): Promise<Record<string, unknown>[]> {
  try {
    const snap = await db.collection("listings").limit(MAX_DOCS_PER_COLLECTION).get();
    return snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Record<string, unknown>)
      .filter((record) => record.deleted !== true);
  } catch (error) {
    console.warn("[sitemap] Listing query failed:", error);
    return [];
  }
}

export async function buildCityServiceSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const pairKeys = new Set<string>();

  try {
    const db = getAdminDb();
    const [masters, listings] = await Promise.all([
      loadActiveMasterRecords(db),
      loadActiveListingRecords(db),
    ]);

    for (const record of masters) {
      collectPairsFromRecord(record, pairKeys);
    }
    for (const record of listings) {
      collectPairsFromRecord(record, pairKeys);
    }
  } catch (error) {
    console.warn("[sitemap] Failed to build city/service URLs:", error);
    return [];
  }

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const pairKey of pairKeys) {
    const [citySlug, serviceSlug] = pairKey.split("/");
    if (!citySlug || !serviceSlug) continue;

    entries.push({
      url: `${SITE_URL}/${citySlug}/${serviceSlug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  entries.sort((a, b) => a.url.localeCompare(b.url));
  return entries;
}
