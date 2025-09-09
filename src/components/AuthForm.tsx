"use client";
import { useState } from "react";
import {
 createUserWithEmailAndPassword,
 signInWithEmailAndPassword,
 updateProfile,
 signInWithPopup,
} from "firebase/auth";
import { auth, makeRecaptcha, signInWithPhoneNumber } from "@/lib/firebase";
import { signInWithGoogle } from "@/lib/auth-helpers";
import { ensureUserDoc } from "@/lib/users";
import { useRouter } from "next/navigation";
import { Field } from "@/components/auth/Field";
import { GoogleButton } from "@/components/auth/GoogleButton";

type Mode = "signup" | "login";
type Variant = "full" | "emailOnly";

export default function AuthForm({ mode, variant = "full" }: { mode: Mode; variant?: Variant }) {
 const router = useRouter();
 const [tab, setTab] = useState<"email" | "phone">("email");
 const [pending, setPending] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // shared
 const [fullName, setFullName] = useState("");
 const [role, setRole] = useState<"client" | "master">("client");

 // email
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirm, setConfirm] = useState("");

 // phone
 const [phone, setPhone] = useState("");
 const [code, setCode] = useState("");
 const [confirmationResult, setConfirmationResult] = useState<any>(null);

 const enablePhone = process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH === "true";

 async function afterLogin(user: any, maybeRole?: "client" | "master") {
 await ensureUserDoc(user, maybeRole);
 router.push("/");
 }

 async function onEmailSubmit(e: React.FormEvent) {
 e.preventDefault();
 setError(null); setPending(true);
 try {
 if (mode === "signup") {
 if (password !== confirm) throw new Error("Passwords do not match");
 const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
 if (fullName) await updateProfile(cred.user, { displayName: fullName.trim() });
 await afterLogin(cred.user, role);
 } else {
 const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
 await afterLogin(cred.user);
 }
 } catch (e:any) { setError(clean(e.message)); } finally { setPending(false); }
 }

 async function onGoogle() {
 setError(null); setPending(true);
 try {
 await signInWithGoogle();
 // при успехе можно редиректнуть пользователя:
 router.push("/dashboard");
 } catch (e:any) { 
 console.error("Google sign-in error:", e);
 setError("Google sign-in failed. Please try again."); 
 } finally { setPending(false); }
 }

 async function sendCode(e: React.FormEvent) {
 e.preventDefault();
 setError(null); setPending(true);
 try {
 const verifier = makeRecaptcha();
 const conf = await signInWithPhoneNumber(auth, phone.trim(), verifier);
 setConfirmationResult(conf);
 } catch (e:any) { setError(clean(e.message)); } finally { setPending(false); }
 }

 async function verifyCode(e: React.FormEvent) {
 e.preventDefault();
 setError(null); setPending(true);
 try {
 if (!confirmationResult) throw new Error("Send the code first");
 const { user } = await confirmationResult.confirm(code.trim());
 if (mode === "signup" && fullName) await updateProfile(user, { displayName: fullName.trim() });
 await afterLogin(user, mode === "signup" ? role : undefined);
 } catch (e:any) { setError(clean(e.message)); } finally { setPending(false); }
 }

 const showTabs = variant === "full";
 const showPhone = variant === "full" && enablePhone;

 return (
 <div className="space-y-5">
 {showTabs && (
 <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
 <button
 type="button"
 className={`flex-1 rounded-md px-3 py-2 text-sm transition ${tab==="email"?"bg-pink-600 text-white shadow":""}`}
 onClick={()=>setTab("email")}
 >Email</button>
 {showPhone && (
 <button
 type="button"
 className={`flex-1 rounded-md px-3 py-2 text-sm transition ${tab==="phone"?"bg-pink-600 text-white shadow":""}`}
 onClick={()=>setTab("phone")}
 >Phone</button>
 )}
 </div>
 )}

 {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

 {/* EMAIL (always visible when emailOnly; tab-controlled when full) */}
 {(variant === "emailOnly" || tab === "email") && (
 <form className="space-y-3" onSubmit={onEmailSubmit}>
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
 value={email} 
 onChange={(e)=>setEmail(e.target.value)} 
 required 
 />
 <Field 
 label="Password *" 
 type="password" 
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

 <div className="relative my-4">
 <div className="absolute inset-0 flex items-center">
 <span className="w-full border-t border-gray-200" />
 </div>
 <div className="relative flex justify-center text-xs">
 <span className="bg-white px-2 text-gray-400">Or continue with</span>
 </div>
 </div>
 <GoogleButton onClick={onGoogle} disabled={pending} />
 </form>
 )}

 {/* PHONE (hidden when emailOnly) */}
 {showPhone && tab==="phone" && (
 <div className="space-y-3">
 {mode==="signup" && (
 <>
 <Field 
 label="Full Name *" 
 value={fullName} 
 onChange={(e)=>setFullName(e.target.value)} 
 required 
 />
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
 </>
 )}
 <form className="space-y-3" onSubmit={sendCode}>
 <Field 
 label="Phone (E.164, e.g. +14165551234) *" 
 value={phone} 
 onChange={(e)=>setPhone(e.target.value)} 
 required 
 />
 <button 
 type="submit"
 disabled={pending} 
 className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white font-semibold px-3 py-2 disabled:opacity-60"
 >
 Send code
 </button>
 </form>

 <form className="space-y-3" onSubmit={verifyCode}>
 <Field 
 label="Verification code" 
 value={code} 
 onChange={(e)=>setCode(e.target.value)} 
 />
 <button 
 type="submit"
 disabled={pending} 
 className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white font-semibold px-3 py-2 disabled:opacity-60"
 >
 Verify & Continue
 </button>
 </form>

 <div id="recaptcha-container" />
 </div>
 )}
 </div>
 );

 function clean(msg?: string) {
 if (!msg) return "Something went wrong";
 return msg.replace(/^Firebase:\s*/i, "").replace(/\(auth\/.+\)$/i, "").trim();
 }
}