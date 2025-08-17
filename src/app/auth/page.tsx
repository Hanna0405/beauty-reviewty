'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth, googleProvider } from '@/lib/firebase';
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
  const [loading, setLoading] = useState(false);

  async function doGoogle() {
    setErr('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function doSignup() {
    setErr('');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function doLogin() {
    setErr('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function doLogout() {
    setErr('');
    setLoading(true);
    try {
      await signOut(auth);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Login / Sign up</h1>
          <p className="text-gray-500 mt-1 text-sm">
            or{' '}
            <Link href="/" className="text-pink-600 hover:underline">
              go back home
            </Link>
          </p>
        </div>

        <button
          onClick={doGoogle}
          disabled={loading}
          className="w-full mb-6 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.4 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.1-.1-2.1-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.3 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.4 6.1 28.9 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.2l-6.2-5.1C29 35.9 26.7 37 24 37c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.6-4.6 6-8.3 6-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.5 39.6 16.2 44 24 44c9.3 0 17.1-6.4 19.6-15.1.5-1.7.8-3.6.8-5.9 0-1.1-.1-2.1-.4-3.5z" />
          </svg>
          Sign in with Google
        </button>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={doSignup}
              disabled={loading}
              className="flex-1 rounded-lg bg-pink-600 text-white px-4 py-2 font-semibold shadow-md hover:bg-pink-700 transition disabled:opacity-60"
            >
              Sign up
            </button>
            <button
              onClick={doLogin}
              disabled={loading}
              className="flex-1 rounded-lg border px-4 py-2 font-semibold hover:bg-gray-50 transition disabled:opacity-60"
            >
              Login
            </button>
          </div>

          <button
            onClick={doLogout}
            disabled={loading}
            className="w-full text-gray-500 hover:text-gray-700 text-sm mt-2 disabled:opacity-60"
          >
            Sign out
          </button>

          {err && (
            <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
