import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
 try {
 const db = getAdminDb();
 if (!db) {
  return NextResponse.json({ ok: false, error: 'Admin DB not available' }, { status: 500 });
 }
 const { masterId } = await req.json();
 if (!masterId) return new Response(JSON.stringify({ok:false,error:"masterId required"}), {status:400});
 const snap = await db.collection("masterSchedules").doc(masterId).get();
 const data = snap.exists ? snap.data() : { weekly:{}, daysOff:[], blocks:[] };
 return new Response(JSON.stringify({ok:true, schedule:data}), {status:200});
 } catch (e:any) {
 return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
 }
}
