import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/** Body: { chatId: string, limit?: number, before?: number } */
export async function POST(req: NextRequest) {
  try {
    const { chatId, limit = 50, before } = await req.json();
    if (!chatId) return new Response(JSON.stringify({ok:false,error:"chatId required"}), {status:400});
    let q = adminDb.collection("chats").doc(chatId).collection("messages").orderBy("createdAt","desc").limit(limit);
    if (before) {
      q = q.startAfter(before);
    }
    const snap = await q.get();
    const items = snap.docs.map(d=>({id:d.id, ...d.data()})).reverse(); // возвр. по возрастанию
    return new Response(JSON.stringify({ok:true, items}), {status:200});
  } catch (e:any) {
    return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
  }
}
