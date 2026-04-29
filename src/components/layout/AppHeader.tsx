"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarWithBadge } from "@/components/notifications/AvatarWithBadge";

export default function AppHeader() {
 const { user, profile, loading, logout } = useAuth();
 const nameOrEmail = profile?.displayName || user?.email || "";
 const pathname = usePathname();
 const skincareActive = pathname === "/skincare-checker";

 return (
 <div className="mx-auto flex min-w-0 max-w-6xl items-start justify-between gap-3 px-3 py-2.5 sm:px-4 sm:items-center">
 {/* LEFT: Logo + nav (Masters/Reviewty + Check skincare below) */}
 <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
 <Link href="/" className="group relative w-10 h-10 flex shrink-0 items-center justify-center rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors">
 BR
 <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
  BeautyReviewty
 </span>
 </Link>
 <div className="flex min-w-0 flex-col items-center gap-1.5 sm:pt-0.5">
  <div className="flex items-center justify-center gap-4 sm:gap-6">
   <Link href="/masters" className="text-sm font-medium text-gray-700 hover:text-gray-900">
    Masters
   </Link>
   <Link href="/reviewty" className="text-sm font-medium text-gray-700 hover:text-gray-900">
    Reviewty
   </Link>
  </div>
  <Link
  href="/skincare-checker"
  className={
   "inline-flex w-auto max-w-full shrink-0 items-center justify-center no-underline rounded-md border-0 px-2.5 py-1.5 text-[14px] font-semibold leading-normal antialiased shadow-none transition-colors sm:px-3 " +
   (skincareActive
    ? "bg-[#F5DAE9] text-pink-700 hover:bg-[#F5D7E7]"
    : "bg-[#FCE4EF] text-pink-600 hover:bg-[#F9E0ED] hover:text-pink-700 active:bg-[#F5DDE8]")
  }
  aria-current={skincareActive ? "page" : undefined}
  >
   <span className="block max-w-full whitespace-nowrap">
    Check skincare
   </span>
  </Link>
 </div>
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

 {user && <AccountMenu nameOrEmail={nameOrEmail} onLogout={logout} user={user} profile={profile} />}
 </div>
 </div>
 );
}

function AccountMenu({ nameOrEmail, onLogout, user, profile }: { nameOrEmail?: string | null; onLogout: () => Promise<void>; user: any; profile: any }) {
 const [open, setOpen] = useState(false);
 const pathname = usePathname();

 // Close menu on route change
 useEffect(() => {
   setOpen(false);
 }, [pathname]);

 const toggle = () => setOpen(o => !o);
 const close = () => setOpen(false);

 return (
 <div className="relative">
 <button onClick={toggle} aria-label="Account menu" className="focus:outline-none">
 <AvatarWithBadge user={{ uid: user.uid, role: profile?.role || "client", name: nameOrEmail || undefined }} />
 </button>
 {open && (
 <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
 <div className="px-3 py-2 text-sm font-medium text-gray-900 truncate">{nameOrEmail}</div>
 <div className="h-px bg-gray-100" />
 <Link href="/dashboard/master" onClick={close} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
 <button onClick={() => { close(); onLogout(); }} className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Log out</button>
 </div>
 )}
 </div>
 );
}