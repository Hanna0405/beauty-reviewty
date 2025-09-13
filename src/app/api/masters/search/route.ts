import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { MastersSearchReq, MastersSearchRes, Master } from '@/types/masters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
 try {
 const body = (await req.json()) as MastersSearchReq;
 const pageSize = Math.min(Math.max(body.pageSize ?? 20, 1), 50);

 let query: FirebaseFirestore.Query = adminDb().collection('masters');
 if (body.city) query = query.where('city', '==', body.city);
 if (body.service) query = query.where('services', 'array-contains', body.service);
 if (body.language) query = query.where('languages', 'array-contains', body.language);
 if (body.minRating) query = query.where('rating', '>=', Number(body.minRating));

 // order & pagination
 query = query.orderBy('rating', 'desc').limit(pageSize + 1);
 if (body.cursor) {
 const snap = await adminDb().collection('masters').doc(body.cursor).get();
 if (snap.exists) query = query.startAfter(snap);
 }

 const snap = await query.get();
 const docs = snap.docs.slice(0, pageSize);
 const items: Master[] = docs.map(d => {
 const x = d.data() as any;
 return {
 id: d.id,
 displayName: x.displayName ?? x.name ?? '',
 services: x.services ?? [],
 languages: x.languages ?? [],
 city: x.city ?? null,
 rating: typeof x.rating === 'number' ? x.rating : null,
 photoUrl: x.photoUrl ?? null,
 location: x.location ?? x.geo ?? null,
 };
 });

 const nextCursor = snap.docs.length > pageSize ? snap.docs[pageSize].id : null;
 const res: MastersSearchRes = { ok: true, items, nextCursor };
 return NextResponse.json(res);
 } catch (e:any) {
 console.error('[API /api/masters/search] error', e);
 return NextResponse.json({ ok:false, error: e?.message || 'search failed' } as MastersSearchRes, { status: 500 });
 }
}
