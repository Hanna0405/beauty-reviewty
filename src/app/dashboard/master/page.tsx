"use client";

import Link from "next/link";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function MasterDashboardPage() {
 const { user, profile, role, loading } = useUserProfile();
 const name = profile?.displayName || user?.email || "master";
 
 // choose whatever names you already have; this is safe and typed
 const computedRole =
 (typeof profile !== 'undefined' && (profile as any).role) ??
 'client';

 if (loading) {
  return <div className="text-sm text-gray-500 px-4 py-2">Loading profile…</div>;
 }

 return (
 <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
 <header className="mb-5 sm:mb-6">
 <h1 className="text-2xl font-bold text-gray-900">Welcome, {name}</h1>
 <p className="mt-1 text-sm text-gray-600">Your master workspace</p>
 <div className="mt-3 space-y-2">
 <span className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-200">
 Role: {computedRole}
 </span>
 <div className="text-xs text-gray-500">
 <div><b>Email:</b> {user?.email ?? '—'}</div>
 <div><b>UID:</b> {user?.uid ? user.uid.slice(0, 8) + '...' : '—'}</div>
 </div>
 </div>
 </header>

 {/* Cards grid – mobile 1col, tablet 2col */}
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <DashCard
 emoji="📋"
 title="My Listings"
 text="Manage your services, photos and pricing."
 href="/dashboard/master/listings"
 cta="Manage Listings"
 />
 <DashCard
 emoji="👤"
 title="My Profile"
 text="Edit profile, photos and social links."
 href="/profile/edit" // correct path
 cta="Edit Profile"
 />
 <DashCard
 emoji="📅"
 title="Bookings"
 text="Manage booking requests"
 href="/dashboard/bookings"
 cta="Open"
 />
 <DashCard
 emoji="⚙️"
 title="Settings"
 text="General preferences."
 href="/settings"
 cta="Open Settings"
 />
 </div>
 </div>
 );
}

function DashCard({
 emoji,
 title,
 text,
 href,
 cta,
}: {
 emoji: string;
 title: string;
 text: string;
 href: string;
 cta: string;
}) {
 return (
 <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
 <div className="mb-2 flex items-center gap-2">
 <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-600/10 text-lg">
 {emoji}
 </span>
 <h3 className="text-base font-semibold text-gray-900">{title}</h3>
 </div>
 <p className="mb-3 text-sm text-gray-600">{text}</p>
 <Link
 href={href}
 className="inline-flex rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
 >
 {cta}
 </Link>
 </div>
 );
}