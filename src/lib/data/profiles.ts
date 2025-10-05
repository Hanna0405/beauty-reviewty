import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";

export async function fetchProfileBySlug(slug: string) {
  const q = query(collection(db, "profiles"), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  let doc = null;
  snap.forEach(d => (doc = { id: d.id, ...(d.data() as any) }));
  return doc; // contains uid, displayName, citySlug, etc.
}

export async function fetchProfileByUid(uid: string) {
  const q = query(collection(db, "profiles"), where("uid", "==", uid), limit(1));
  const snap = await getDocs(q);
  let doc = null;
  snap.forEach(d => (doc = { id: d.id, ...(d.data() as any) }));
  return doc;
}
