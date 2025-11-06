// src/app/api/booking/request/route.ts
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

type Body = {
 // allow both new/old payload shapes
 listingId?: string;
 masterId?: string;
 dateISO?: string;
 date?: string; // 'YYYY-MM-DD'
 time?: string; // 'HH:mm'
 durationMin?: number | string;
 note?: string;
 customerName?: string;
 customerPhone?: string;
};

export async function POST(req: Request) {
 try {
 const db = getAdminDb();
 if (!db) {
  return new Response(JSON.stringify({ ok: false, error: 'Admin DB not available' }), {
   status: 500,
   headers: { 'Content-Type': 'application/json' },
  });
 }
 const body = (await req.json()) as Body;

 const listingId = body.listingId || body.masterId;
 if (!listingId) {
 return NextResponse.json({ ok: false, error: 'listingId missing' }, { status: 400 });
 }

 // Parse time
 let start: Date | null = null;
 if (body.dateISO) {
 start = new Date(body.dateISO);
 } else if (body.date && body.time) {
 start = new Date(`${body.date}T${body.time}`);
 }
 if (!start || isNaN(start.getTime())) {
 return NextResponse.json({ ok: false, error: 'invalid date/time' }, { status: 400 });
 }

 const durationMin =
 typeof body.durationMin === 'string'
 ? parseInt(body.durationMin, 10)
 : body.durationMin ?? 60;

 const payload = {
 listingId,
 startAt: start.toISOString(),
 durationMin,
 note: body.note ?? '',
 customerName: body.customerName ?? '',
 customerPhone: body.customerPhone ?? '',
 status: 'requested' as const,
 createdAt: new Date().toISOString(),
 };

 // Write via Admin SDK (bypasses client-side security rules)
 const ref = await db.collection('bookings').add(payload);

 return NextResponse.json({ ok: true, id: ref.id }, { status: 200 });
 } catch (e: any) {
 console.error('booking/request error', e);
 return NextResponse.json({ ok: false, error: e?.message || 'server error' }, { status: 500 });
 }
}