"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AvatarWithBadge } from "@/components/notifications/AvatarWithBadge";
import { useNotificationsBadge } from "@/components/notifications/useNotificationsBadge";

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

 {user && <AccountMenu nameOrEmail={nameOrEmail} user={user} profile={profile} />}
 </div>
 </nav>
 </header>
 );
}

function AccountMenu({ nameOrEmail, user, profile }: { nameOrEmail: string | null | undefined; user: any; profile: any }) {
 const [open, setOpen] = useState(false);
 const { count } = useNotificationsBadge(user?.uid, profile?.role);
 const [pendingBookings, setPendingBookings] = useState<number>(0);

 // подтянем разложение (pending / unread) для бейджа на пункте Bookings
 React.useEffect(() => {
 let alive = true;
 async function load() {
 if (!user?.uid) return;
 try {
 const r = await fetch("/api/notifications/count", {
 method: "POST",
 headers: { "Content-Type":"application/json" },
 body: JSON.stringify({ userId: user.uid, role: profile?.role })
 });
 const d = await r.json();
 if (alive && d?.ok) setPendingBookings(Number(d.pendingBookings || 0));
 } catch {}
 }
 load();
 const onPing = () => load();
 window.addEventListener("notify:refresh", onPing as any);
 return () => { alive = false; window.removeEventListener("notify:refresh", onPing as any); };
 }, [user?.uid, profile?.role]);

 React.useEffect(() => {
 const close = (e: MouseEvent) => {
 const t = e.target as HTMLElement;
 if (!t.closest?.("#hdr-menu")) setOpen(false);
 };
 document.addEventListener("click", close);
 return () => document.removeEventListener("click", close);
 }, []);

 return (
 <div className="relative" id="hdr-menu">
 <button onClick={() => setOpen(v => !v)} aria-label="Account menu" className="focus:outline-none">
 <AvatarWithBadge user={{ uid: user.uid, role: profile?.role || "client", name: nameOrEmail }} />
 </button>
 {open && (
 <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg z-50">
 <div className="px-3 py-2 text-sm font-medium text-gray-900 truncate">{nameOrEmail}</div>
 <div className="h-px bg-gray-100" />
 <Link href="/dashboard/master" className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
 <span>Dashboard</span>
 {count ? (
 <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 text-xs px-1.5 rounded-full bg-red-600 text-white">
 {count}
 </span>
 ) : null}
 </Link>
 <Link href="/dashboard/bookings" className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
 <span>Bookings</span>
 {pendingBookings ? (
 <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 text-xs px-1.5 rounded-full bg-red-600 text-white">
 {pendingBookings}
 </span>
 ) : null}
 </Link>
 <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">My profile</Link>
 <Link href="/auth/logout" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Log out</Link>
 </div>
 )}
 </div>
 );
}
