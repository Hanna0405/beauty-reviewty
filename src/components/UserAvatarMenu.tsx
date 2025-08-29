'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth-helpers';

function initialsFrom(name?: string | null, email?: string | null) {
 if (name && name.trim()) {
 const parts = name.trim().split(/\s+/).slice(0, 2);
 const a = parts[0]?.[0]?.toUpperCase() ?? '';
 const b = parts[1]?.[0]?.toUpperCase() ?? '';
 return (a + b) || 'U';
 }
 if (email) {
 const local = email.split('@')[0] || '';
 const segs = local.split(/[._-]+/).filter(Boolean);
 if (segs.length === 0) return (local[0] || 'U').toUpperCase();
 if (segs.length === 1) return (segs[0][0] || 'U').toUpperCase();
 return (segs[0][0] + segs[segs.length - 1][0]).toUpperCase();
 }
 return 'U';
}

export default function UserAvatarMenu() {
 const { user, role, loading } = useAuth();
 const [open, setOpen] = useState(false);
 const [imgOk, setImgOk] = useState(true);
 const ref = useRef<HTMLDivElement>(null);

 // закрываем меню по клику вне
 useEffect(() => {
 const onDocClick = (e: MouseEvent) => {
 if (!ref.current) return;
 if (!ref.current.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener('mousedown', onDocClick);
 return () => document.removeEventListener('mousedown', onDocClick);
 }, []);

 if (loading) return <div className="text-sm text-gray-500">Loading…</div>;

 // Не авторизован
 if (!user) {
 return (
 <Link href="/auth" className="px-3 py-1.5 border rounded text-sm font-medium hover:bg-gray-50">
 Log in / Sign up
 </Link>
 );
 }

 const initials = initialsFrom(user.displayName, user.email);
 const photo = user.photoURL || '';

 return (
 <div className="relative" ref={ref}>
 <button
 onClick={() => setOpen(v => !v)}
 className="flex items-center gap-2"
 aria-haspopup="menu"
 aria-expanded={open}
 title={user.displayName ?? user.email ?? 'Account'}
 >
 {photo && imgOk ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={photo}
 alt="avatar"
 className="h-9 w-9 rounded-full object-cover"
 referrerPolicy="no-referrer"
 onError={() => setImgOk(false)}
 />
 ) : (
 <div className="h-9 w-9 rounded-full bg-gray-200 grid place-items-center text-sm font-semibold">
 {initials}
 </div>
 )}
 <span className="hidden sm:inline text-sm">{user.displayName || user.email}</span>
 </button>

 {open && (
 <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg z-50" role="menu">
 <div className="px-3 py-2 border-b">
 <div className="text-sm font-medium truncate">{user.displayName || user.email}</div>
 <div className="text-xs text-gray-500">Role: {role ?? '—'}</div>
 </div>

 <div className="py-1 text-sm">
 {role === 'master' ? (
 <>
 <Link href="/dashboard/master" className="block px-3 py-2 hover:bg-gray-50" role="menuitem">
 Dashboard (Master)
 </Link>
 <Link href="/dashboard/master/profile/new" className="block px-3 py-2 hover:bg-gray-50" role="menuitem">
 Create profile
 </Link>
 </>
 ) : (
 <>
 <Link href="/dashboard/client" className="block px-3 py-2 hover:bg-gray-50" role="menuitem">
 Dashboard (Client)
 </Link>
 <Link href="/masters" className="block px-3 py-2 hover:bg-gray-50" role="menuitem">
 Find masters
 </Link>
 </>
 )}

 <button
 onClick={async () => {
 await signOut();
 window.location.href = '/';
 }}
 className="w-full text-left px-3 py-2 hover:bg-gray-50"
 role="menuitem"
 >
 Sign out
 </button>
 </div>
 </div>
 )}
 </div>
 );
}