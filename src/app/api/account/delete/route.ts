import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmins';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bad = (msg: string, status = 400) =>
  NextResponse.json({ ok: false, error: msg }, { status });

/**
 * Marks the user's profile for deletion and removes Firebase Auth user when possible.
 * Does not bulk-delete reviews, listings, or other user content.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return bad('Missing Authorization token', 401);

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const db = getAdminDb();
    const profileSnap = await db.collection('profiles').doc(uid).get();
    const profile = profileSnap.exists
      ? (profileSnap.data() as Record<string, unknown>)
      : null;

    if (profile?.role === 'admin') {
      return bad('Admin accounts cannot be deleted through this flow.', 403);
    }

    const markPayload = {
      accountStatus: 'pending_deletion',
      deletedAt: FieldValue.serverTimestamp(),
      deletionRequestedAt: FieldValue.serverTimestamp(),
      notifyOnBooking: false,
      marketingOptIn: false,
    };

    await db.collection('profiles').doc(uid).set(markPayload, { merge: true });

    const masterSnap = await db.collection('masters').doc(uid).get();
    if (masterSnap.exists) {
      await db.collection('masters').doc(uid).set(markPayload, { merge: true });
    }

    let authDeleted = false;
    try {
      await getAdminAuth().deleteUser(uid);
      authDeleted = true;
    } catch (authErr) {
      console.warn(
        '[api/account/delete] Firebase Auth deleteUser failed; profile marked pending_deletion',
        { uid, authErr }
      );
    }

    if (!authDeleted) {
      console.warn(
        '[api/account/delete] Incomplete cleanup: user content (reviews/listings) not removed; Auth user may remain',
        { uid }
      );
    }

    return NextResponse.json({
      ok: true,
      authDeleted,
      markedForDeletion: true,
    });
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    console.error('[api/account/delete] error:', e);
    const status = String(err?.code || '').includes('auth') ? 401 : 500;
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal error' },
      { status }
    );
  }
}
