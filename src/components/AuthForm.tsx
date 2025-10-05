"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext'; // <-- named import
import { registerUser } from "@/lib/auth/registerUser";
import { ensureUserDoc } from "@/lib/users";
import { Field } from "@/components/auth/Field";

const PENDING_ROLE_KEY = "BR_pendingRole";

type Mode = "signup" | "login";
type Variant = "full" | "emailOnly";

export default function AuthForm({ mode, variant = "full" }: { mode: Mode; variant?: Variant }) {
 const router = useRouter();
 const search = useSearchParams();
 const { user, loading } = useAuth(); // <-- will be a function returning {user, loading}

 const [tab, setTab] = useState<'email' | 'phone'>('email');
 const [pending, setPending] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const auth = getAuth(app);

 // shared
 const [fullName, setFullName] = useState("");
 const [role, setRole] = useState<"client" | "master">("client");

 // email
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirm, setConfirm] = useState("");

 async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 setError(null);
 setPending(true);
 const form = new FormData(e.currentTarget);
 const email = String(form.get('email') || '').trim();
 const password = String(form.get('password') || '');

 try {
 if (mode === "register") {
 await createUserWithEmailAndPassword(auth, email, password);
 } else {
 await signInWithEmailAndPassword(auth, email, password);
 }
 const ret = search?.get('returnTo') || '/';
 router.push(ret);
 } catch (err: any) {
 setError(err?.message || 'Authentication error');
 } finally {
 setPending(false);
 }
 }

 if (loading) return null;
 if (user) {
 const ret = search?.get('returnTo') || '/';
 router.replace(ret);
 return null;
 }

 return (
 <div className="space-y-5">
 {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

 {/* EMAIL FORM */}
 <form className="space-y-3" onSubmit={handleEmailSubmit}>
 {mode==="signup" && (
 <Field 
 label="Full Name *" 
 value={fullName} 
 onChange={(e)=>setFullName(e.target.value)} 
 required 
 />
 )}
 <Field 
 label="Email address *" 
 type="email" 
 name="email"
 value={email} 
 onChange={(e)=>setEmail(e.target.value)} 
 required 
 />
 <Field 
 label="Password *" 
 type="password" 
 name="password"
 value={password} 
 onChange={(e)=>setPassword(e.target.value)} 
 required 
 />
 {mode==="signup" && (
 <Field 
 label="Confirm Password *" 
 type="password" 
 value={confirm} 
 onChange={(e)=>setConfirm(e.target.value)} 
 required 
 />
 )}
 {mode==="signup" && (
 <div className="mb-4">
 <span className="block text-sm font-medium text-gray-700 mb-1">I am a *</span>
 <div className="flex gap-3">
 <label className="inline-flex items-center gap-2 text-sm">
 <input type="radio" name="role" className="accent-pink-500" checked={role==="client"} onChange={() => setRole("client")} />
 Client
 </label>
 <label className="inline-flex items-center gap-2 text-sm">
 <input type="radio" name="role" className="accent-pink-500" checked={role==="master"} onChange={() => setRole("master")} />
 Master
 </label>
 </div>
 </div>
 )}
 <button 
 type="submit"
 disabled={pending} 
 className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white font-semibold px-3 py-2 disabled:opacity-60"
 >
 {mode==="signup"?"Create account":"Sign in"}
 </button>
 </form>

 </div>
 );
}