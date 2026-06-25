import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/client';

export async function signInEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}
