'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
signUpEmailPassword,
signInEmailPassword,
signInWithGoogle,
getUserRole,
} from '@/lib/auth-helpers';
import type { UserRole } from '@/types';

export default function AuthPage() {
const router = useRouter();

const [mode, setMode] = useState<'signup' | 'login'>('signup');
const [role, setRole] = useState<UserRole>('client');

const [email, setEmail] = useState('');
const [name, setName] = useState('');
const [password, setPassword] = useState('');
const [busy, setBusy] = useState(false);
const [err, setErr] = useState<string | null>(null);

const goToDashboard = (r: UserRole | null) => {
if (r === 'master') router.replace('/dashboard/master');
else router.replace('/dashboard/client');
};

async function handleEmailSubmit(e: React.FormEvent) {
e.preventDefault();
setBusy(true);
setErr(null);
try {
if (mode === 'signup') {
const user = await signUpEmailPassword(email.trim(), password, role, name.trim());
goToDashboard(role);
} else {
const user = await signInEmailPassword(email.trim(), password);
const r = await getUserRole(user.uid);
goToDashboard(r ?? 'client');
}
} catch (e: any) {
setErr(e.message ?? 'Something went wrong');
} finally {
setBusy(false);
}
}

async function handleGoogle() {
setBusy(true);
setErr(null);
try {
const user = await signInWithGoogle(mode === 'signup' ? role : undefined);
const r = await getUserRole(user.uid);
goToDashboard(r ?? (mode === 'signup' ? role : 'client'));
} catch (e: any) {
setErr(e.message ?? 'Google sign-in failed');
} finally {
setBusy(false);
}
}

return (
<div className="mx-auto max-w-md p-6">
<h1 className="text-2xl font-bold mb-4">
{mode === 'signup' ? 'Create account' : 'Log in'}
</h1>

<div className="flex gap-2 mb-4">
<button
className={`px-3 py-1 border rounded ${mode === 'signup' ? 'font-semibold' : ''}`}
onClick={() => setMode('signup')}
>
Sign up
</button>
<button
className={`px-3 py-1 border rounded ${mode === 'login' ? 'font-semibold' : ''}`}
onClick={() => setMode('login')}
>
Log in
</button>
</div>

{mode === 'signup' && (
<div className="mb-4">
<label className="block text-sm font-medium mb-1">I am:</label>
<div className="flex gap-3">
<label className="flex items-center gap-2 cursor-pointer">
<input
type="radio"
name="role"
value="client"
checked={role === 'client'}
onChange={() => setRole('client')}
/>
<span>Client</span>
</label>
<label className="flex items-center gap-2 cursor-pointer">
<input
type="radio"
name="role"
value="master"
checked={role === 'master'}
onChange={() => setRole('master')}
/>
<span>Master</span>
</label>
</div>
</div>
)}

<form onSubmit={handleEmailSubmit} className="grid gap-3">
{mode === 'signup' && (
<div>
<label className="block text-sm font-medium">Name</label>
<input
className="w-full border rounded px-3 py-2"
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="Your name"
required
/>
</div>
)}

<div>
<label className="block text-sm font-medium">Email</label>
<input
type="email"
className="w-full border rounded px-3 py-2"
value={email}
onChange={(e) => setEmail(e.target.value)}
placeholder="you@example.com"
required
/>
</div>

<div>
<label className="block text-sm font-medium">Password</label>
<input
type="password"
className="w-full border rounded px-3 py-2"
value={password}
onChange={(e) => setPassword(e.target.value)}
minLength={6}
required
/>
</div>

{err && <p className="text-red-600 text-sm">{err}</p>}

<button
type="submit"
disabled={busy}
className="mt-2 w-full border rounded px-3 py-2 font-semibold"
>
{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
</button>
</form>

<div className="my-4 text-center text-sm text-gray-500">or</div>

<button onClick={handleGoogle} disabled={busy} className="w-full border rounded px-3 py-2">
{busy ? 'Please wait…' : 'Continue with Google'}
</button>
</div>
);
}