import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { getFirebaseAdmin, adminBucket } from '@/lib/firebase/admin';

function err(message: string, status = 400) {
  if (process.env.DEBUG_FIREBASE_ADMIN === '1') console.error('[upload] error:', message);
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function getUidFromRequest(req: Request) {
  const admin = getFirebaseAdmin();
  if (!admin) return null;
  const { auth } = admin;
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const decoded = await auth.verifyIdToken(token);
  return decoded.uid as string;
}

function normalizeStoragePath(input: string): string {
  let raw = input.trim();
  if (!raw) return '';

  // If caller passes an encoded value, decode once safely.
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // keep original raw if decoding fails
  }

  // Handle full public URLs:
  // https://storage.googleapis.com/<bucket>/<path>
  // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?...
  try {
    const url = new URL(raw);
    if (url.hostname === 'storage.googleapis.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        raw = parts.slice(1).join('/');
      }
    } else if (url.hostname === 'firebasestorage.googleapis.com') {
      const marker = '/o/';
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        raw = url.pathname.slice(idx + marker.length);
      }
    }
  } catch {
    // not a URL, continue
  }

  // Handle gs://bucket/path
  if (raw.startsWith('gs://')) {
    const withoutScheme = raw.slice('gs://'.length);
    const slash = withoutScheme.indexOf('/');
    raw = slash >= 0 ? withoutScheme.slice(slash + 1) : '';
  }

  // Normalize leading/trailing slashes and guard traversal.
  raw = raw.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!raw || raw.includes('..')) return '';
  return raw;
}

export async function POST(req: Request) {
  let objectPath = '';
  let bucket: any = null;
  try {
    const uid = await getUidFromRequest(req);
    if (!uid) return err('Unauthorized: no or invalid ID token', 401);

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const scope = (form.get('scope') as string | null)?.toLowerCase() || 'listing'; // 'profile' | 'listing'
    const id = (form.get('id') as string | null) || '';
    const dir = (form.get('dir') as string | null) || '';

    if (!file) return err('No file');

    // Check for bucket configuration before proceeding
    bucket = adminBucket();
    if (!bucket?.name) {
      return NextResponse.json(
        {
          error: 'STORAGE_NOT_CONFIGURED',
          message: 'Firebase Storage bucket is not configured. Enable Storage in Firebase Console for this project and set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.',
        },
        { status: 500 }
      );
    }

    console.log(`[upload] using bucket: ${bucket.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || 'application/octet-stream';

    // sanitize name and build allowed path
    const cleanName = (file.name || `file-${Date.now()}`).replace(/[^\w.\-]+/g, '_');
    let base: string;
    if (scope === 'profile') {
      base = `profiles/${uid}`;
    } else if (dir === 'reviews') {
      // For review photos, use a dedicated path structure
      base = `reviews/${uid}/${Date.now()}`;
    } else {
      base = id ? `listings/${uid}/${id}` : `listings/${uid}`;
    }
    objectPath = `${base}/${cleanName}`;

    const fileRef = bucket.file(objectPath);
    await fileRef.save(buffer, { contentType, resumable: false });

    // For profile avatars, use a consistent path and get public download URL
    if (scope === 'profile') {
      // Override path to use consistent avatar path
      const avatarPath = `profiles/${uid}/avatar.jpg`;
      const avatarRef = bucket.file(avatarPath);
      await avatarRef.save(buffer, { contentType, resumable: false });
      
      // Make the file publicly accessible
      await avatarRef.makePublic();
      
      // Get the public download URL
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${avatarPath}`;
      
      return NextResponse.json({
        ok: true,
        bucket: bucket.name,
        path: avatarPath,
        url: downloadURL,
        contentType,
      });
    }

    // For review photos, make them publicly accessible and return permanent URLs
    if (dir === 'reviews') {
      // Make the file publicly accessible
      await fileRef.makePublic();
      
      // Get the public download URL
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
      
      return NextResponse.json({
        ok: true,
        bucket: bucket.name,
        path: objectPath,
        url: downloadURL,
        contentType,
      });
    }

    // For other files, use signed URLs
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      ok: true,
      bucket: bucket.name,
      path: objectPath,
      url: signedUrl,
      contentType,
    });
  } catch (err: any) {
    console.error('[upload error]', err);
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || String(err),
        stack: err?.stack,
        bucket: bucket?.name,
        path: objectPath || undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const inputPath = url.searchParams.get('path') || '';
    if (!inputPath.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Missing required query parameter: path' },
        { status: 400 }
      );
    }

    const objectPath = normalizeStoragePath(inputPath);
    if (!objectPath) {
      return NextResponse.json(
        { ok: false, error: 'Invalid path parameter' },
        { status: 400 }
      );
    }

    const bucket = adminBucket();
    if (!bucket?.name) {
      console.warn('[upload][delete] storage bucket not configured');
      // Keep delete non-blocking for parent flow.
      return NextResponse.json({ success: true });
    }

    try {
      await bucket.file(objectPath).delete({ ignoreNotFound: true });
    } catch (error) {
      // Do not block listing deletion if the file is already gone or delete fails.
      console.warn('[upload][delete] delete warning:', objectPath, error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn('[upload][delete] unexpected warning:', error);
    // Non-blocking response to avoid breaking parent delete flow.
    return NextResponse.json({ success: true });
  }
}
