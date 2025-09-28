import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
 try {
 const { bookingId, status } = await req.json();
 await adminDb.collection('bookings').doc(bookingId).update({ status });
 return NextResponse.json({ ok: true });
 } catch (e: any) {
 console.error('[booking/status]', e);
 return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
 }
}