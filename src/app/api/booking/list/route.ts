import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
 try {
 const db = getAdminDb();
 if (!db) {
  return new Response(JSON.stringify({ ok: false, error: 'Admin DB not available' }), {
   status: 500,
   headers: { 'Content-Type': 'application/json' },
  });
 }
 const { scope, userId } = await req.json(); // scope: "master"|"client"
 if (!scope || !userId) return new Response(JSON.stringify({ok:false,error:"scope & userId required"}), {status:400});
 let q;
 if (scope === "master") {
   q = db.collection("bookings").where("masterId","==",userId);
 } else {
   q = db.collection("bookings").where("clientId","==",userId);
 }
 const snap = await q.orderBy("createdAt","desc").limit(200).get();
 const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
 // Подтянем краткую инфу о листингах (title, slug) без жёстких join'ов
 // Список уникальных listingId
 const listingIds = Array.from(new Set(raw.map((r:any)=>r.listingId).filter(Boolean)));
 const listingMap: Record<string, any> = {};
 await Promise.all(listingIds.map(async (lid) => {
   try {
     const ls = await db.collection("listings").doc(lid).get();
     if (ls.exists) {
       const d = ls.data()!;
       listingMap[lid] = { title: d.title || "Listing", slug: d.slug || lid };
     }
   } catch {}
 }));
 const items = raw
   .map((r:any)=>({
     ...r,
     _listing: listingMap[r.listingId] || null, // {title, slug}
   }))
   .sort((a:any,b:any)=>{
     const ax = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?._seconds||0)*1000;
     const bx = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?._seconds||0)*1000;
     return bx - ax; // desc
   });
 return new Response(JSON.stringify({ok:true, items}), {status:200});
 } catch (e:any) {
 return new Response(JSON.stringify({ok:false,error:e?.message||"Server error"}), {status:500});
 }
}
