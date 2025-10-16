"use client";
import React from "react";
import { useNotificationsBadge } from "./useNotificationsBadge";
import { Avatar } from "@/components/ui/Avatar";

type AvatarWithBadgeProps = {
  user: {
    uid: string;
    role: "master" | "client";
    name?: string;
    photoURL?: string | null;
    avatarUrl?: string | null;
    avatar?: { url?: string };
  };
};

export function AvatarWithBadge({ user }: AvatarWithBadgeProps) {
  const { count } = useNotificationsBadge(user?.uid, user?.role);
  return (
    <div className="relative inline-block">
      <Avatar
        name={user?.name || "User"}
        size={36}
        photoURL={user?.photoURL}
        avatarUrl={user?.avatarUrl}
        avatar={user?.avatar}
      />
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
