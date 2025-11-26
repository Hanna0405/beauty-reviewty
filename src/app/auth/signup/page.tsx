"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase.client";
import { ensureUserDoc } from "@/lib/users";

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
 router.push("/profile");
 } catch (e:any) {
 setErr(e?.message || "Signup failed");
 } finally { setLoading(false); }
 }

 const handleGoogleSignIn = async () => {
   setErr(null);
   setLoading(true);
   try {
     const { user } = await signInWithPopup(auth, googleProvider);
     await ensureUserDoc(user, form.role);
     router.push('/');
   } catch (e: any) {
     if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
       setErr('Sign-in cancelled');
     } else {
       setErr(e?.message ?? 'Google sign-in failed');
     }
   } finally {
     setLoading(false);
   }
 };

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
     router.push('/');
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

 {/* Divider */}
 <div className="my-4 sm:my-6 flex items-center">
 <div className="flex-1 border-t border-gray-300"></div>
 <span className="px-3 text-sm text-gray-500">or</span>
 <div className="flex-1 border-t border-gray-300"></div>
 </div>

 {/* Google Sign-in */}
 <button
 type="button"
 onClick={handleGoogleSignIn}
 disabled={loading || phoneLoading}
 className="w-full rounded-lg border border-gray-300 bg-white text-gray-700 py-2.5 font-medium hover:bg-gray-50 disabled:opacity-60 transition flex items-center justify-center gap-2"
 >
 <svg className="w-5 h-5" viewBox="0 0 24 24">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
 </svg>
 Continue with Google
 </button>

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