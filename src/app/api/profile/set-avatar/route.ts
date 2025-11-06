import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
 try {
 const { uid, url, path } = await req.json();
 if (!uid) {
 return NextResponse.json({ ok:false, error:'uid required' }, { status: 400 });
 }
 
 const db = getAdminDb();
 if (!db) {
  return new Response(JSON.stringify({ ok: false, error: 'Admin DB not available' }), {
   status: 500,
   headers: { 'Content-Type': 'application/json' },
  });
 }
 
 // Write to masters collection (preferred over profiles if both exist)
 const updateData: any = {};
 if (url !== undefined) updateData.photoUrl = url;
 if (path !== undefined) updateData.photoPath = path;
 
 await db.collection('masters').doc(uid).set(updateData, { merge: true });
 
 return NextResponse.json({ ok:true });
 } catch (e:any) {
 console.error('[API /api/profile/set-avatar] error:', e);
 return NextResponse.json({ ok:false, error: e?.message || 'Set avatar failed' }, { status: 500 });
 }
}
