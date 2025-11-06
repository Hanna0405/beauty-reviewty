import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

type ReviewPhoto = { url: string; path: string };
type ReviewSubjectType = 'master' | 'listing';

const bad = (msg: string, code = 400) =>
  NextResponse.json({ ok: false, error: msg }, { status: code });

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return bad('Missing Authorization token', 401);

    const decoded = await adminAuth().verifyIdToken(token);
    const authorUid = decoded.uid;
    const body = await req.json().catch(() => ({}));

    const {
      subject, // { type: 'master'|'listing', id: string }
      rating, // 1..5
      text = '',
      photos = [],
    }: {
      subject?: { type?: ReviewSubjectType; id?: string };
      rating?: number;
      text?: string;
      photos?: ReviewPhoto[];
    } = body || {};

    if (!subject || (subject.type !== 'master' && subject.type !== 'listing') || !subject.id)
      return bad('Invalid subject: {type:"master"|"listing", id:string}');
    if (typeof rating !== 'number' || rating < 1 || rating > 5)
      return bad('Invalid rating (1..5).');

    const textStr = String(text ?? '').trim();
    if (textStr.length > 2000) return bad('Text too long (max 2000).');
    const sanitizedPhotos: ReviewPhoto[] = Array.isArray(photos)
      ? photos.slice(0, 3).map(p => ({ url: String(p?.url || ''), path: String(p?.path || '') }))
      : [];

    const refPath = subject.type === 'master'
      ? `profiles/${subject.id}`
      : `listings/${subject.id}`;
    const exists = await adminDb().doc(refPath).get();
    if (!exists.exists) return bad(`Referenced ${subject.type} not found`);

    // one-per-author+subject
    const dup = await adminDb().collection('reviews')
      .where('authorUid', '==', authorUid)
      .where('subject.type', '==', subject.type)
      .where('subject.id', '==', subject.id)
      .limit(1).get();

    const now = Timestamp.now();
    const base = {
      subject,
      subjectType: subject.type,
      subjectId: subject.id,
      authorUid,
      rating,
      text: textStr,
      photos: sanitizedPhotos,
      updatedAt: now,
    };

    if (!dup.empty) {
      const id = dup.docs[0].id;
      const docRef = adminDb().collection('reviews').doc(id);
      const prev = await docRef.get();
      await docRef.update({
        ...base,
        ...(prev.get('createdAt') ? { createdAt: prev.get('createdAt') } : { createdAt: now }),
      });
      return NextResponse.json({ ok: true, id, updated: true });
    }

    const doc = await adminDb().collection('reviews').add({ ...base, createdAt: now });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch (e: any) {
    console.error('[api/reviews/create] error:', e);
    const status = String(e?.code || '').includes('auth') ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Internal error' }, { status });
  }
}

