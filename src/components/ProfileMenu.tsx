'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileMenu() {
 const { user, profile, role, logout } = useAuth();
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);
 const pathname = usePathname();

 useEffect(() => {
 // Close when route changes
 setOpen(false);
 }, [pathname]);

 useEffect(() => {
 // Close when clicking outside
 const onDocClick = (e: MouseEvent) => {
 if (!ref.current) return;
 if (!ref.current.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener('click', onDocClick);
 return () => document.removeEventListener('click', onDocClick);
 }, []);

 const handleLogout = async () => {
 await logout();
 setOpen(false);
 };

 const initials = profile?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';

 return (
 <div ref={ref} className="relative">
 <button
 aria-label="Open profile menu"
 onClick={() => setOpen((v) => !v)}
 className="flex items-center justify-center h-9 w-9 rounded-full bg-pink-500 text-white font-semibold"
 >
 {initials}
 </button>

 {open && (
 <div className="absolute right-0 mt-2 w-44 rounded-lg border bg-white shadow-lg p-1">
 <div className="px-3 py-2 text-sm text-gray-500 truncate">{profile?.displayName ?? 'Profile'}</div>
 <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
 <Link href="/profile" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">My profile</Link>
 <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Log out</button>
 </div>
 )}
 </div>
 );
}