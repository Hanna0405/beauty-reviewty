"use client";

import React from "react";
import { initialsFrom } from "@/lib/initials";

export function UserAvatar({ nameOrEmail, className = "" }: { nameOrEmail?: string | null; className?: string }) {
 const initials = initialsFrom(nameOrEmail);
 return (
 <div
 className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white ring-1 ring-white/30 ${className}`}
 aria-label="User avatar"
 title={nameOrEmail ?? "User"}
 >
 {initials}
 </div>
 );
}
