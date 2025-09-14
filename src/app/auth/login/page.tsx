'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export default function LoginPage() {
 const router = useRouter();
 const [form, setForm] = useState({ email: '', password: '' });
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState<string | null>(null);

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
 router.push('/profile');
 } catch (e: any) {
 setErr(e?.message ?? 'Login failed');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="mx-auto max-w-md p-6">
 <h1 className="text-2xl font-semibold mb-4">Login</h1>
 <form onSubmit={onSubmit} className="space-y-4">
 <input name="email" type="email" required value={form.email} onChange={onChange} placeholder="Email" className="w-full rounded border p-2" />
 <input name="password" type="password" required value={form.password} onChange={onChange} placeholder="Password" className="w-full rounded border p-2" />
 {err && <p className="text-red-600 text-sm">{err}</p>}
 <button type="submit" disabled={loading} className="w-full rounded bg-black text-white py-2">
 {loading ? 'Signing in…' : 'Sign in'}
 </button>
 </form>
 </div>
 );
}