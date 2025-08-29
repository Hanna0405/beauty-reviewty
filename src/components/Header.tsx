'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UserAvatarMenu from '@/components/UserAvatarMenu';

const LANGS = ['EN', 'RU', 'TJ'] as const;
type Lang = typeof LANGS[number];

export default function Header() {
 const { user, loading } = useAuth(); // ← берём юзера из контекста
 const [lang, setLang] = useState<Lang>('EN');
 const [openLang, setOpenLang] = useState(false);

 return (
 <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-b">
 <div className="mx-auto h-14 max-w-6xl px-4 flex items-center justify-between">
 {/* Лого (домой) */}
 <Link href="/" className="font-semibold text-lg hover:opacity-80">
 BeautyReviewty
 </Link>

 {/* Правый блок */}
 <div className="flex items-center gap-3">
 <Link href="/masters" className="text-sm hover:underline">
 Masters
 </Link>

 {/* Язык */}
 <div className="relative">
 <button
 onClick={() => setOpenLang(!openLang)}
 className="rounded-md border px-2 py-1 text-sm"
 >
 {lang}
 </button>
 {openLang && (
 <div className="absolute right-0 mt-2 w-24 rounded-md border bg-white shadow z-[1000]">
 {LANGS.map(l => (
 <button
 key={l}
 onClick={() => { setLang(l); setOpenLang(false); }}
 className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-50"
 >
 {l}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Вход / Аватар */}
 {loading ? null : user ? (
 <UserAvatarMenu />
 ) : (
 <Link
 href="/auth/login"
 className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
 >
 Log in
 </Link>
 )}
 </div>
 </div>
 </header>
 );
}
