import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { sendMail, tplNewMessage } from "@/lib/mailer";
import { chatUrl, listingPublicUrl } from "@/lib/emailFormat";

/** Body: { chatId: string, senderId: string, text: string } */
export async function POST(req: NextRequest) {
  try {
    const { chatId, senderId, text } = await req.json();
    if (!chatId || !senderId || !text) return new Response(JSON.stringify({ok:false,error:"chatId, senderId, text required"}), {status:400});
    const msg = { senderId, text: String(text), createdAt: Timestamp.now() };
    const ref = adminDb.collection("chats").doc(chatId);
 await ref.collection("messages").add(msg);
 await ref.update({ lastMessage: text, updatedAt: Timestamp.now() });

 // EMAIL: уведомим второго участника (best-effort)
 try {
 const snap = await ref.get();
 const c = snap.data()!;
 const target = (c.participants || []).find((p:string)=> p !== senderId);
 // Здесь можно вытаскивать email профиля по userId; пока — фолбэк из ENV
 const targetEmail = process.env.CHAT_FALLBACK_EMAIL || "";
 let listingTitle = "Listing";
 try {
 const ls = await adminDb.collection("listings").doc(c.listingId).get();
 if (ls.exists) listingTitle = (ls.data()?.title) || "Listing";
 } catch {}
 if (target && targetEmail) {
 await sendMail({
 to: targetEmail,
 subject: "New chat message",
 html: tplNewMessage({
 listingTitle,
 listingUrl: listingPublicUrl({ _listing:{ slug: c.listingId }, listingId: c.listingId }),
 text,
 chatUrl: chatUrl(ref.id),
 }),
 });
 }
 } catch {}

 return new Response(JSON.stringify({ok:true}), {status:200});
  } catch (e:any) {
    return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
  }
}
