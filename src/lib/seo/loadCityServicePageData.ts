import { cache } from "react";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmins";
import { serializeFirestoreDoc } from "@/lib/firestore/serializeForClient";
import {
  masterMatchesCity,
  recordMatchesService,
  resolveCitySlug,
  resolveServiceSlug,
  SEO_LANDING_SERVICE_SLUGS,
  type ResolvedCity,
  type ResolvedService,
} from "./cityServiceSlugs";

export type CityServiceMaster = Record<string, unknown> & {
  id: string;
  uid?: string;
};

export type CityServiceListing = Record<string, unknown> & { id: string };

export type RelatedServiceLink = {
  href: string;
  label: string;
};

export type CityServicePageData =
  | {
      valid: false;
    }
  | {
      valid: true;
      city: ResolvedCity;
      service: ResolvedService;
      masters: CityServiceMaster[];
      listings: CityServiceListing[];
      relatedServices: RelatedServiceLink[];
    };

function isProfilePublic(profile: Record<string, unknown>): boolean {
  const isPublicProfile =
    profile.isPublicProfile ?? profile.isVisibleAsMaster ?? true;
  return isPublicProfile !== false;
}

function mergeMasterWithProfile(
  item: CityServiceMaster,
  profile: Record<string, unknown>
): CityServiceMaster {
  const profileAvatar = profile.avatarUrl ?? null;
  return {
    ...item,
    displayName: profile.displayName || profile.name || item.displayName,
    avatarUrl: profileAvatar,
    photoURL: profileAvatar,
    city: profile.city ?? item.city,
    cityName: profile.cityName ?? item.cityName,
    cityKey: profile.cityKey ?? item.cityKey,
    citySlug: profile.citySlug ?? item.citySlug,
    services:
      Array.isArray(profile.services) && profile.services.length
        ? profile.services
        : item.services,
    serviceKeys:
      Array.isArray(profile.serviceKeys) && profile.serviceKeys.length
        ? profile.serviceKeys
        : item.serviceKeys,
    serviceNames:
      Array.isArray(profile.serviceNames) && profile.serviceNames.length
        ? profile.serviceNames
        : item.serviceNames,
    uid:
      (profile.uid as string | undefined) ||
      (item.uid as string | undefined) ||
      item.id,
  };
}

async function enrichMasterDoc(
  db: Firestore,
  docSnap: QueryDocumentSnapshot
): Promise<CityServiceMaster | null> {
  const data = docSnap.data() as Record<string, unknown>;
  if (data.deleted === true) return null;

  const uid = String(
    data.uid || data.userId || data.ownerId || data.userUID || docSnap.id
  );

  const profileSnap = await db.collection("profiles").doc(uid).get();
  if (!profileSnap.exists) return null;

  const profile = profileSnap.data() as Record<string, unknown>;
  if (profile.deleted === true) return null;
  if (!isProfilePublic(profile)) return null;

  return mergeMasterWithProfile(
    serializeFirestoreDoc({ id: docSnap.id, ...data }) as CityServiceMaster,
    profile
  );
}

async function loadMasterDocs(
  db: Firestore,
  docSnaps: QueryDocumentSnapshot[]
): Promise<CityServiceMaster[]> {
  const masters: CityServiceMaster[] = [];
  const seen = new Set<string>();

  for (const docSnap of docSnaps) {
    try {
      const master = await enrichMasterDoc(db, docSnap);
      if (!master) continue;
      const publicId = String(master.uid || master.id);
      if (seen.has(publicId)) continue;
      seen.add(publicId);
      masters.push(master);
    } catch (error) {
      console.warn("[city-service] Failed to enrich master:", error);
    }
  }

  return masters;
}

async function queryMasterDocsByService(
  db: Firestore,
  serviceKeys: string[]
): Promise<QueryDocumentSnapshot[]> {
  const docMap = new Map<string, QueryDocumentSnapshot>();
  if (serviceKeys.length === 0) return [];

  try {
    if (serviceKeys.length === 1) {
      const snap = await db
        .collection("masters")
        .where("serviceKeys", "array-contains", serviceKeys[0])
        .limit(80)
        .get();
      for (const docSnap of snap.docs) docMap.set(docSnap.id, docSnap);
    } else {
      const snap = await db
        .collection("masters")
        .where("serviceKeys", "array-contains-any", serviceKeys.slice(0, 10))
        .limit(80)
        .get();
      for (const docSnap of snap.docs) docMap.set(docSnap.id, docSnap);
    }
  } catch (error) {
    console.warn("[city-service] Master service query failed:", error);
  }

  return [...docMap.values()];
}

async function queryListingDocsByService(
  db: Firestore,
  serviceKeys: string[]
): Promise<QueryDocumentSnapshot[]> {
  const docMap = new Map<string, QueryDocumentSnapshot>();
  if (serviceKeys.length === 0) return [];

  try {
    if (serviceKeys.length === 1) {
      const snap = await db
        .collection("listings")
        .where("serviceKeys", "array-contains", serviceKeys[0])
        .limit(80)
        .get();
      for (const docSnap of snap.docs) docMap.set(docSnap.id, docSnap);
    } else {
      const snap = await db
        .collection("listings")
        .where("serviceKeys", "array-contains-any", serviceKeys.slice(0, 10))
        .limit(80)
        .get();
      for (const docSnap of snap.docs) docMap.set(docSnap.id, docSnap);
    }
  } catch (error) {
    console.warn("[city-service] Listing service query failed:", error);
  }

  return [...docMap.values()];
}

function filterListings(
  docs: QueryDocumentSnapshot[],
  city: ResolvedCity,
  service: ResolvedService
): CityServiceListing[] {
  const listings: CityServiceListing[] = [];
  const seen = new Set<string>();

  for (const docSnap of docs) {
    const data = serializeFirestoreDoc({
      id: docSnap.id,
      ...docSnap.data(),
    }) as CityServiceListing;

    if (data.deleted === true) continue;
    if (!masterMatchesCity(data, city)) continue;
    if (!recordMatchesService(data, service)) continue;
    if (seen.has(data.id)) continue;

    seen.add(data.id);
    listings.push(data);
  }

  return listings;
}

function buildRelatedServiceLinks(
  city: ResolvedCity,
  currentServiceSlug: string
): RelatedServiceLink[] {
  const links: RelatedServiceLink[] = [];

  for (const slug of SEO_LANDING_SERVICE_SLUGS) {
    if (slug === currentServiceSlug) continue;
    const resolved = resolveServiceSlug(slug);
    if (!resolved) continue;
    links.push({
      href: `/${city.citySlug}/${resolved.serviceSlug}`,
      label: `${resolved.serviceName} in ${city.cityName}`,
    });
    if (links.length >= 6) break;
  }

  return links;
}

export const loadCityServicePageData = cache(
  async (citySlug: string, serviceSlug: string): Promise<CityServicePageData> => {
    const city = resolveCitySlug(citySlug);
    const service = resolveServiceSlug(serviceSlug);

    if (!city || !service) {
      return { valid: false };
    }

    try {
      const db = getAdminDb();
      const [masterDocs, listingDocs] = await Promise.all([
        queryMasterDocsByService(db, service.serviceKeys),
        queryListingDocsByService(db, service.serviceKeys),
      ]);

      const mastersLoaded = await loadMasterDocs(db, masterDocs);
      const masters = mastersLoaded
        .filter(
          (master) =>
            masterMatchesCity(master, city) && recordMatchesService(master, service)
        )
        .slice(0, 24);

      const listings = filterListings(listingDocs, city, service).slice(0, 24);

      return {
        valid: true,
        city,
        service,
        masters,
        listings,
        relatedServices: buildRelatedServiceLinks(city, service.serviceSlug),
      };
    } catch (error) {
      console.warn("[city-service] Failed to load page data:", error);
      return {
        valid: true,
        city,
        service,
        masters: [],
        listings: [],
        relatedServices: buildRelatedServiceLinks(city, service.serviceSlug),
      };
    }
  }
);
