import { NextResponse } from 'next/server';
import { adminBucket } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const envBucket = process.env.FIREBASE_STORAGE_BUCKET || '(unset)';
    const bucket = adminBucket();
    const [exists] = await bucket.exists();
    return NextResponse.json({
      ok: true,
      envBucket,
      adminBucket: bucket.name,
      exists,
      hint: 'envBucket must equal adminBucket and exists must be true'
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'diag failed' }, { status: 500 });
  }
}
