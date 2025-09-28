"use client";
import { auth } from "./firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  linkWithPhoneNumber,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

let recaptcha: RecaptchaVerifier | null = null;

/** Ensure a singleton reCAPTCHA verifier to avoid quota issues */
export function ensureRecaptcha(containerId = "recaptcha-container", invisible = true): RecaptchaVerifier {
  if (recaptcha) return recaptcha;
  recaptcha = new RecaptchaVerifier(auth, containerId, {
    size: invisible ? "invisible" : "normal",
    callback: () => {}, // auto-resolve callback
    "expired-callback": () => {}, // no-op; UI handles retries
  });
  return recaptcha;
}

/** Start phone sign-in: sends SMS and returns ConfirmationResult */
export async function startPhoneSignIn(phoneE164: string, containerId = "recaptcha-container"): Promise<ConfirmationResult> {
  if (typeof window === "undefined") throw new Error("Phone auth is client-only.");
  if (!phoneE164?.startsWith("+")) throw new Error("Enter phone in international format, e.g. +14165551234");
  const verifier = ensureRecaptcha(containerId, true);
  return await signInWithPhoneNumber(auth, phoneE164, verifier);
}

/** Complete sign-in with the code from SMS */
export async function confirmPhoneCode(conf: ConfirmationResult, code: string) {
  const cred = await conf.confirm(code);
  return cred.user;
}

/** Link a phone to the currently signed-in user (keeps the same UID) */
export async function linkPhoneToCurrentUser(phoneE164: string, containerId = "recaptcha-container"): Promise<ConfirmationResult> {
  if (!phoneE164?.startsWith("+")) throw new Error("Enter phone in international format, e.g. +14165551234");
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to link a phone.");
  const verifier = ensureRecaptcha(containerId, true);
  return await linkWithPhoneNumber(user, phoneE164, verifier);
}

/** Helper to watch auth state in client components */
export function subscribeAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

/** Cleanup when a component unmounts */
export function resetRecaptcha() {
  recaptcha?.clear?.();
  recaptcha = null;
}
