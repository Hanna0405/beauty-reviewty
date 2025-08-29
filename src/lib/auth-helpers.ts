// src/lib/auth-helpers.ts
// ------------------------------------------------------------
// Хелперы для авторизации, профиля пользователя и загрузки фото
// ------------------------------------------------------------

import { auth, db, storage } from '@/lib/firebase';
import {
 createUserWithEmailAndPassword,
 signInWithEmailAndPassword,
 signInWithPopup,
 updateProfile,
 GoogleAuthProvider,
 signOut as fbSignOut,
 User,
} from 'firebase/auth';
import {
 doc,
 getDoc,
 setDoc,
 updateDoc,
 serverTimestamp,
 Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import type { UserDoc, UserRole } from '@/types';

// ------------------------------------------------------------
// Утилита: убрать все поля со значением undefined
// (Firestore не принимает undefined в документах)
// ------------------------------------------------------------
function pruneUndefined<T extends Record<string, any>>(obj: T): T {
 const out: any = {};
 for (const k in obj) {
 const v = obj[k];
 if (v !== undefined) out[k] = v;
 }
 return out as T;
}

// ------------------------------------------------------------
// Санитайзер payload для /users
// (совместимость: если пришло name -> кладём в displayName)
// ------------------------------------------------------------
function sanitizeUserDefaults(d: Partial<UserDoc> & { name?: string }): Partial<UserDoc> {
 const clone: any = { ...d };
 delete clone.uid; // uid — это id документа, не поле

 return pruneUndefined({
 displayName: clone.displayName ?? clone.name ?? '',
 photoURL: clone.photoURL ?? '',
 email: clone.email, // если undefined — будет удалено pruneUndefined’ом
 phone: clone.phone,
 city: clone.city,
 role: clone.role ?? 'client',
 });
}

// ------------------------------------------------------------
// Тип результата ensureUserDoc
// ------------------------------------------------------------
export type EnsureUserDocResult =
 | { exists: true; data: UserDoc }
 | { exists: false; data: UserDoc };

// ------------------------------------------------------------
// Создать/обновить документ пользователя /users/{uid}
// ------------------------------------------------------------
export async function ensureUserDoc(
 uid: string,
 defaults: Partial<UserDoc> & { name?: string } = {}
): Promise<EnsureUserDocResult> {
 const userRef = doc(db, 'users', uid);
 const snap = await getDoc(userRef);

 if (!snap.exists()) {
 const payload: Partial<UserDoc> & { createdAt: Timestamp | any } = pruneUndefined({
 ...sanitizeUserDefaults(defaults),
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 });
 await setDoc(userRef, payload, { merge: true });

 const created = await getDoc(userRef);
 return { exists: false, data: created.data() as UserDoc };
 }

 if (defaults && Object.keys(defaults).length) {
 await updateDoc(
 userRef,
 pruneUndefined({
 ...sanitizeUserDefaults(defaults),
 updatedAt: serverTimestamp(),
 })
 );
 }

 const current = await getDoc(userRef);
 return { exists: true, data: current.data() as UserDoc };
}

// ------------------------------------------------------------
// Получить роль пользователя
// ------------------------------------------------------------
export async function getUserRole(uid: string): Promise<UserRole | null> {
 const snap = await getDoc(doc(db, 'users', uid));
 if (!snap.exists()) return null;
 return (snap.data().role as UserRole) ?? null;
}

// ------------------------------------------------------------
// Email/Password: Sign Up (с записью роли в /users)
// ------------------------------------------------------------
export async function signUpEmailPassword(
 email: string,
 password: string,
 role: UserRole,
 displayName?: string
): Promise<User> {
 const cred = await createUserWithEmailAndPassword(auth, email, password);

 if (displayName) {
 await updateProfile(cred.user, { displayName });
 }

 await ensureUserDoc(cred.user.uid, {
 role,
 displayName: cred.user.displayName ?? displayName ?? '',
 photoURL: cred.user.photoURL ?? '',
 email: cred.user.email ?? email,
 });

 return cred.user;
}

// ------------------------------------------------------------
// Email/Password: Sign In
// ------------------------------------------------------------
export async function signInEmailPassword(email: string, password: string): Promise<User> {
 const cred = await signInWithEmailAndPassword(auth, email, password);
 return cred.user;
}

// ------------------------------------------------------------
// Google: Sign In/Up. Если пользователь новый — присваиваем роль.
// ------------------------------------------------------------
export async function signInWithGoogle(roleIfNew?: UserRole): Promise<User> {
 const provider = new GoogleAuthProvider();
 provider.setCustomParameters({ prompt: 'select_account' });

 const cred = await signInWithPopup(auth, provider);

 await ensureUserDoc(cred.user.uid, {
 role: roleIfNew, // если undefined — существующую роль не трогаем
 displayName: cred.user.displayName ?? '',
 photoURL: cred.user.photoURL ?? '',
 email: cred.user.email ?? undefined,
 });

 return cred.user;
}

// ------------------------------------------------------------
// Sign Out
// ------------------------------------------------------------
export async function signOut(): Promise<void> {
 await fbSignOut(auth);
}

// ------------------------------------------------------------
// Загрузка файлов в Firebase Storage и получение downloadURL’ов
// ------------------------------------------------------------
export async function uploadFilesAndGetURLs(
 files: File[],
 pathPrefix: string // например: `profiles/{profileId}/gallery` или `reviews/{uid}`
): Promise<string[]> {
 const uploads = files.map((file) => {
 return new Promise<string>((resolve, reject) => {
 const uid = Math.random().toString(36).slice(2);
 const storageRef = ref(storage, `${pathPrefix}/${uid}-${file.name}`);
 const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

 task.on(
 'state_changed',
 () => {},
 (err) => reject(err),
 async () => {
 const url = await getDownloadURL(storageRef);
 resolve(url);
 }
 );
 });
 });

 return Promise.all(uploads);
}