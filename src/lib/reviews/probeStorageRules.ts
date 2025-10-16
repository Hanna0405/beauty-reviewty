import { auth, storage } from '@/lib/firebaseClient';
import { ref, uploadString } from 'firebase/storage';

export async function probeStorageRules() {
  const uid = auth.currentUser?.uid ?? '(no-auth)';
  const path = `reviews/${uid}/__probe_${Date.now()}.txt`;
  try {
    await uploadString(ref(storage, path), 'ok');
    console.log('[BR] Probe OK → write allowed', { path });
  } catch (e) {
    console.error('[BR] Probe FAIL', { uid, path }, e);
  }
}
