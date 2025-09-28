"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase.client";

type Role = "master" | "client";

export default function SignupPage() {
 const router = useRouter();
 const [form, setForm] = useState({ displayName: "", email: "", password: "", role: "master" as Role });
 const [err, setErr] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);

 const canSubmit = form.displayName.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6;

 async function onSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!canSubmit) return setErr("Please fill all fields correctly");
 setErr(null); setLoading(true);
 try {
 if (!auth) {
 throw new Error("Auth is not initialized");
 }
 if (!db) {
 throw new Error("Database is not initialized");
 }
 const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
 if (form.displayName) await updateProfile(cred.user, { displayName: form.displayName });
 await setDoc(doc(db, "users", cred.user.uid), {
 uid: cred.user.uid,
 email: cred.user.email,
 displayName: form.displayName || "",
 role: (form.role === "client" || form.role === "master") ? form.role : "master",
 avatarUrl: null,
 city: "",
 services: [],
 languages: [],
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 }, { merge: true });
 router.push("/profile");
 } catch (e:any) {
 setErr(e?.message || "Signup failed");
 } finally { setLoading(false); }
 }

 return (
 <div className="min-h-[80vh] w-full bg-gradient-to-b from-pink-500 to-fuchsia-600 py-10">
 <div className="mx-auto w-full max-w-lg rounded-2xl bg-white/95 p-8 shadow-xl">
 <div className="mb-6 text-center">
 <h1 className="text-2xl font-bold text-gray-900">Sign up</h1>
 </div>

 <form onSubmit={onSubmit} className="space-y-4">
 <fieldset className="space-y-2">
 <legend className="text-sm font-medium text-gray-700">I am:</legend>
 <div className="flex items-center gap-4">
 <label className="flex items-center gap-2 text-sm">
 <input type="radio" name="role" value="client"
 checked={form.role === "client"} onChange={() => setForm(s=>({...s, role:"client"}))} />
 Client
 </label>
 <label className="flex items-center gap-2 text-sm">
 <input type="radio" name="role" value="master"
 checked={form.role === "master"} onChange={() => setForm(s=>({...s, role:"master"}))} />
 Master
 </label>
 </div>
 </fieldset>

 <input className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
 placeholder="Name" value={form.displayName}
 onChange={e=>setForm(s=>({...s, displayName:e.target.value}))} required />
 <input className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
 placeholder="Email" type="email" value={form.email}
 onChange={e=>setForm(s=>({...s, email:e.target.value}))} required />
 <input className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
 placeholder="Password (6+ chars)" type="password" value={form.password}
 onChange={e=>setForm(s=>({...s, password:e.target.value}))} required />

 {err && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

 <button disabled={!canSubmit || loading}
 className="w-full rounded-md bg-pink-600 px-4 py-2.5 font-semibold text-white hover:bg-pink-700 disabled:opacity-60">
 {loading ? "Creating..." : "Create account"}
 </button>
 </form>

 <p className="mt-4 text-center text-sm text-gray-600">
 Already have an account?{" "}
 <Link href="/auth/login" className="font-medium text-pink-600 hover:underline">Log in</Link>
 </p>
 </div>
 </div>
 );
}