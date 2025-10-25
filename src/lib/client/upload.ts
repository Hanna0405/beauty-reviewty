// lib/client/upload.ts
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { ensureAuth } from '@/lib/firebase/ensureAuth';

function safeFileName(file: File) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const base = (file.name.replace(/\.[^/.]+$/, '') || 'photo')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 40);
  return `${base}_${Date.now()}.${ext}`;
}

/**
 * Upload selected files to reviews/{uid}/... and return public URLs.
 * uid must be provided by caller (do not use getAuth() here to avoid hydration/race issues in dev).
 */
export async function uploadFilesGetUrls(files: FileList, uid: string): Promise<string[]> {
  if (!uid) throw new Error('No uid provided');
  
  // Ensure authentication before uploading
  await ensureAuth();
  
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    const path = `reviews/${uid}/${safeFileName(file)}`;
    const r = ref(storage, path);
    const snap = await uploadBytes(r, file, { contentType: file.type || 'image/jpeg' });
    urls.push(await getDownloadURL(snap.ref));
  }
  return urls;
}
