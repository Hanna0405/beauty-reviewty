import { db } from "@/lib/firebase-client";
import { getDocs, query, collection, where } from "firebase/firestore";

export type MinimalMaster = {
  uid: string;
  displayName?: string | null;
  phone?: string | null;
  nickname?: string | null; // username handle if you have it
  slug?: string | null;
};

export async function fetchMastersByUids(uids: string[]): Promise<Record<string, MinimalMaster>> {
  const unique = Array.from(new Set(uids.filter(Boolean)));
  if (!unique.length) return {};
  
  // If >10 uids, chunk into batches of 10 (limit of Firestore "in" operator).
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 10) {
    chunks.push(unique.slice(i, i + 10));
  }

  const result: Record<string, MinimalMaster> = {};
  
  for (const c of chunks) {
    const qq = query(collection(db, "profiles"), where("uid", "in", c));
    const snap = await getDocs(qq);
    snap.forEach(d => {
      const data = d.data() as any;
      result[data.uid] = {
        uid: data.uid,
        displayName: data.displayName ?? null,
        phone: data.phone ?? null,
        nickname: data.username ?? data.nickname ?? null,
        slug: data.slug ?? null,
      };
    });
  }
  
  return result;
}
