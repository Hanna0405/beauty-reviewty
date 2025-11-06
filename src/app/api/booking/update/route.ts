import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { sendMail, tplBookingStatus } from "@/lib/mailer";
import { formatWhenFromBooking, listingPublicUrl } from "@/lib/emailFormat";

export async function POST(req: NextRequest) {
 try {
 const db = getAdminDb();
 if (!db) {
  return new Response(JSON.stringify({ ok: false, error: 'Admin DB not available' }), {
   status: 500,
   headers: { 'Content-Type': 'application/json' },
  });
 }
 const { bookingId, action, userId } = await req.json();
 if (!bookingId || !action || !userId) return new Response(JSON.stringify({ok:false,error:"bookingId, action, userId required"}), {status:400});
 const ref = db.collection("bookings").doc(bookingId);
 const snap = await ref.get();
 if (!snap.exists) return new Response(JSON.stringify({ok:false,error:"Not found"}), {status:404});
 const data = snap.data()!;
 if (data.masterId !== userId) return new Response(JSON.stringify({ok:false,error:"Forbidden"}), {status:403});
 if (action === "confirm") {
 await ref.update({ status: "confirmed", updatedAt: Timestamp.now() });
 } else if (action === "decline") {
 await ref.update({ status: "declined", updatedAt: Timestamp.now() });
 } else if (action === "delete") {
 await ref.delete();
 } else {
 return new Response(JSON.stringify({ok:false,error:"Unknown action"}), {status:400});
 }

 try {
 const after = await ref.get();
 const b = { id: after.id, ...after.data() } as any;
 const when = formatWhenFromBooking(b);
 const url = listingPublicUrl(b);
 let listingTitle = "Listing";
 try {
 const ls = await db.collection("listings").doc(b.listingId).get();
 if (ls.exists) listingTitle = (ls.data()?.title) || "Listing";
 } catch {}
 const clientEmail = process.env.CLIENT_FALLBACK_EMAIL || ""; // здесь можно подставить реальный email клиента из профиля
 if (clientEmail) {
 await sendMail({
 to: clientEmail,
 subject: `Booking ${action === "confirm" ? "confirmed" : "declined"}`,
 html: tplBookingStatus({ status: action as any, when, durationMin: b.durationMin, listingTitle, listingUrl: url }),
 });
 }
 } catch {}

 return new Response(JSON.stringify({ok:true}), {status:200});
 } catch (e:any) {
 return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
 }
}
