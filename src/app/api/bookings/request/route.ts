import { NextResponse } from 'next/server';
import { adminDb, adminAuth, getAdminApp } from '@/lib/firebase-admin'; // централизованный импорт

function bad(message: string, code = 400) {
  return NextResponse.json({ ok: false, error: message }, { status: code });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return bad('Missing auth token', 401);

    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(idToken).catch(() => null);
    if (!decoded?.uid) return bad('Invalid auth token', 401);
    const clientUid = decoded.uid;

    // Parse JSON
    let body: any = null;
    try { body = await req.json(); } catch { return bad('Body must be JSON'); }
    if (!body || typeof body !== 'object') return bad('Empty body');

    const listingId = String(body.listingId || '').trim();
    let masterUid = String(body.masterUid || '').trim();
    const startAtISO = String(body.startAtISO || '').trim();
    const durationMin = Number(body.durationMin);
    const note = typeof body.note === 'string' ? body.note : undefined;

    if (!listingId) return bad('Missing listingId');
    if (!startAtISO) return bad('Missing startAtISO');
    if (!Number.isFinite(durationMin) || durationMin <= 0 || durationMin > 8 * 60) {
      return bad('Invalid durationMin');
    }

    const startAtDate = new Date(startAtISO);
    if (isNaN(startAtDate.getTime())) return bad('Invalid startAtISO');
    if (startAtDate.getTime() < Date.now() - 60_000) return bad('startAt must be in the future');

    const db = adminDb();

    // Load listing, infer masterUid from multiple common field names
    const snap = await db.collection('listings').doc(listingId).get();
    if (!snap.exists) return bad('Listing not found');
    const listing = snap.data() as any;

    const inferredMaster =
      listing?.masterUid ||
      listing?.userUid ||
      listing?.ownerUid ||
      listing?.profileId ||
      null;

    if (!masterUid) masterUid = inferredMaster ? String(inferredMaster) : '';
    if (!masterUid) return bad('masterUid not found on listing');

    // If listing has some master id, ensure consistency
    if (inferredMaster && String(inferredMaster) !== masterUid) {
      return bad('listing/master mismatch');
    }

    const { Timestamp } = await import('firebase-admin/firestore');
    const now = new Date();

    const doc = {
      status: 'pending',
      listingId,
      masterUid,
      clientUid,
      startAt: Timestamp.fromDate(startAtDate),
      durationMin,
      note: note?.slice(0, 1000),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      listingTitle: listing?.title || listing?.name || undefined,
      cityName: listing?.city?.formatted || listing?.cityName || undefined,
    };

    const ref = await db.collection('bookings').add(doc);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err: any) {
    console.error('BOOKING_REQUEST_ERROR', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}