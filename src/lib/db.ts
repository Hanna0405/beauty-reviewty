import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

export function masterDocRef(uid: string) {
  return doc(db, "masters", uid);
}

export async function loadMyProfile() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const snap = await getDoc(masterDocRef(user.uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveMyProfile(data: any) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  
  // Read existing document to preserve role
  const existingDoc = await getDoc(masterDocRef(user.uid));
  const existingData = existingDoc.exists() ? existingDoc.data() : {};
  
  // Always write to /masters/{uid}
  await setDoc(
    masterDocRef(user.uid),
    {
      ...existingData, // Preserve existing data including role
      ...data, // Apply new data
      uid: user.uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function uploadAvatar(file: File) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const key = `profiles/${user.uid}/avatar.jpg`;
  const r = ref(storage, key);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}
