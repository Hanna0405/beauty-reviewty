import { db } from "@/lib/firebase.client";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export type Listing = {
  id: string;
  masterUid?: string | null;
  ownerUid?: string | null;
  createdBy?: string | null;
  isActive?: boolean;
  title?: string;
  citySlug?: string;
  city?: string;
  priceFrom?: number;
  photos?: { url: string }[];
  services?: string[];
  languages?: string[];
  // ...other fields
};

export async function fetchListingsByMasterUid(masterUid: string, opts?: { includeDrafts?: boolean }) {
  // Prefer masterUid; support legacy fields as fallback
  const uids = Array.from(new Set([masterUid].filter(Boolean))) as string[];

  // active
  const q1 = query(
    collection(db, "listings"),
    where("masterUid", "==", masterUid),
    where("isActive", "==", true),
    orderBy("title")
  );

  const res: Listing[] = [];
  const snap1 = await getDocs(q1);
  snap1.forEach(d => res.push({ id: d.id, ...(d.data() as any) }));

  if (opts?.includeDrafts) {
    // drafts for this owner (masterUid matches OR legacy owner fields)
    const q2 = query(collection(db, "listings"), where("masterUid", "==", masterUid), where("isActive", "==", false));
    const snap2 = await getDocs(q2);
    snap2.forEach(d => res.push({ id: d.id, ...(d.data() as any) }));

    // legacy fallback (optional, safe no-op if field absent)
    const q3 = query(collection(db, "listings"), where("ownerUid", "==", masterUid));
    const snap3 = await getDocs(q3);
    snap3.forEach(d => {
      const data = d.data() as any;
      if (!res.find(x => x.id === d.id)) res.push({ id: d.id, ...data });
    });
  }

  return res;
}
