'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import {
createUserWithEmailAndPassword,
signInWithPopup,
GoogleAuthProvider,
updateProfile,
} from 'firebase/auth';
import { ensureUserDoc } from '@/lib/auth-helpers';
import type { UserRole } from '@/types'; // <-- важный импорт

export default function SignupPage() {
const router = useRouter();

// было '' — из-за этого ругался TS. Делаем null.
const [role, setRole] = useState<UserRole | null>(null);
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [err, setErr] = useState('');

function requireRole(r: UserRole | null): r is UserRole {
if (!r) {
setErr('Please choose a role (Client or Master).');
return false;
}
return true;
}

async function onEmailSignup(e: React.FormEvent) {
e.preventDefault();
setErr('');
if (!requireRole(role)) return;

setLoading(true);
try {
const cred = await createUserWithEmailAndPassword(
auth,
email.trim(),
password
);

if (name.trim()) {
await updateProfile(cred.user, { displayName: name.trim() });
}

await ensureUserDoc(cred.user.uid, {
role, // тип — строго UserRole
name: name.trim() || cred.user.displayName || '',
});

router.push('/');
} catch (e: any) {
setErr(e?.message ?? 'Signup error');
} finally {
setLoading(false);
}
}

async function onGoogle() {
setErr('');
if (!requireRole(role)) return;

setLoading(true);
try {
const cred = await signInWithPopup(auth, new GoogleAuthProvider());

await ensureUserDoc(cred.user.uid, {
role,
name: cred.user.displayName || '',
});

router.push('/');
} catch (e: any) {
setErr(e?.message ?? 'Google signup error');
} finally {
setLoading(false);
}
}

return (
<div className="max-w-md mx-auto p-6">
<h1 className="text-2xl font-semibold mb-4">Sign up</h1>

{/* Role */}
<div className="mb-4">
<p className="mb-2 font-medium">I am:</p>
<div className="flex gap-4">
<label className="flex items-center gap-2">
<input
type="radio"
name="role"
value="client"
checked={role === 'client'}
onChange={() => setRole('client')}
/>
<span>Client</span>
</label>
<label className="flex items-center gap-2">
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

{/* Email form */}
<form onSubmit={onEmailSignup} className="space-y-3">
<input
type="text"
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="Name"
className="w-full border rounded px-3 py-2"
/>
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
{loading ? 'Creating account…' : 'Create account'}
</button>
</form>

<button
onClick={onGoogle}
disabled={loading}
className="w-full py-2 rounded border mt-3"
>
Sign up with Google
</button>

<Link href="/auth/login" className="block text-center underline mt-3">
Already have an account? Log in
</Link>
</div>
);
}
