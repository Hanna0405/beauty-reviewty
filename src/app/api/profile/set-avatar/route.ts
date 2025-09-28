import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
 try {
 const { uid, url, path } = await req.json();
 if (!uid) {
 return NextResponse.json({ ok:false, error:'uid required' }, { status: 400 });
 }
 
 // Write to masters collection (preferred over profiles if both exist)
 const updateData: any = {};
 if (url !== undefined) updateData.photoUrl = url;
 if (path !== undefined) updateData.photoPath = path;
 
 await adminDb.collection('masters').doc(uid).set(updateData, { merge: true });
 
 return NextResponse.json({ ok:true });
 } catch (e:any) {
 console.error('[API /api/profile/set-avatar] error:', e);
 return NextResponse.json({ ok:false, error: e?.message || 'Set avatar failed' }, { status: 500 });
 }
}
