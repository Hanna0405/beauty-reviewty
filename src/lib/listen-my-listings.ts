import { db } from "@/lib/firebase";
import {
 collection, onSnapshot, orderBy, query, where, DocumentData, Query
} from "firebase/firestore";

export function listenMyListingsSafe(
 uid: string,
 onRows: (rows:any[]) => void,
 onErr?: (e:any)=>void
) {
 const col = collection(db, "listings");
 let q: Query<DocumentData>;
 try {
 q = query(col, where("ownerUid","==",uid), orderBy("createdAt","desc"));
 } catch {
 q = query(col, where("ownerUid","==",uid));
 }
 const off = onSnapshot(
 q,
 (snap) => onRows(snap.docs.map(d=>({ id:d.id, ...d.data() }))),
 (e) => {
 // Missing composite index or similar -> fallback without orderBy
 if (String(e?.code) === "failed-precondition") {
 const off2 = onSnapshot(
 query(col, where("ownerUid","==",uid)),
 (snap) => onRows(snap.docs.map(d=>({ id:d.id, ...d.data() }))),
 (ee)=> onErr?.(ee)
 );
 off(); return off2;
 }
 onErr?.(e);
 }
 );
 return off;
}
