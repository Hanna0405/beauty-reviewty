'use client';
import { ReactNode } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthUid } from '@/lib/useAuthUid';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { uid, loading } = useAuthUid();

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading session…</div>;
  }
  if (!uid) {
    return (
      <div className="p-6">
        <div className="mb-3 text-sm text-gray-700">Not signed in</div>
        <div className="flex gap-2">
          <button
            className="rounded border px-3 py-1.5 text-sm"
            onClick={async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { console.error(e); } }}>
            Sign in with Google
          </button>
          <button
            className="rounded border px-3 py-1.5 text-sm"
            onClick={async () => { try { await signInAnonymously(auth); } catch (e) { console.error(e); } }}>
            Continue anonymously (dev)
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
