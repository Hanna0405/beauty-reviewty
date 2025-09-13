import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { requireDb } from "@/lib/firebase";

export async function safeGetCollection<T = any>(
  path: string,
  q: (returnType: ReturnType<typeof query>) => ReturnType<typeof query> = (x) => x
): Promise<T[]> {
  try {
    const db = requireDb();
    const base = collection(db, path);
    // allow caller to add orderBy/where/limit; default is straight read
    // @ts-ignore
    const qref = q(base);
    const snap = await getDocs(qref as any);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as T));
  } catch (e: any) {
    // If rules block this in some env, do NOT crash the UI
    if (e?.code === "permission-denied") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[publicFetch] permission-denied for '${path}' — returning []`);
      }
      return [];
    }
    // Any other error: return [] but log in dev
    if (process.env.NODE_ENV !== "production") {
      console.error(`[publicFetch] ${path} failed:`, e);
    }
    return [];
  }
}
