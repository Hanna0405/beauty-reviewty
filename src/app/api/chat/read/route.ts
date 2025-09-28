import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

/** Body: { chatId: string, userId: string } */
export async function POST(req: NextRequest) {
 try {
 const { chatId, userId } = await req.json();
 if (!chatId || !userId) return new Response(JSON.stringify({ok:false,error:"chatId & userId required"}), {status:400});
 await adminDb.collection("chats").doc(chatId).collection("reads").doc(userId).set({
 lastReadAt: Timestamp.now(),
 }, { merge: true });
 return new Response(JSON.stringify({ ok:true }), { status:200 });
 } catch (e:any) {
 return new Response(JSON.stringify({ ok:false, error: e?.message || "Server error" }), { status:500 });
 }
}
