'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import EnvProbe from '@/components/EnvProbe';
import { auth } from '@/lib/firebase.client';

export default function LoginPage() {
 const router = useRouter();
 const [form, setForm] = useState({ email: '', password: '' });
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState<string | null>(null);
 const [showPwd, setShowPwd] = useState(false);

 const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const { name, value } = e.target;
 setForm((f) => ({ ...f, [name]: value }));
 };

 const onSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setErr(null);
 setLoading(true);
 try {
 await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
 router.push('/');
 } catch (e: any) {
 setErr(e?.message ?? 'Login failed');
 } finally {
 setLoading(false);
 }
 };

 return (
 <>
 <EnvProbe />
 <div className="min-h-[calc(100dvh-64px)] bg-gradient-to-b from-pink-500 via-pink-500 to-pink-600 flex items-center justify-center px-4 py-10">
 <div className="w-full max-w-md">
 <div className="rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur p-6 sm:p-8">
 <h1 className="text-2xl font-semibold text-center mb-1">Log in</h1>
 <p className="text-center text-gray-500 mb-6">Welcome back </p>

 <form onSubmit={onSubmit} className="space-y-4">
 <div className="space-y-1.5">
 <label className="block text-sm font-medium text-gray-700">Email</label>
 <input
 name="email"
 type="email"
 autoComplete="email"
 required
 value={form.email}
 onChange={onChange}
 className="w-full rounded-lg border-gray-300 focus:border-pink-500 focus:ring-pink-500 p-2.5"
 placeholder="you@example.com"
 />
 </div>

 <div className="space-y-1.5">
 <label className="block text-sm font-medium text-gray-700">Password</label>
 <div className="relative">
 <input
 name="password"
 type={showPwd ? 'text' : 'password'}
 autoComplete="current-password"
 required
 value={form.password}
 onChange={onChange}
 className="w-full rounded-lg border-gray-300 focus:border-pink-500 focus:ring-pink-500 p-2.5 pr-10"
 placeholder="••••••••"
 />
 <button
 type="button"
 onClick={() => setShowPwd((v) => !v)}
 className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
 aria-label={showPwd ? 'Hide password' : 'Show password'}
 >
 {showPwd ? '🙈' : '👁️'}
 </button>
 </div>
 </div>

 {err && <div className="text-sm text-red-600">{err}</div>}

 <button
 type="submit"
 disabled={loading}
 className="w-full rounded-lg bg-pink-600 text-white py-2.5 font-medium hover:bg-pink-700 disabled:opacity-60 transition"
 >
 {loading ? 'Logging in…' : 'Log in'}
 </button>
 </form>

 <div className="mt-5 text-center text-sm text-gray-600">
 Don't have an account?{' '}
 <Link href="/auth/signup" className="font-medium text-pink-600 hover:text-pink-700">
 Sign up
 </Link>
 </div>

 <div className="mt-2 text-center text-sm">
 <Link href="/auth/forgot-password" className="text-gray-500 hover:text-gray-700">
 Forgot password?
 </Link>
 </div>
 </div>
 </div>
 </div>
 </>
 );
}