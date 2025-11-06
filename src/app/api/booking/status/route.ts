import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
 try {
 const db = getAdminDb();
 if (!db) {
  return NextResponse.json(
   { ok: false, error: 'Admin DB not available' },
   { status: 500 }
  );
 }
 const { bookingId, status } = await req.json();
 await db.collection('bookings').doc(bookingId).update({ status });
 return NextResponse.json({ ok: true });
 } catch (e: any) {
 console.error('[booking/status]', e);
 return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
 }
}