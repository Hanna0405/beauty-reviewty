"use client";

import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { signInWithGoogle } from "@/lib/auth-helpers";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type Props = { open: boolean; onClose: () => void };

export default function AuthModal({ open, onClose }: Props) {
 const [tab, setTab] = useState<"client" | "master">("client");
 const [mode, setMode] = useState<"login" | "register">("login"); // вход/регистрация
 const [email, setEmail] = useState("");
 const [pass, setPass] = useState("");
 const [name, setName] = useState("");
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 useEffect(() => {
 if (!open) {
 setEmail(""); setPass(""); setName("");
 setMode("login"); setTab("client");
 }
 }, [open]);

 if (!open) return null;

 async function ensureUserDoc(uid: string, role: "client" | "master", displayName?: string) {
 const userRef = doc(db, "users", uid);
 const snap = await getDoc(userRef);
 if (!snap.exists()) {
 await setDoc(userRef, {
 role,
 displayName: displayName || name || "",
 createdAt: Date.now()
 });
 }
 // если мастер — создаём профиль мастера, если его ещё нет
 if (role === "master") {
 const masterRef = doc(db, "masters", uid);
 const mSnap = await getDoc(masterRef);
 if (!mSnap.exists()) {
 await setDoc(masterRef, {
 uid,
 name: displayName || name || "New Master",
 city: "",
 services: [],
 bio: "",
 priceMin: null,
 priceMax: null,
 ratingAvg: 0,
 reviewsCount: 0,
 photoUrls: [],
 createdAt: Date.now()
 });
 }
 }
 }

 async function doLogin() {
 setLoading(true);
 try {
 const cred = await signInWithEmailAndPassword(auth, email, pass);
 // роль читаем, если нет — считаем client по умолчанию
 const userRef = doc(db, "users", cred.user.uid);
 const us = await getDoc(userRef);
 let role: "client" | "master" = "client";
 if (us.exists() && (us.data() as any).role === "master") role = "master";
 if (role === "master") router.push("/dashboard");
 onClose();
 } catch (e) {
 alert("Login error");
 console.error(e);
 } finally {
 setLoading(false);
 }
 }

 async function doRegister() {
 setLoading(true);
 try {
 const cred = await createUserWithEmailAndPassword(auth, email, pass);
 const role = tab; // вкладка определяет роль
 await ensureUserDoc(cred.user.uid, role, cred.user.displayName || name);
 if (role === "master") router.push("/dashboard");
 onClose();
 } catch (e) {
 alert("Register error");
 console.error(e);
 } finally {
 setLoading(false);
 }
 }

 async function doGoogle() {
 setLoading(true);
 try {
 await signInWithGoogle();
 // при успехе можно редиректнуть пользователя:
 if (tab === "master") router.push("/dashboard");
 onClose();
 } catch (e) {
 console.error("Google sign-in error:", e);
 alert("Google sign-in failed. Please try again.");
 } finally {
 setLoading(false);
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
 <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
 {/* Вкладки */}
 <div className="flex mb-4 border-b">
 <button
 className={`px-4 py-2 ${tab === "client" ? "border-b-2 border-pink-600 font-semibold" : "text-gray-600"}`}
 onClick={() => setTab("client")}
 >
 Client
 </button>
 <button
 className={`px-4 py-2 ${tab === "master" ? "border-b-2 border-pink-600 font-semibold" : "text-gray-600"}`}
 onClick={() => setTab("master")}
 >
 Master
 </button>
 <div className="flex-1" />
 <button onClick={onClose} className="text-gray-500">✕</button>
 </div>

 {/* Режим */}
 <div className="mb-3">
 <div className="inline-flex rounded-md overflow-hidden border">
 <button
 className={`px-3 py-1.5 ${mode === "login" ? "bg-pink-600 text-white" : ""}`}
 onClick={() => setMode("login")}
 type="button"
 >
 Log in
 </button>
 <button
 className={`px-3 py-1.5 ${mode === "register" ? "bg-pink-600 text-white" : ""}`}
 onClick={() => setMode("register")}
 type="button"
 >
 Register
 </button>
 </div>
 </div>

 {/* Форма */}
 <form
 onSubmit={(e) => {
 e.preventDefault();
 mode === "login" ? doLogin() : doRegister();
 }}
 className="space-y-3"
 >
 {mode === "register" && (
 <div>
 <label className="block text-sm mb-1">Name</label>
 <input
 className="w-full border rounded-md px-3 py-2"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Your name"
 />
 </div>
 )}
 <div>
 <label className="block text-sm mb-1">Email</label>
 <input
 type="email"
 className="w-full border rounded-md px-3 py-2"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="you@example.com"
 required
 />
 </div>
 <div>
 <label className="block text-sm mb-1">Password</label>
 <input
 type="password"
 className="w-full border rounded-md px-3 py-2"
 value={pass}
 onChange={(e) => setPass(e.target.value)}
 placeholder="••••••••"
 required
 />
 </div>

 <button
 className="w-full rounded-md bg-pink-600 text-white py-2 disabled:opacity-60"
 disabled={loading}
 type="submit"
 >
 {loading ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
 </button>

 <div className="text-center text-sm text-gray-600">or</div>

 <button
 onClick={doGoogle}
 type="button"
 className="w-full rounded-md border py-2"
 disabled={loading}
 >
 Continue with Google
 </button>

 <p className="text-xs text-gray-500 text-center">
 You are signing in as <b>{tab.toUpperCase()}</b>
 </p>
 </form>
 </div>
 </div>
 );
}
