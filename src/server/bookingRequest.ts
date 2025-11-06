import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

type Body = {
  listingId: string;
  masterUid: string;
  serviceKey: string;
  serviceName: string;
  start: string; // ISO UTC
  end: string; // ISO UTC
  notes?: string;
  phone?: string;
  price?: number;
};

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 503 });
    }
    const { auth, db } = admin;
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    const decoded = await auth.verifyIdToken(idToken);
    const clientUid = decoded.uid;

    const body = (await req.json()) as Body;
    if (!body.listingId || !body.masterUid || !body.serviceKey || !body.serviceName || !body.start || !body.end) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const startMs = Date.parse(body.start);
    const endMs = Date.parse(body.end);
    if (!isFinite(startMs) || !isFinite(endMs) || endMs <= startMs) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
    }

    const bookings = db.collection('bookings');

    const result = await db.runTransaction(async (tx) => {
      const q = await tx.get(
        bookings
          .where('masterUid', '==', body.masterUid)
          .where('status', 'in', ['pending', 'confirmed'])
          .where('startMs', '<', endMs)
      );
      const overlapping = q.docs.some(d => (d.data() as any).endMs > startMs);
      if (overlapping) throw new Error('Time slot not available');

      const now = Date.now();
      const ref = bookings.doc();
      tx.set(ref, {
        id: ref.id,
        listingId: body.listingId,
        masterUid: body.masterUid,
        clientUid,
        serviceKey: body.serviceKey,
        serviceName: body.serviceName,
        start: body.start,
        end: body.end,
        startMs,
        endMs,
        notes: body.notes || '',
        phone: body.phone || '',
        price: body.price ?? null,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      return { id: ref.id };
    });

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 400 });
  }
}
