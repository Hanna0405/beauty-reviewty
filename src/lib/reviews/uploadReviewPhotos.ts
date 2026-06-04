import { auth, storage } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { prepareReviewPhotoFile } from '@/lib/images/prepareReviewPhoto';

export async function uploadReviewPhotos(files: File[], opts?: { masterId?: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const urls: string[] = [];
  for (const raw of (files ?? []).slice(0, 3)) {
    const file = await prepareReviewPhotoFile(raw);
    const safe = (file.name || 'photo').replace(/[^\w.-]+/g, '_');
    // Путь совместим с правилами из п.1
    const parts = ['reviews'];
    if (opts?.masterId) parts.push(opts.masterId);
    parts.push(user.uid, `${Date.now()}_${safe}`);
    const fullPath = parts.join('/');

    const snap = await uploadBytes(ref(storage, fullPath), file, {
      contentType: file.type || 'image/jpeg',
    });
    const url = await getDownloadURL(snap.ref);
    urls.push(url);
  }
  return urls;
}
