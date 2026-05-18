import { cache } from "react";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmins";
import { serializeFirestoreDoc } from "@/lib/firestore/serializeForClient";

export type MasterProfileRecord = Record<string, unknown> & { id: string };
export type MasterListingRecord = Record<string, unknown> & { id: string };

export type MasterProfilePageData = {
  profile: MasterProfileRecord | null;
  listings: MasterListingRecord[];
};

async function loadProfileByDocId(
  db: Firestore,
  docId: string
): Promise<MasterProfileRecord | null> {
  for (const collectionName of ["profiles", "masters"]) {
    const snap = await db.collection(collectionName).doc(docId).get();
    if (snap.exists) {
      return serializeFirestoreDoc({
        id: snap.id,
        ...snap.data(),
      }) as MasterProfileRecord;
    }
  }
  return null;
}

async function loadProfileByUid(
  db: Firestore,
  uid: string
): Promise<MasterProfileRecord | null> {
  for (const collectionName of ["profiles", "masters"]) {
    const qs = await db
      .collection(collectionName)
      .where("uid", "==", uid)
      .limit(1)
      .get();
    if (!qs.empty) {
      const docSnap = qs.docs[0];
      return serializeFirestoreDoc({
        id: docSnap.id,
        ...docSnap.data(),
      }) as MasterProfileRecord;
    }
  }
  return null;
}

async function fetchListingsForMaster(
  db: Firestore,
  masterUid: string | null,
  profileId: string
): Promise<MasterListingRecord[]> {
  const linkKeys = ["ownerId", "userId", "uid", "userUID"] as const;

  if (masterUid) {
    for (const key of linkKeys) {
      try {
        const snap = await db
          .collection("listings")
          .where(key, "==", masterUid)
          .get();
        if (!snap.empty) {
          return snap.docs.map(
            (docSnap) =>
              serializeFirestoreDoc({
                id: docSnap.id,
                ...docSnap.data(),
              }) as MasterListingRecord
          );
        }
      } catch {
        // try next key
      }
    }
  }

  try {
    const snap = await db
      .collection("listings")
      .where("profileId", "==", profileId)
      .get();
    if (!snap.empty) {
      return snap.docs.map(
        (docSnap) =>
          serializeFirestoreDoc({
            id: docSnap.id,
            ...docSnap.data(),
          }) as MasterListingRecord
      );
    }
  } catch {
    // ignore
  }

  return [];
}

export const loadMasterProfilePageData = cache(
  async (rawId: string): Promise<MasterProfilePageData> => {
    const id = decodeURIComponent(rawId);

    try {
      const db = getAdminDb();
      let profile =
        (await loadProfileByDocId(db, id)) ?? (await loadProfileByUid(db, id));

      if (!profile) {
        return { profile: null, listings: [] };
      }

      const ownerUid =
        (profile.uid as string | undefined) ||
        (profile.userId as string | undefined) ||
        (profile.ownerId as string | undefined) ||
        (profile.userUID as string | undefined) ||
        profile.id;

      const listings = await fetchListingsForMaster(db, ownerUid, id);
      return { profile, listings };
    } catch (error) {
      console.warn("[master/[id]] Failed to load profile page data:", error);
      return { profile: null, listings: [] };
    }
  }
);
