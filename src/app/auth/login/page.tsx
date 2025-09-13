"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
 const router = useRouter();
 const [form, setForm] = useState({ email: "", password: "" });
 const [err, setErr] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);

 const canSubmit = /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6;

 async function onSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!canSubmit) return setErr("Email or password is invalid");
 setErr(null); setLoading(true);
 try {
 await signInWithEmailAndPassword(auth, form.email, form.password);
 router.push("/profile");
 } catch (e:any) {
 setErr(e?.message || "Login failed");
 } finally { setLoading(false); }
 }

 return (
 <div className="min-h-[80vh] w-full bg-gradient-to-b from-pink-500 to-fuchsia-600 py-10">
 <div className="mx-auto w-full max-w-lg rounded-2xl bg-white/95 p-8 shadow-xl">
 <div className="mb-6 text-center">
 <h1 className="text-2xl font-bold text-gray-900">Log in</h1>
 </div>

 <form onSubmit={onSubmit} className="space-y-4">
 <input className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
 placeholder="Email" type="email" value={form.email}
 onChange={e=>setForm(s=>({...s, email:e.target.value}))} required />
 <input className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
 placeholder="Password" type="password" value={form.password}
 onChange={e=>setForm(s=>({...s, password:e.target.value}))} required />

 {err && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

 <button disabled={!canSubmit || loading}
 className="w-full rounded-md bg-pink-600 px-4 py-2.5 font-semibold text-white hover:bg-pink-700 disabled:opacity-60">
 {loading ? "Signing in..." : "Log in"}
 </button>
 </form>

 <p className="mt-4 text-center text-sm text-gray-600">
 No account?{" "}
 <Link href="/auth/signup" className="font-medium text-pink-600 hover:underline">Sign up</Link>
 </p>
 </div>
 </div>
 );
}