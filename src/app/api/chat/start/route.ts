import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Body: { bookingId: string, userId: string }
 * Вернёт существующий chatId по bookingId или создаст новый.
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId, userId } = await req.json();
    if (!bookingId || !userId) return new Response(JSON.stringify({ok:false,error:"bookingId & userId required"}), {status:400});
    const bRef = adminDb.collection("bookings").doc(bookingId);
    const bSnap = await bRef.get();
    if (!bSnap.exists) return new Response(JSON.stringify({ok:false,error:"Booking not found"}), {status:404});
    const b = bSnap.data()!;
    const existing = await adminDb.collection("chats").where("bookingId","==",bookingId).limit(1).get();
    if (!existing.empty) {
      return new Response(JSON.stringify({ok:true, chatId: existing.docs[0].id}), {status:200});
    }
    const payload = {
      bookingId,
      listingId: b.listingId,
      masterId: b.masterId,
      clientId: b.clientId || null,
      participants: [b.masterId, b.clientId].filter(Boolean),
      lastMessage: "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const ref = await adminDb.collection("chats").add(payload);
    return new Response(JSON.stringify({ok:true, chatId: ref.id}), {status:200});
  } catch (e:any) {
    return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
  }
}
