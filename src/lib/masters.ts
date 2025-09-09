import type { Master } from "@/types"; // adjust path if your types live elsewhere
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

type ListOpts = {
 take?: number;
 city?: string;
 service?: string;
};

export async function listMasters(opts: ListOpts = {}): Promise<Master[]> {
 try {
 const base = collection(db, "masters");
 const clauses: any[] = [];

 if (opts.city) clauses.push(where("city", "==", opts.city));
 if (opts.service) clauses.push(where("service", "==", opts.service));

 const q = query(base, ...clauses, limit(Math.max(1, opts.take ?? 20)));
 const snap = await getDocs(q);
 return snap.docs.map((d) => ({ ...(d.data() as Master), id: d.id }));
 } catch (error) {
 console.error("[listMasters] Error:", error);
 return [];
 }
}