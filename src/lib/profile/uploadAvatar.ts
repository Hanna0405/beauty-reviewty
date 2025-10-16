import { auth, storage } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function uploadAvatar(file: File) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const db = getFirestore();

  // stable path for avatar
  const avatarRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);

  // upload; set contentType softly (HEIC may come as octet-stream)
  const snap = await uploadBytes(avatarRef, file, {
    contentType: file.type || undefined,
  });
  const url = await getDownloadURL(snap.ref);

  // persist into users/{uid}
  await updateDoc(doc(db, 'users', user.uid), {
    avatarUrl: url,
    avatarUpdatedAt: serverTimestamp(),
  });

  return url;
}
