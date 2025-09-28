"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase.client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "master" | "client";

export default function SignupPage() {
 const router = useRouter();
 const [form, setForm] = useState({
 displayName: "",
 email: "",
 password: "",
 confirmPassword: "",
 role: "master" as Role,
 });
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);

 const canSubmit =
 form.displayName.trim().length >= 2 &&
 /\S+@\S+\.\S+/.test(form.email) &&
 form.password.length >= 6 &&
 form.password === form.confirmPassword;

 async function handleSignup(e: React.FormEvent) {
 e.preventDefault();
 if (!canSubmit) {
 setError("Please fill all fields correctly");
 return;
 }
 setError(null);
 setLoading(true);
 try {
 if (!auth) {
 throw new Error("Auth is not initialized");
 }
 if (!db) {
 throw new Error("Database is not initialized");
 }
 const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
 if (form.displayName) {
 await updateProfile(cred.user, { displayName: form.displayName });
 }
 await setDoc(
 doc(db, "users", cred.user.uid),
 {
 uid: cred.user.uid,
 email: cred.user.email,
 displayName: form.displayName || "",
 role: (form.role === "client" || form.role === "master") ? form.role : "master",
 city: "",
 services: [],
 languages: [],
 avatarUrl: null,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 },
 { merge: true }
 );
 router.push("/profile"); // or "/profile/edit" if preferred
 } catch (err: any) {
 console.error(err);
 setError(err?.message ?? "Signup failed");
 } finally {
 setLoading(false);
 }
 }

 return (
 <div className="min-h-[80vh] w-full bg-gradient-to-b from-pink-500 to-fuchsia-600 py-10">
 <div className="mx-auto w-full max-w-lg rounded-2xl bg-white/95 p-8 shadow-xl">
 <div className="mb-6 text-center">
 <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
 <p className="mt-1 text-sm text-gray-600">
 Already have an account?{" "}
 <Link href="/auth/login" className="font-medium text-pink-600 hover:underline">
 Log in
 </Link>
 </p>
 </div>

 <form onSubmit={handleSignup} className="space-y-5">
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Display name</label>
 <input
 required
 value={form.displayName}
 onChange={(e) => setForm((s) => ({ ...s, displayName: e.target.value }))}
 placeholder="e.g. Masha"
 className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-pink-500 focus:border-pink-500 focus:ring-2"
 />
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
 <input
 required
 type="email"
 value={form.email}
 onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
 placeholder="you@example.com"
 className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-pink-500 focus:border-pink-500 focus:ring-2"
 />
 </div>

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
 <input
 required
 type="password"
 value={form.password}
 onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
 placeholder="Minimum 6 characters"
 className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-pink-500 focus:border-pink-500 focus:ring-2"
 />
 </div>
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
 <input
 required
 type="password"
 value={form.confirmPassword}
 onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
 placeholder="Repeat password"
 className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-pink-500 focus:border-pink-500 focus:ring-2"
 />
 </div>
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
 <select
 value={form.role}
 onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}
 className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none ring-pink-500 focus:border-pink-500 focus:ring-2"
 >
 <option value="master">Master</option>
 <option value="client">Client</option>
 </select>
 <p className="mt-1 text-xs text-gray-500">You can change role later in profile if needed.</p>
 </div>

 {error && (
 <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
 {error}
 </div>
 )}

 <button
 type="submit"
 disabled={!canSubmit || loading}
 className="flex w-full items-center justify-center rounded-lg bg-pink-600 px-4 py-2.5 font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {loading ? "Creating..." : "Sign up"}
 </button>
 </form>

 <p className="mt-6 text-center text-xs text-gray-500">
 By signing up you agree to our Terms and Privacy Policy.
 </p>
 </div>
 </div>
 );
}