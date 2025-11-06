import { NextRequest, NextResponse } from 'next/server';
import { getAdminBucket } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
 try {
 const { path } = await req.json();
 if (!path || typeof path !== 'string') {
 return NextResponse.json({ ok:false, error:'path required' }, { status: 400 });
 }
 const bucket = getAdminBucket();
 if (!bucket) {
  return NextResponse.json({ ok: false, error: 'Bucket not available' }, { status: 500 });
 }
 await bucket.file(path).delete({ ignoreNotFound: true });
 return NextResponse.json({ ok:true });
 } catch (e:any) {
 console.error('[API /api/storage/delete] error:', e);
 return NextResponse.json({ ok:false, error: e?.message || 'delete failed' }, { status: 500 });
 }
}
