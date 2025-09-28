import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/** Body: { userId: string } -> { ok, byChat: Record<chatId, number>, byBooking: Record<bookingId, number> } */
export async function POST(req: NextRequest) {
 try {
 const { userId } = await req.json();
 if (!userId) return new Response(JSON.stringify({ok:false,error:"userId required"}), {status:400});

 const chatsSnap = await adminDb.collection("chats").where("participants","array-contains",userId).limit(200).get();
 const byChat: Record<string, number> = {};
 const byBooking: Record<string, number> = {};

 for (const chat of chatsSnap.docs) {
 const chatId = chat.id;
 const c:any = chat.data();
 const readDoc = await adminDb.collection("chats").doc(chatId).collection("reads").doc(userId).get();
 const lastReadAt:any = readDoc.exists ? readDoc.data()?.lastReadAt : null;

 const msgsSnap = await adminDb.collection("chats").doc(chatId).collection("messages")
 .orderBy("createdAt","desc").limit(100).get();

 let cnt = 0;
 for (const m of msgsSnap.docs) {
 const d:any = m.data();
 if (d.senderId === userId) continue;
 const ts:any = d.createdAt;
 const t = ts?.toMillis ? ts.toMillis() : (ts?._seconds||0)*1000;
 const r = lastReadAt?.toMillis ? lastReadAt.toMillis() : (lastReadAt?._seconds||0)*1000;
 if (!lastReadAt || t > r) cnt++;
 }
 if (cnt > 0) {
 byChat[chatId] = cnt;
 if (c.bookingId) {
 byBooking[c.bookingId] = (byBooking[c.bookingId] || 0) + cnt;
 }
 }
 }

 return new Response(JSON.stringify({ok:true, byChat, byBooking}), {status:200});
 } catch (e:any) {
 return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
 }
}
