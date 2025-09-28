import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin'; // your Admin SDK init (reuse from upload API)
import { getStorage } from 'firebase-admin/storage';

export async function POST(req: Request) {
 try {
 const { path } = await req.json();
 if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

 const bucket = getStorage(getAdminApp()).bucket();
 await bucket.file(path).delete({ ignoreNotFound: true });

 return NextResponse.json({ ok: true });
 } catch (e) {
 console.error('[api/delete-file] error', e);
 return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
 }
}
