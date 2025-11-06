import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

/** Body: { chatId: string, userId: string } */
export async function POST(req: NextRequest) {
 try {
 const db = getAdminDb();
 if (!db) {
  return new Response(JSON.stringify({ ok: false, error: 'Admin DB not available' }), {
   status: 500,
   headers: { 'Content-Type': 'application/json' },
  });
 }
 const { chatId, userId } = await req.json();
 if (!chatId || !userId) return new Response(JSON.stringify({ok:false,error:"chatId & userId required"}), {status:400});
 await db.collection("chats").doc(chatId).collection("reads").doc(userId).set({
 lastReadAt: Timestamp.now(),
 }, { merge: true });
 return new Response(JSON.stringify({ ok:true }), { status:200 });
 } catch (e:any) {
 return new Response(JSON.stringify({ ok:false, error: e?.message || "Server error" }), { status:500 });
 }
}
