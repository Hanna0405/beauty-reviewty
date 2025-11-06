import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * Body: {
 * masterId: string,
 * weekly?: { [dayIndex: string]: {start:string,end:string}[] },
 * daysOff?: string[],
 * blocks?: {date:string,start:string,end:string}[]
 * }
 * Валидация минимальная. Предполагаем, что вызывает сам мастер из кабинета.
 */
export async function POST(req: NextRequest) {
 try {
 const db = getAdminDb();
 if (!db) {
  return new Response(JSON.stringify({ ok: false, error: 'Admin DB not available' }), {
   status: 500,
   headers: { 'Content-Type': 'application/json' },
  });
 }
 const { masterId, weekly, daysOff, blocks } = await req.json();
 if (!masterId) return new Response(JSON.stringify({ok:false,error:"masterId required"}), {status:400});
 const ref = db.collection("masterSchedules").doc(masterId);
 const payload: any = {};
 if (weekly !== undefined) payload.weekly = weekly;
 if (daysOff !== undefined) payload.daysOff = daysOff;
 if (blocks !== undefined) payload.blocks = blocks;
 await ref.set(payload, { merge: true });
 return new Response(JSON.stringify({ok:true}), {status:200});
 } catch (e:any) {
 return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
 }
}
