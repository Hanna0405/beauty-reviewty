import { NextRequest, NextResponse } from 'next/server';
import { adminBucket } from '@/lib/firebaseAdmin';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicUrl(bucketName: string, objectPath: string, token: string) {
 // token-based URL (works regardless of bucket domain)
 return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

export async function POST(req: NextRequest) {
 try {
 const form = await req.formData();
 const file = form.get('file') as unknown as File | null;
 const folder = (form.get('folder') as string) || 'uploads';
 if (!file) return NextResponse.json({ ok:false, error:'No file provided' }, { status: 400 });

 const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
 const key = `${folder}/${randomUUID()}.${ext}`;

 const buf = Buffer.from(await file.arrayBuffer());
 const bucket = adminBucket();
 const token = randomUUID();
 const gcsFile = bucket.file(key);

 await gcsFile.save(buf, {
 resumable: false,
 contentType: file.type || 'application/octet-stream',
 metadata: {
 cacheControl: 'public, max-age=31536000, immutable',
 metadata: { firebaseStorageDownloadTokens: token },
 },
 });

 const url = publicUrl(bucket.name, key, token);
 return NextResponse.json({ ok:true, url, path:key, bucket: bucket.name });
 } catch (e: any) {
 console.error('[API /api/upload] error:', e);
 return NextResponse.json({ ok:false, error: e?.message || 'Upload failed' }, { status: 500 });
 }
}