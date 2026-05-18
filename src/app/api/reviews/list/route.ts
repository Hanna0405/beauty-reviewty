import { NextResponse } from 'next/server';
import type { CollectionReference } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmins';
import {
  isApprovedMasterReviewForProfile,
} from '@/lib/reviews/masterReviewFilters';

export const dynamic = 'force-dynamic';

async function mergeMasterReviews(col: CollectionReference, id: string) {
  const merged = new Map<string, Record<string, unknown>>();

  const queries = [
    col.where('subjectType', '==', 'master').where('subjectId', '==', id).limit(200),
    col.where('masterId', '==', id).limit(200),
    col.where('profileId', '==', id).limit(200),
  ];

  for (const q of queries) {
    try {
      const snap = await q.get();
      snap.docs.forEach((d) => {
        if (!merged.has(d.id)) {
          merged.set(d.id, { id: d.id, ...d.data() });
        }
      });
    } catch (error) {
      console.warn('[api/reviews/list] master query failed:', error);
    }
  }

  return Array.from(merged.values()).filter((item) =>
    isApprovedMasterReviewForProfile(item, [id])
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    if (type !== 'master' && type !== 'listing') {
      return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 });
    }
    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });

    const col = getAdminDb().collection('reviews');
    let items: any[] = [];

    if (type === 'master') {
      items = await mergeMasterReviews(col, id);
    } else {
      let snaps = await col
        .where('subjectType', '==', type)
        .where('subjectId', '==', id)
        .limit(200)
        .get();

      if (snaps.empty) {
        snaps = await col.where('listingId', '==', id).limit(200).get();
      }

      items = snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    const seen = new Map<string, { name: string | null; photoURL: string | null }>();
    async function getAuthor(uid: string) {
      if (seen.has(uid)) return seen.get(uid)!;
      try {
        const u = await getAdminAuth().getUser(uid);
        const info = { name: u.displayName || null, photoURL: u.photoURL || null };
        seen.set(uid, info);
        return info;
      } catch {
        const info = { name: null, photoURL: null };
        seen.set(uid, info);
        return info;
      }
    }

    await Promise.all(items.map(async (it: any) => {
      const a = await getAuthor(String(it.authorUid || ''));
      const ts = it?.createdAt?.seconds ?? it?.updatedAt?.seconds ?? 0;
      const createdAtISO = ts ? new Date(ts * 1000).toISOString() : null;
      it.author = { name: a.name, photoURL: a.photoURL };
      it.createdAtISO = createdAtISO;
    }));

    items.sort((a: any, b: any) => {
      const au = a?.updatedAt?.seconds ?? a?.createdAt?.seconds ?? 0;
      const bu = b?.updatedAt?.seconds ?? b?.createdAt?.seconds ?? 0;
      return bu - au;
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error('[api/reviews/list] error', e);
    const msg = typeof e?.message === 'string' ? e.message : 'Internal error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
