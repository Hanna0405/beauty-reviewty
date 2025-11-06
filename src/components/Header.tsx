"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
 const { user } = useAuth();

 return (
 <header className="w-full bg-white/90 border-b border-pink-100 backdrop-blur-sm">
 <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-6">
 {/* left */}
 <div className="flex items-center gap-6">
 <Link
 href="/"
 className="flex items-center justify-center w-9 h-9 rounded-full bg-pink-500 text-white font-semibold text-sm"
 >
 BR
 </Link>

 <nav className="flex items-center gap-4 text-sm text-pink-950/85">
 <Link href="/masters" className="hover:text-pink-500 transition">
 Masters
 </Link>
 <Link href="/reviewty" className="hover:text-pink-500 transition">
 Reviewty
 </Link>
 </nav>
 </div>

 {/* right */}
 <div className="flex items-center gap-3">
 {user ? (
 <>
 <Link
 href="/dashboard"
 className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-900 font-semibold uppercase text-sm"
 >
 {user.displayName?.slice(0, 1) || "U"}
 </Link>
 <button
 // onClick={logout} // TODO: Add logout function to AuthContext
 className="text-xs text-pink-700 hover:text-pink-500 transition"
 >
 Log out
 </button>
 </>
 ) : (
 <>
 <Link
 href="/login"
 className="text-sm text-pink-900 hover:text-pink-500 transition"
 >
 Log in
 </Link>
 <Link
 href="/signup"
 className="text-sm bg-pink-500 text-white rounded-full px-4 py-1.5 hover:bg-pink-600 transition"
 >
 Sign up
 </Link>
 </>
 )}
 </div>
 </div>
 </header>
 );
}
