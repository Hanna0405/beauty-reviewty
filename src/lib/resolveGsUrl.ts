import { storage } from '@/lib/firebaseClient';
import { getDownloadURL, ref } from 'firebase/storage';

export async function resolveGsUrl(gsPath: string): Promise<string | null> {
  try {
    if (!gsPath || !gsPath.startsWith('gs://')) return null;
    const r = ref(storage, gsPath.replace(/^gs:\/\/[^/]+\//, '')); // strip bucket, keep object path
    return await getDownloadURL(r);
  } catch (e) {
    console.warn('[images] Failed to resolve gs:// url', gsPath, e);
    return null;
  }
}
