import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { adminBucket, ADMIN_BUCKET } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicUrl(bucketName: string, path: string) {
  return `https://storage.googleapis.com/${bucketName}/${encodeURI(path)}`;
}
function tokenUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export async function POST(req: NextRequest) {
  try {
    const ctype = req.headers.get('content-type') || '';
    if (!ctype.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();

    // Accept both "files" (multi) and "file" (single)
    const items: any[] = form.getAll('files');
    const single = form.get('file');
    if (!items.length && single) items.push(single);
    if (!items.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });

    const listingId = (form.get('listingId') as string) || 'misc';

    const bucket = adminBucket();
    console.info('[upload] ENV bucket =', ADMIN_BUCKET);
    console.info('[upload] Using bucket =', bucket.name);

    const results: { url: string; path: string; name: string; size: number; type: string }[] = [];

    for (const it of items) {
      const file = it as File;
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawName = file.name || `upload_${Date.now()}`;
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const mime = (file.type || '').toLowerCase();
      const size = (file.size as number) || buffer.length;

      if (size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${safeName} too large` }, { status: 413 });
      }

      const path = `uploads/listings/${listingId}/${Date.now()}_${safeName}`;
      const gcsFile = bucket.file(path);

      try {
        await gcsFile.save(buffer, {
          contentType: mime || 'application/octet-stream',
          resumable: false,
          metadata: { cacheControl: 'public, max-age=31536000' },
        });
      } catch (e: any) {
        console.error('[upload] save() error:', e?.message);
        return NextResponse.json({ error: `save() failed: ${e?.message || 'unknown'}` }, { status: 500 });
      }

      // Try public URL first
      try {
        await gcsFile.makePublic();
        results.push({ url: publicUrl(bucket.name, path), path, name: safeName, size, type: mime });
      } catch (e: any) {
        console.warn('[upload] makePublic() failed, fallback to token URL:', e?.message);
        const token = randomUUID();
        try {
          await gcsFile.setMetadata({
            metadata: { firebaseStorageDownloadTokens: token },
            cacheControl: 'public, max-age=31536000',
            contentType: mime || 'application/octet-stream',
          });
        } catch (mErr: any) {
          console.error('[upload] setMetadata() error:', mErr?.message);
          return NextResponse.json({ error: `setMetadata() failed: ${mErr?.message || 'unknown'}` }, { status: 500 });
        }
        results.push({ url: tokenUrl(bucket.name, path, token), path, name: safeName, size, type: mime });
      }
    }

    console.info('[upload] response files =', results);
    return NextResponse.json({ files: results }, { status: 200 });
  } catch (err: any) {
    console.error('[api/upload] Error:', err?.message, err?.stack || '');
    return NextResponse.json({ error: err?.message || 'Upload failed', details: err?.message }, { status: 500 });
  }
}