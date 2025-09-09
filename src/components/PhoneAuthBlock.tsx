"use client";
import { useEffect, useRef, useState } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { ensureRecaptcha, resetRecaptcha, startPhoneSignIn, confirmPhoneCode, linkPhoneToCurrentUser, subscribeAuth } from "@/lib/phone-auth";
import { upsertUser } from "@/lib/upsert-user";
import { useRouter } from "next/navigation";

type Mode = "signin" | "link"; // auto-detected by auth state, but can be forced via prop
export default function PhoneAuthBlock({ redirectTo = "/dashboard", forceMode }: { redirectTo?: string; forceMode?: Mode }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"enter-phone" | "enter-code">("enter-phone");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>(forceMode ?? "signin");
  const [isAuthed, setIsAuthed] = useState(false);
  const confRef = useRef<ConfirmationResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Prepare recaptcha container once
    ensureRecaptcha("recaptcha-container", true);
    const unsub = subscribeAuth((u) => {
      setIsAuthed(!!u);
      if (!forceMode) setMode(u ? "link" : "signin");
    });
    return () => {
      unsub?.();
      resetRecaptcha();
    };
  }, [forceMode]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        confRef.current = await startPhoneSignIn(phone, "recaptcha-container");
      } else {
        confRef.current = await linkPhoneToCurrentUser(phone, "recaptcha-container");
      }
      setStep("enter-code");
    } catch (err: any) {
      setError(readableError(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!confRef.current) throw new Error("Please request the SMS code again.");
      const user = await confirmPhoneCode(confRef.current, code);
      await upsertUser(user.uid, { email: user.email, displayName: user.displayName, phoneNumber: user.phoneNumber });
      if (mode === "signin") router.push(redirectTo);
      setStep("enter-phone"); setCode("");
    } catch (err: any) {
      setError(readableError(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3 max-w-sm">
      <div className="text-sm text-gray-600">
        {mode === "signin" ? "Sign in / Sign up with your phone" : "Link your phone to this account"}
        {isAuthed && mode === "signin" && <span className="block text-xs text-amber-600">You are signed in; switching to linking might be preferable.</span>}
      </div>

      {step === "enter-phone" && (
        <form onSubmit={handleSend} className="grid gap-2">
          <label className="text-sm font-medium">Phone (E.164 format)</label>
          <input
            type="tel"
            placeholder="+14165551234"
            value={phone}
            onChange={(e) => setPhone(e.target.value.trim())}
            className="border rounded px-3 py-2"
            required
          />
          <button disabled={loading} className="btn-primary">{loading ? "Sending..." : (mode === "signin" ? "Send code" : "Send link code")}</button>
        </form>
      )}

      {step === "enter-code" && (
        <form onSubmit={handleConfirm} className="grid gap-2">
          <label className="text-sm font-medium">SMS code</label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="border rounded px-3 py-2"
            required
          />
          <button disabled={loading} className="btn-primary">{loading ? "Verifying..." : "Verify"}</button>
          <button type="button" className="text-sm underline" onClick={() => { setStep("enter-phone"); setCode(""); }}>Change phone</button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* reCAPTCHA root (invisible) */}
      <div id="recaptcha-container" />
    </div>
  );
}

function readableError(err: any): string {
  const m = String(err?.message || err);
  if (m.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
  if (m.includes("invalid-phone-number")) return "Invalid phone format. Use +CountryCodeNumber, e.g. +14165551234.";
  if (m.includes("captcha-check-failed")) return "Captcha failed. Refresh the page and try again.";
  if (m.includes("code-expired")) return "The code expired. Request a new one.";
  if (m.includes("invalid-verification-code")) return "Incorrect code. Please try again.";
  if (m.includes("app-not-authorized")) return "This domain is not authorized in Firebase Authentication settings.";
  if (m.includes("operation-not-allowed")) return "Phone sign-in is not enabled in Firebase Console.";
  return "Something went wrong. Please try again.";
}
