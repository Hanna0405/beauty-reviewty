"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { initialsFrom } from "@/lib/initials";
import { useNotificationsBadge } from "@/components/notifications/useNotificationsBadge";

export default function UserAvatarMenu() {
 const { user, profile, loading } = useAuth();
 const [open, setOpen] = useState(false);
 const { count } = useNotificationsBadge(user?.uid, profile?.role);
 const [details, setDetails] = useState<{pendingBookings:number;unreadMessages:number} | null>(null);

 // Pick displayName first, fallback to email
 const nameOrEmail = profile?.displayName || user?.email || "";

 useEffect(() => {
 if (!user?.uid) return;
 fetch("/api/notifications/count", {
 method:"POST",
 headers:{"Content-Type":"application/json"},
 body: JSON.stringify({ userId: user.uid, role: profile?.role })
 }).then(r=>r.json()).then(d=>{
 if (d?.ok) setDetails({ pendingBookings: d.pendingBookings || 0, unreadMessages: d.unreadMessages || 0 });
 }).catch(()=>{});
 }, [user?.uid, profile?.role]);

 if (!user) {
 // If not logged in → show login/signup buttons
 return (
 <div className="flex items-center gap-2">
 <Link
 href="/auth/login"
 className="rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/30"
 >
 Log in
 </Link>
 <Link
 href="/auth/signup"
 className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
 >
 Sign up
 </Link>
 </div>
 );
 }

 // If logged in → show avatar with initials and dropdown
 const initials = initialsFrom(nameOrEmail);

 return (
 <div className="relative">
 <button
 onClick={() => setOpen((v) => !v)}
 className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/30"
 >
 {initials}
 </button>
 {open && (
 <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
 <div className="px-3 py-2 text-sm font-medium text-gray-900 truncate">{nameOrEmail}</div>
 <div className="h-px bg-gray-100" />
 <Link href="/dashboard/master" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between">
 Dashboard {count ? <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 text-xs px-1.5 rounded-full bg-red-600 text-white">{count}</span> : null}
 </Link>
 <Link href="/dashboard/bookings" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between">
 Bookings {details?.pendingBookings ? <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 text-xs px-1.5 rounded-full bg-red-600 text-white">{details.pendingBookings}</span> : null}
 </Link>
 <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">My profile</Link>
 <Link href="/auth/logout" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Log out</Link>
 </div>
 )}
 </div>
 );
}