"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function initialsFrom(nameOrEmail?: string | null) {
 if (!nameOrEmail) return "U";
 const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
 const parts = base.trim().split(/[.\s_-]+/).filter(Boolean);
 const two = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
 const one = parts[0]?.slice(0, 2) ?? "U";
 return (two || one).toUpperCase();
}

export default function AppHeader() {
 const { user, profile, loading, logout } = useAuth();
 const nameOrEmail = profile?.displayName || user?.email || "";

 return (
 <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
 {/* LEFT: Logo + Masters */}
 <div className="flex items-center gap-6">
 <Link href="/" className="text-lg font-bold text-gray-900 hover:opacity-90">
 BeautyReviewty
 </Link>
 <Link href="/masters" className="text-sm font-medium text-gray-700 hover:text-gray-900">
 Masters
 </Link>
 </div>

 {/* RIGHT: Auth area (never blocks) */}
 <div className="flex items-center gap-2">
 {!user && (
 <>
 <Link
 href="/auth/login"
 aria-disabled={loading ? "true" : "false"}
 className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
 >
 Log in
 </Link>
 <Link
 href="/auth/signup"
 aria-disabled={loading ? "true" : "false"}
 className="inline-flex items-center rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-pink-700"
 >
 Sign up
 </Link>
 </>
 )}

 {user && <AccountMenu nameOrEmail={nameOrEmail} onLogout={logout} />}
 </div>
 </div>
 );
}

function AccountMenu({ nameOrEmail, onLogout }: { nameOrEmail?: string | null; onLogout: () => Promise<void> }) {
 const [open, setOpen] = useState(false);
 const initials = initialsFrom(nameOrEmail || "");

 return (
 <div className="relative">
 <button
 onClick={() => setOpen(v => !v)}
 aria-label="Account menu"
 className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white ring-1 ring-black/10 hover:opacity-90"
 >
 {initials}
 </button>
 {open && (
 <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
 <div className="px-3 py-2 text-sm font-medium text-gray-900 truncate">{nameOrEmail}</div>
 <div className="h-px bg-gray-100" />
 <Link href="/dashboard/master" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
 <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">My profile</Link>
 <button onClick={onLogout} className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Log out</button>
 </div>
 )}
 </div>
 );
}