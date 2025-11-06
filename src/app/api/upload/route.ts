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
