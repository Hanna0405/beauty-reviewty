import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/** Body: { bookingId: string } -> { ok, chatId?: string } */
export async function POST(req: NextRequest) {
 try {
 const { bookingId } = await req.json();
 if (!bookingId) return new Response(JSON.stringify({ok:false,error:"bookingId required"}), {status:400});
 const snap = await adminDb.collection("chats").where("bookingId","==",bookingId).limit(1).get();
 if (snap.empty) return new Response(JSON.stringify({ok:true}), {status:200});
 return new Response(JSON.stringify({ok:true, chatId: snap.docs[0].id}), {status:200});
 } catch (e:any) {
 return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
 }
}
