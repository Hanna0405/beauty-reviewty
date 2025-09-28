import { db } from "@/lib/firebase.client";
import {
 collection, onSnapshot, query, where, orderBy, Query, DocumentData,
} from "firebase/firestore";

/**
 * Listen to the owner's listings. Try (where + orderBy createdAt desc),
 * and if Firestore requires a composite index, fallback to only (where).
 */
export function listenMyListingsResilient(
 uid: string,
 onData: (rows: any[]) => void,
 onError?: (e: any) => void
) {
 const col = collection(db, "listings");

 let q: Query<DocumentData> | null = null;
 try {
 // First try with ordering (may require composite index)
 q = query(col, where("uid", "==", uid), orderBy("createdAt", "desc"));
 } catch {
 // If the SDK itself throws on building the query (rare), fallback immediately
 q = query(col, where("uid", "==", uid));
 }

 // Primary listener
 const off = onSnapshot(
 q!,
 (snap) => {
 const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
 onData(rows);
 },
 (err) => {
 console.error("[listenMyListings] primary error:", err);
 // If a missing-index error occurs at runtime – fallback without orderBy
 if (String(err?.code) === "failed-precondition") {
 const off2 = onSnapshot(
 query(col, where("uid", "==", uid)),
 (snap2) => {
 const rows = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
 onData(rows);
 },
 (e2) => {
 console.error("[listenMyListings] fallback error:", e2);
 onError?.(e2);
 }
 );
 // Stop primary listener, return fallback stopper
 off();
 return off2;
 } else {
 onError?.(err);
 }
 }
 );

 return off;
}
