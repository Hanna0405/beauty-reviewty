import { NextResponse } from "next/server";
import { adminDb } from '@/lib/firebaseAdmin';

export async function PATCH(
 req: Request,
 { params }: { params: { id: string } }
) {
 try {
 const bookingId = params.id;
 const body = await req.json();
 const { status } = body;

 if (!status || !['confirmed', 'declined', 'canceled', 'completed'].includes(status)) {
 return NextResponse.json({ error: "Invalid status" }, { status: 400 });
 }

 await adminDb.collection('bookings').doc(bookingId).update({ 
 status,
 updatedAt: Date.now()
 });

 return NextResponse.json({ ok: true });
 } catch (e: any) {
 console.error('[booking/update] error:', e);
 return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
 }
}