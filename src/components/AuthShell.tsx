"use client";

import { PropsWithChildren } from "react";
import Link from "next/link";

type AuthShellProps = {
 mode: "signup" | "login";
 title?: string;
 subtitle?: string;
};

export default function AuthShell({ mode, title, subtitle, children }: PropsWithChildren<AuthShellProps>) {
 const isSignup = mode === "signup";
 return (
 <div className="min-h-screen w-full bg-gradient-to-b from-white to-pink-50 flex items-center justify-center px-4">
 <div className="w-full max-w-md">
 <div className="text-center mb-6">
 <h1 className="text-2xl font-semibold tracking-tight">BeautyReviewty</h1>
 </div>
 <div className="bg-white shadow-lg rounded-2xl p-6 border border-pink-100">
 <div className="mb-5">
 <h2 className="text-xl font-semibold">{title ?? (isSignup ? "Create your account" : "Sign in to your account")}</h2>
 <p className="text-sm text-gray-500 mt-1">
 {subtitle ?? (isSignup ? (
 <>Already have an account?{" "}
 <Link href="/login" className="font-medium text-pink-600 hover:underline">Sign in</Link>
 </>
 ) : (
 <>Don't have an account?{" "}
 <Link href="/signup" className="font-medium text-pink-600 hover:underline">Create one</Link>
 </>
 ))}
 </p>
 </div>

 {children}

 <p className="mt-6 text-center text-xs text-gray-400">
 By continuing you agree to our Terms & Privacy.
 </p>
 </div>
 <p className="text-center text-[12px] text-gray-400 mt-6">
 © {new Date().getFullYear()} BeautyReviewty
 </p>
 </div>
 </div>
 );
}
