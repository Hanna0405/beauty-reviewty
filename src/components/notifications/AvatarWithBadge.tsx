"use client";
import React from "react";
import { useNotificationsBadge } from "./useNotificationsBadge";
import { Avatar } from "@/components/ui/Avatar";

export function AvatarWithBadge({ user }: { user: { uid: string; role: "master"|"client"; name?: string } }) {
 const { count } = useNotificationsBadge(user?.uid, user?.role);
 return (
 <div className="relative inline-block">
 <Avatar name={user?.name || "User"} size={36} />
 {!!count && (
 <span
 className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[11px] leading-none px-1.5 py-0.5 border-2 border-white"
 title={`${count} unread`}
 >
 {count}
 </span>
 )}
 </div>
 );
}
