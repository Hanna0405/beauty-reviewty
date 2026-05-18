import { cache } from "react";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { findServiceLabel } from "@/constants/services";
import { getAdminDb } from "@/lib/firebaseAdmins";

const MAX_LINKS = 6;

export type RelatedMasterLink = {
  id: string;
  href: string;
  label: string;
};

export type RelatedMastersSections = {
  nearby: RelatedMasterLink[];
  similarServices: RelatedMasterLink[];
};

type MasterRecord = Record<string, unknown> & {
  id: string;
  uid?: string;
};

function isProfilePublic(profile: Record<string, unknown>): boolean {
  const isPublicProfile =
    profile.isPublicProfile ?? profile.isVisibleAsMaster ?? true;
  return isPublicProfile !== false;
}

function mergeMasterWithProfile(
  item: MasterRecord,
  profile: Record<string, unknown>
): MasterRecord {
  const profileAvatar = profile.avatarUrl ?? null;
  return {
    ...item,
    displayName: profile.displayName || profile.name || item.displayName,
    city: profile.city ?? item.city,
    cityName: profile.cityName ?? item.cityName,
    services:
      Array.isArray(profile.services) && profile.services.length
        ? profile.services
        : item.services,
    serviceKeys: Array.isArray(profile.serviceKeys) && profile.serviceKeys.length
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

function readCityLabel(
  profile?: Record<string, unknown> | null,
  listing?: Record<string, unknown> | null
): string {
  const cityValue = profile?.city ?? listing?.city;
  if (cityValue && typeof cityValue === "object") {
    const cityObj = cityValue as { formatted?: string; name?: string; cityName?: string };
    const formatted = cityObj.formatted || cityObj.name || cityObj.cityName;
    if (formatted && String(formatted).trim()) return String(formatted).trim();
  }
  if (typeof cityValue === "string" && cityValue.trim()) return cityValue.trim();

  const cityName = profile?.cityName ?? listing?.cityName;
  if (cityName && String(cityName).trim()) return String(cityName).trim();

  return "";
}

function readCityName(
  profile?: Record<string, unknown> | null,
  listing?: Record<string, unknown> | null
): string {
  const cityValue = profile?.city ?? listing?.city;
  if (cityValue && typeof cityValue === "object") {
    const name = (cityValue as { name?: string }).name;
    if (name && String(name).trim()) return String(name).trim();
  }
  if (typeof profile?.cityName === "string" && profile.cityName.trim()) {
    return profile.cityName.trim();
  }
  if (typeof listing?.cityName === "string" && listing.cityName.trim()) {
    return listing.cityName.trim();
  }
  return readCityLabel(profile, listing);
}

function readCityPlaceId(
  profile?: Record<string, unknown> | null,
  listing?: Record<string, unknown> | null
): string {
  const cityValue = profile?.city ?? listing?.city;
  if (cityValue && typeof cityValue === "object") {
    const placeId = (cityValue as { placeId?: string }).placeId;
    if (placeId && String(placeId).trim()) return String(placeId).trim();
  }
  return "";
}

function readServiceKeys(record: Record<string, unknown>): string[] {
  const keys: string[] = [];
  if (Array.isArray(record.serviceKeys)) {
    for (const key of record.serviceKeys) {
      if (key) keys.push(String(key));
    }
  }
  if (Array.isArray(record.services)) {
    for (const service of record.services) {
      if (typeof service === "string" && service.trim()) {
        keys.push(service.trim());
      } else if (service && typeof service === "object") {
        const obj = service as { key?: string; value?: string };
        if (obj.key) keys.push(String(obj.key));
        else if (obj.value) keys.push(String(obj.value));
      }
    }
  }
  return [...new Set(keys)];
}

function readServiceNames(record: Record<string, unknown>): string[] {
  const names: string[] = [];
  if (Array.isArray(record.serviceNames)) {
    for (const name of record.serviceNames) {
      if (name) names.push(String(name).trim());
    }
  }
  if (Array.isArray(record.services)) {
    for (const service of record.services) {
      if (typeof service === "string" && service.trim()) {
        names.push(service.trim());
      } else if (service && typeof service === "object") {
        const obj = service as { name?: string; label?: string };
        const label = obj.name || obj.label;
        if (label) names.push(String(label).trim());
      }
    }
  }
  const keys = readServiceKeys(record);
  for (const key of keys) {
    names.push(findServiceLabel(key));
  }
  return [...new Set(names.filter(Boolean))];
}

function primaryServiceLabel(master: MasterRecord): string {
  const names = readServiceNames(master);
  if (names.length > 0) return names[0];
  const keys = readServiceKeys(master);
  if (keys.length > 0) return findServiceLabel(keys[0]);
  return "Beauty";
}

function buildSeoLinkLabel(master: MasterRecord, cityLabel: string): string {
  const service = primaryServiceLabel(master);
  const serviceLower = service.toLowerCase();

  if (cityLabel) {
    if (serviceLower.includes("lash")) {
      return `Lash artist in ${cityLabel}`;
    }
    return `${service} master in ${cityLabel}`;
  }

  if (serviceLower.includes("lash")) return "Lash artist";
  return `${service} master`;
}

function collectExcludeIds(
  profile?: Record<string, unknown> | null,
  pageId?: string
): Set<string> {
  const ids = new Set<string>();
  if (pageId) ids.add(pageId);
  if (!profile) return ids;

  for (const key of ["id", "uid", "userId", "ownerId", "userUID"] as const) {
    const value = profile[key];
    if (value) ids.add(String(value));
  }
  return ids;
}

function masterPublicId(master: MasterRecord): string {
  return String(master.uid || master.id);
}

function sameCity(
  master: MasterRecord,
  cityLabel: string,
  cityName: string,
  cityPlaceId: string
): boolean {
  if (!cityLabel && !cityName && !cityPlaceId) return false;

  const masterCity = master.city;
  if (cityPlaceId && masterCity && typeof masterCity === "object") {
    if ((masterCity as { placeId?: string }).placeId === cityPlaceId) return true;
  }

  const masterCityName =
    (masterCity && typeof masterCity === "object"
      ? (masterCity as { name?: string }).name
      : undefined) || master.cityName;

  if (cityName && masterCityName && String(masterCityName) === cityName) {
    return true;
  }

  const masterLabel = readCityLabel(master, null);
  return Boolean(cityLabel && masterLabel && masterLabel === cityLabel);
}

function sharesService(
  master: MasterRecord,
  serviceKeys: string[],
  serviceNames: string[]
): boolean {
  if (serviceKeys.length === 0 && serviceNames.length === 0) return false;

  const masterKeys = readServiceKeys(master);
  const masterNames = readServiceNames(master).map((n) => n.toLowerCase());

  for (const key of serviceKeys) {
    if (masterKeys.includes(key)) return true;
  }

  for (const name of serviceNames) {
    const lower = name.toLowerCase();
    if (masterNames.some((n) => n === lower || n.includes(lower) || lower.includes(n))) {
      return true;
    }
  }

  return false;
}

async function enrichMasterDoc(
  db: Firestore,
  docSnap: QueryDocumentSnapshot
): Promise<MasterRecord | null> {
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
    { id: docSnap.id, ...data } as MasterRecord,
    profile
  );
}

async function loadMasterCandidates(
  db: Firestore,
  docSnaps: QueryDocumentSnapshot[]
): Promise<MasterRecord[]> {
  const masters: MasterRecord[] = [];
  const seen = new Set<string>();

  for (const docSnap of docSnaps) {
    try {
      const master = await enrichMasterDoc(db, docSnap);
      if (!master) continue;
      const publicId = masterPublicId(master);
      if (seen.has(publicId)) continue;
      seen.add(publicId);
      masters.push(master);
    } catch (error) {
      console.warn("[loadRelatedMasters] Failed to enrich master:", error);
    }
  }

  return masters;
}

async function queryMastersByCity(
  db: Firestore,
  cityName: string
): Promise<QueryDocumentSnapshot[]> {
  if (!cityName) return [];

  const docMap = new Map<string, QueryDocumentSnapshot>();

  const queries = [
    db.collection("masters").where("city.name", "==", cityName).limit(24).get(),
    db.collection("masters").where("cityName", "==", cityName).limit(24).get(),
  ];

  for (const queryPromise of queries) {
    try {
      const snap = await queryPromise;
      for (const docSnap of snap.docs) {
        docMap.set(docSnap.id, docSnap);
      }
    } catch (error) {
      console.warn("[loadRelatedMasters] City query failed:", error);
    }
  }

  return [...docMap.values()];
}

async function queryMastersByServiceKey(
  db: Firestore,
  serviceKey: string
): Promise<QueryDocumentSnapshot[]> {
  if (!serviceKey) return [];

  const docMap = new Map<string, QueryDocumentSnapshot>();

  try {
    const snap = await db
      .collection("masters")
      .where("serviceKeys", "array-contains", serviceKey)
      .limit(24)
      .get();
    for (const docSnap of snap.docs) {
      docMap.set(docSnap.id, docSnap);
    }
  } catch (error) {
    console.warn("[loadRelatedMasters] Service query failed:", error);
  }

  return [...docMap.values()];
}

function toLinks(
  masters: MasterRecord[],
  excludeIds: Set<string>,
  cityLabel: string,
  limit: number
): RelatedMasterLink[] {
  const links: RelatedMasterLink[] = [];

  for (const master of masters) {
    const publicId = masterPublicId(master);
    if (excludeIds.has(publicId) || excludeIds.has(master.id)) continue;

    links.push({
      id: publicId,
      href: `/master/${encodeURIComponent(publicId)}`,
      label: buildSeoLinkLabel(master, cityLabel),
    });

    excludeIds.add(publicId);
    if (links.length >= limit) break;
  }

  return links;
}

export const loadRelatedMasterLinks = cache(
  async (options: {
    profile?: Record<string, unknown> | null;
    listing?: Record<string, unknown> | null;
    pageId?: string;
  }): Promise<RelatedMastersSections> => {
    const empty = { nearby: [], similarServices: [] };

    try {
      const profile = options.profile ?? null;
      const listing = options.listing ?? null;
      if (!profile && !listing) return empty;

      const source = { ...(listing ?? {}), ...(profile ?? {}) } as Record<
        string,
        unknown
      >;
      const cityLabel = readCityLabel(profile, listing);
      const cityName = readCityName(profile, listing);
      const cityPlaceId = readCityPlaceId(profile, listing);
      const serviceKeys = readServiceKeys(source);
      const serviceNames = readServiceNames(source);
      const excludeIds = collectExcludeIds(profile, options.pageId);

      const db = getAdminDb();

      const cityDocs = await queryMastersByCity(db, cityName || cityLabel);
      const cityCandidates = await loadMasterCandidates(db, cityDocs);
      const nearbyMasters = cityCandidates.filter((master) =>
        sameCity(master, cityLabel, cityName, cityPlaceId)
      );

      const nearby = toLinks(nearbyMasters, new Set(excludeIds), cityLabel, MAX_LINKS);

      if (serviceKeys.length === 0 && serviceNames.length === 0) {
        return { nearby, similarServices: [] };
      }

      const serviceDocs = await queryMastersByServiceKey(db, serviceKeys[0]);
      const serviceCandidates = await loadMasterCandidates(db, serviceDocs);
      const similarMasters = serviceCandidates.filter((master) =>
        sharesService(master, serviceKeys, serviceNames)
      );

      const similarExclude = new Set(excludeIds);
      for (const link of nearby) similarExclude.add(link.id);

      const similarServices = toLinks(
        similarMasters,
        similarExclude,
        cityLabel,
        MAX_LINKS
      );

      return { nearby, similarServices };
    } catch (error) {
      console.warn("[loadRelatedMasters] Failed to load related masters:", error);
      return empty;
    }
  }
);
