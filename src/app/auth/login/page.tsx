'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { auth, db } from '@/lib/firebase';
import {
GoogleAuthProvider,
signInWithEmailAndPassword,
signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import type { UserDoc, UserRole } from '@/types';

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const [loading, setLoading] = useState(false);
const [err, setErr] = useState<string>('');

// 🔹 Редирект по роли пользователя
async function redirectByRole(uid: string, fallback?: UserRole | null) {
const ref = doc(db, 'users', uid);
const snap = await getDoc(ref);

// допускаем отсутствие роли (undefined) и приводим к UserRole | null
let userRole: UserRole | null = fallback ?? null;
if (snap.exists()) {
const data = snap.data() as Partial<UserDoc>;
userRole = (data.role ?? null) as UserRole | null;
}

if (userRole === 'master') {
router.push('/dashboard');
} else {
router.push('/masters');
}
}

async function onEmailLogin(e: React.FormEvent) {
e.preventDefault();
setErr('');
setLoading(true);
try {
const cred = await signInWithEmailAndPassword(
auth,
email.trim(),
password
);
await redirectByRole(cred.user.uid);
} catch (e: any) {
setErr(e.message ?? 'Login error');
} finally {
setLoading(false);
}
}

async function onGoogle() {
setErr('');
setLoading(true);
try {
const cred = await signInWithPopup(auth, new GoogleAuthProvider());
await redirectByRole(cred.user.uid);
} catch (e: any) {
setErr(e.message ?? 'Google login error');
} finally {
setLoading(false);
}
}

return (
<div className="max-w-md mx-auto p-6">
<h1 className="text-2xl font-semibold mb-4">Log in</h1>

<form onSubmit={onEmailLogin} className="space-y-3">
<input
required
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
placeholder="Email"
className="w-full border rounded px-3 py-2"
/>
<input
required
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
placeholder="Password"
className="w-full border rounded px-3 py-2"
/>

{err && <p className="text-red-600 text-sm">{err}</p>}

<button
type="submit"
disabled={loading}
className="w-full py-2 rounded bg-black text-white"
>
{loading ? 'Signing in…' : 'Log in'}
</button>
</form>

<button
onClick={onGoogle}
disabled={loading}
className="w-full py-2 rounded border mt-3"
>
Sign in with Google
</button>

<Link href="/auth/signup" className="block text-center underline mt-3">
Don’t have an account? Sign up
</Link>
</div>
);
}
