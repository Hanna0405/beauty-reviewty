'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
// Если у тебя alias "@/lib/..." работает — используй его.
// Иначе оставь относительный путь, как ниже:
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginDialog() {
 const [open, setOpen] = useState(false);
 const [email, setEmail] = useState('');
 const [pass, setPass] = useState('');
 const [err, setErr] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);

 const handleEmailLogin = async () => {
 if (!auth) {
 setErr('Authentication is not configured. Please check Firebase settings.');
 return;
 }
 try {
 setLoading(true);
 setErr(null);
 await signInWithEmailAndPassword(auth, email.trim(), pass);
 setOpen(false);
 } catch (e: any) {
 setErr(e?.message ?? 'Login error');
 } finally {
 setLoading(false);
 }
 };

 const handleGoogleLogin = async () => {
 if (!auth || !googleProvider) {
 setErr('Authentication is not configured. Please check Firebase settings.');
 return;
 }
 try {
 setLoading(true);
 setErr(null);
 await signInWithPopup(auth, googleProvider);
 setOpen(false);
 } catch (e: any) {
 setErr(e?.message ?? 'Google login error');
 } finally {
 setLoading(false);
 }
 };

 return (
 <>
 {/* Кнопка открытия диалога */}
 <button
 onClick={() => setOpen(true)}
 className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
 >
 Log in
 </button>

 {/* Модалка */}
 {open && (
 <div
 className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
 onClick={() => setOpen(false)}
 >
 <div
 className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="mb-3 text-lg font-semibold">Log in</div>

 <label className="mb-2 block text-sm">
 <span className="mb-1 block">Email</span>
 <input
 className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 />
 </label>

 <label className="mb-4 block text-sm">
 <span className="mb-1 block">Password</span>
 <input
 className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500"
 type="password"
 value={pass}
 onChange={(e) => setPass(e.target.value)}
 />
 </label>

 <button
 onClick={handleEmailLogin}
 disabled={loading}
 className="w-full rounded bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
 >
 {loading ? 'Loading…' : 'Login with Email'}
 </button>

 <button
 onClick={handleGoogleLogin}
 disabled={loading}
 className="mt-2 w-full rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-900 disabled:opacity-50"
 >
 {loading ? 'Loading…' : 'Login with Google'}
 </button>

 {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

 <button
 onClick={() => setOpen(false)}
 className="mt-4 w-full rounded border px-4 py-2 text-sm hover:bg-gray-50"
 >
 Close
 </button>
 </div>
 </div>
 )}
 </>
 );
}
