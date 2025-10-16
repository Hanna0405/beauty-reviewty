import { auth, storage } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadReviewPhotos(files: File[], opts?: { masterId?: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const urls: string[] = [];
  for (const file of (files ?? []).slice(0, 3)) {
    const safe = (file.name || 'photo').replace(/[^\w.-]+/g, '_');
    // Путь совместим с правилами из п.1
    const parts = ['reviews'];
    if (opts?.masterId) parts.push(opts.masterId);
    parts.push(user.uid, `${Date.now()}_${safe}`);
    const fullPath = parts.join('/');

    const snap = await uploadBytes(ref(storage, fullPath), file, {
      // мягко проставляем тип; правила его не требуют, чтобы HEIC не резалось
      contentType: file.type || undefined,
    });
    const url = await getDownloadURL(snap.ref);
    urls.push(url);
  }
  return urls;
}
