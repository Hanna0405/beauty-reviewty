import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/** Body: { userId: string } */
export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return new Response(JSON.stringify({ ok: false, error: 'Admin DB not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { userId } = await req.json();
    if (!userId) return new Response(JSON.stringify({ok:false,error:"userId required"}), {status:400});
    const snap = await db.collection("chats").where("participants","array-contains",userId).limit(100).get();
    const items = snap.docs.map(d=>({id:d.id, ...d.data()}));
    return new Response(JSON.stringify({ok:true, items}), {status:200});
  } catch (e:any) {
    return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
  }
}
