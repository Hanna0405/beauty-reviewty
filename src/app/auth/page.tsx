'use client';
import { useState } from 'react';
import { auth, googleProvider } from '../../lib/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string>('');

  async function doGoogle() {
    setErr('');
    try {
      await signInWithPopup(auth, googleProvider);
      alert('Signed in with Google!');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || String(e));
    }
  }

  async function doSignup() {
    setErr('');
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      alert('Account created!');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || String(e));
    }
  }

  async function doLogin() {
    setErr('');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      alert('Logged in!');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || String(e));
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Login / Sign up</h1>

      <button className="w-full border rounded p-2" onClick={doGoogle}>
        Sign in with Google
      </button>

      <input className="w-full border rounded p-2" placeholder="Email"
             value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input className="w-full border rounded p-2" placeholder="Password" type="password"
             value={pass} onChange={(e)=>setPass(e.target.value)} />

      <div className="flex gap-2">
        <button className="flex-1 border rounded p-2" onClick={doSignup}>Sign up</button>
        <button className="flex-1 border rounded p-2" onClick={doLogin}>Login</button>
      </div>

      <button className="w-full text-sm text-gray-600" onClick={()=>signOut(auth)}>
        Sign out
      </button>

      {err && <div className="text-red-600 text-sm whitespace-pre-wrap mt-2">{err}</div>}
    </div>
  );
}