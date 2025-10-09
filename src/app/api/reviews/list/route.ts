import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    if (type !== 'master' && type !== 'listing') {
      return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 });
    }
    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });

    const col = adminDb.collection('reviews');
    // New schema: equality-only (no orderBy)
    let snaps = await col
      .where('subjectType', '==', type)
      .where('subjectId', '==', id)
      .limit(200)
      .get();

    // Legacy fallback (no orderBy)
    if (snaps.empty) {
      const legacyField = type === 'master' ? 'masterId' : 'listingId';
      snaps = await col.where(legacyField, '==', id).limit(200).get();
    }

    const items = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a: any, b: any) => {
      const au = a?.updatedAt?.seconds ?? a?.createdAt?.seconds ?? 0;
      const bu = b?.updatedAt?.seconds ?? b?.createdAt?.seconds ?? 0;
      return bu - au;
    });
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error('[api/reviews/list] error', e);
    // Never force users to create indexes for equality lookups:
    const msg = typeof e?.message === 'string' ? e.message : 'Internal error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

