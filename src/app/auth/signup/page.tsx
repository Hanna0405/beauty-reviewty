"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase.client";
import { ensureUserDoc } from "@/lib/users";
import { masterProfileEditUrl } from "@/lib/masterOnboarding";

type Role = "master" | "client";

export default function SignupPage() {
 const router = useRouter();
 const [form, setForm] = useState({ displayName: "", email: "", password: "", role: "master" as Role });
 const [err, setErr] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 
 // Phone auth state
 const [phoneNumber, setPhoneNumber] = useState('');
 const [verificationCode, setVerificationCode] = useState('');
 const [isCodeSent, setIsCodeSent] = useState(false);
 const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
 const [phoneLoading, setPhoneLoading] = useState(false);
 const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

 // Initialize Recaptcha
 useEffect(() => {
   if (typeof window !== 'undefined' && !recaptchaVerifierRef.current) {
     try {
       recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
         size: 'invisible',
         callback: () => {
           // reCAPTCHA solved, allow sendSMS
         },
         'expired-callback': () => {
           setErr('reCAPTCHA expired. Please try again.');
         }
       });
     } catch (error) {
       console.error('Recaptcha initialization error:', error);
     }
   }
   
   return () => {
     if (recaptchaVerifierRef.current) {
       recaptchaVerifierRef.current.clear();
       recaptchaVerifierRef.current = null;
     }
   };
 }, []);

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
 router.push(
  form.role === "master" ? masterProfileEditUrl(true) : "/profile"
 );
 } catch (e:any) {
 setErr(e?.message || "Signup failed");
 } finally { setLoading(false); }
 }

 const handleSendCode = async () => {
   if (!phoneNumber.trim()) {
     setErr('Please enter a phone number');
     return;
   }
   
   setErr(null);
   setPhoneLoading(true);
   try {
     if (!recaptchaVerifierRef.current) {
       throw new Error('reCAPTCHA not initialized');
     }
     
     const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
     const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
     setConfirmationResult(confirmation);
     setIsCodeSent(true);
   } catch (e: any) {
     setErr(e?.message ?? 'Failed to send verification code');
   } finally {
     setPhoneLoading(false);
   }
 };

 const handleVerifyCode = async () => {
   if (!verificationCode.trim()) {
     setErr('Please enter the verification code');
     return;
   }
   
   if (!confirmationResult) {
     setErr('No confirmation result. Please send code again.');
     return;
   }
   
   setErr(null);
   setPhoneLoading(true);
   try {
     const { user } = await confirmationResult.confirm(verificationCode);
     await ensureUserDoc(user, form.role);
     router.push(
      form.role === "master" ? masterProfileEditUrl(true) : "/"
     );
   } catch (e: any) {
     setErr(e?.message ?? 'Invalid verification code');
   } finally {
     setPhoneLoading(false);
   }
 };

 return (
 <div className="min-h-[80vh] w-full bg-gradient-to-b from-pink-500 to-fuchsia-600 py-5 sm:py-8 md:py-10">
 <div className="mx-auto w-full max-w-lg rounded-2xl bg-white/95 p-4 sm:p-6 md:p-8 shadow-xl max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
 <div className="mb-4 sm:mb-6 text-center">
 <h1 className="text-2xl font-bold text-gray-900">Sign up</h1>
 </div>

 <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
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

 {/* Phone Sign-in Section */}
 <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
 <h3 className="text-sm font-medium text-gray-700 mb-3">Sign in with phone</h3>
 
 {!isCodeSent ? (
 <div className="space-y-3">
 <div className="space-y-1.5">
 <label className="block text-sm font-medium text-gray-700">Phone Number</label>
 <input
 type="tel"
 value={phoneNumber}
 onChange={(e) => setPhoneNumber(e.target.value)}
 placeholder="+1234567890"
 className="w-full rounded-lg border-gray-300 focus:border-pink-500 focus:ring-pink-500 p-2.5"
 />
 <p className="text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
 </div>
 
 <button
 type="button"
 onClick={handleSendCode}
 disabled={phoneLoading || loading}
 className="w-full rounded-lg border border-gray-300 bg-white text-gray-700 py-2.5 font-medium hover:bg-gray-50 disabled:opacity-60 transition"
 >
 {phoneLoading ? 'Sending code…' : 'Send verification code'}
 </button>
 </div>
 ) : (
 <div className="space-y-3">
 <div className="space-y-1.5">
 <label className="block text-sm font-medium text-gray-700">Verification Code</label>
 <input
 type="text"
 value={verificationCode}
 onChange={(e) => setVerificationCode(e.target.value)}
 placeholder="Enter 6-digit code"
 maxLength={6}
 className="w-full rounded-lg border-gray-300 focus:border-pink-500 focus:ring-pink-500 p-2.5"
 />
 </div>
 
 <button
 type="button"
 onClick={handleVerifyCode}
 disabled={phoneLoading || loading}
 className="w-full rounded-lg bg-pink-600 text-white py-2.5 font-medium hover:bg-pink-700 disabled:opacity-60 transition"
 >
 {phoneLoading ? 'Verifying…' : 'Verify code'}
 </button>
 
 <button
 type="button"
 onClick={() => {
 setIsCodeSent(false);
 setVerificationCode('');
 setConfirmationResult(null);
 setErr(null);
 }}
 className="w-full text-sm text-gray-500 hover:text-gray-700"
 >
 Change phone number
 </button>
 </div>
 )}
 </div>

 <p className="mt-4 text-center text-sm text-gray-600">
 Already have an account?{" "}
 <Link href="/auth/login" className="font-medium text-pink-600 hover:underline">Log in</Link>
 </p>
 </div>
 
 {/* reCAPTCHA container (hidden) */}
 <div id="recaptcha-container"></div>
 </div>
 );
}