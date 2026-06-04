import { signInWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase/client';
import { signInWithGoogleCompatible } from './auth/googleSignIn';

const googleProvider = new GoogleAuthProvider();

export async function signInEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const result = await signInWithGoogleCompatible(auth, googleProvider);
  if (result.kind === 'redirect-started') return null;
  return result.credential;
}
