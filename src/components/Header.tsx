"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";

function BrandLogo() {
  return (
    <Link
      href="/"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-600 text-white font-bold select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      aria-label="BeautyReviewty"
    >
      BR
      {/* tooltip ABOVE */}
      <span
        className="pointer-events-none absolute left-1/2 bottom-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap
                   rounded-md bg-rose-700 text-white text-[11px] px-2 py-1 opacity-0 -translate-y-1
                   group-hover:opacity-100 group-hover:translate-y-0 transition"
        role="tooltip"
      >
        BeautyReviewty
      </span>
    </Link>
  );
}

export default function Header() {
 const { user, profile, loading } = useAuth();

 // Prefer displayName, fallback to email (for avatar initials)
 const nameOrEmail = profile?.displayName || user?.email || "User";

 return (
 <header className="w-full">
 <nav className="mx-auto flex items-center justify-between gap-4 px-4 py-3">
 {/* LEFT: BR logo with tooltip */}
 <div className="flex items-center gap-2">
 <BrandLogo />
 </div>

 {/* RIGHT: Auth area (non-blocking) */}
 <div className="relative flex items-center gap-2">
 {!user && (
 <>
 <Link href="/auth/login" className="btn btn-secondary" aria-disabled={loading ? "true" : "false"}>
 Log in
 </Link>
 <Link href="/auth/signup" className="btn btn-primary" aria-disabled={loading ? "true" : "false"}>
 Sign up
 </Link>
 </>
 )}

 {user && <AccountMenu nameOrEmail={nameOrEmail} />}
 </div>
 </nav>
 </header>
 );
}

function AccountMenu({ nameOrEmail }: { nameOrEmail: string | null | undefined }) {
 const [open, setOpen] = useState(false);

 return (
 <div className="relative">
 <button onClick={() => setOpen(v => !v)} aria-label="Account menu" className="focus:outline-none">
 <UserAvatar nameOrEmail={nameOrEmail} />
 </button>
 {open && (
 <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
 <div className="px-3 py-2 text-sm font-medium text-gray-900 truncate">{nameOrEmail}</div>
 <div className="h-px bg-gray-100" />
 <Link href="/dashboard/master" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
 <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">My profile</Link>
 <Link href="/auth/logout" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Log out</Link>
 </div>
 )}
 </div>
 );
}
