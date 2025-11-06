import { NextResponse } from 'next/server';
import { getAdminBucket } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
 try {
 const envBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET_DEV || '(unset)';
 const bucket = getAdminBucket();
 if (!bucket) {
  return NextResponse.json(
   { ok: false, error: 'Admin bucket not available' },
   { status: 500 }
  );
 }
 const [exists] = await bucket.exists(); // network call to GCS
 return NextResponse.json({
 ok: true,
 envBucket,
 adminBucket: bucket.name,
 exists,
 hint: 'envBucket must equal adminBucket and exists must be true',
 });
 } catch (e: any) {
 return NextResponse.json({ ok:false, error: e?.message || 'diag failed' }, { status: 500 });
 }
}
