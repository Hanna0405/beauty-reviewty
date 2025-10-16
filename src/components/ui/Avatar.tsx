"use client";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

type AvatarProps = {
  name?: string;
  size?: number;
  photoURL?: string | null;
  avatarUrl?: string | null;
  avatar?: { url?: string };
  profile?: {
    photoURL?: string | null;
    avatarUrl?: string | null;
    avatar?: { url?: string };
    displayName?: string;
  };
};

export function Avatar({ name, size = 36, photoURL, avatarUrl, avatar, profile }: AvatarProps) {
  const [authPhoto, setAuthPhoto] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthPhoto(u?.photoURL ?? null);
    });
    return () => unsub();
  }, []);

  const src =
    authPhoto ||
    photoURL ||
    avatarUrl ||
    avatar?.url ||
    profile?.photoURL ||
    profile?.avatarUrl ||
    profile?.avatar?.url ||
    null;

  if (!src) {
    const initial =
      profile?.displayName?.[0] ||
      name?.[0] ||
      'U';
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full text-white font-medium uppercase"
      style={{ 
        width: size, 
        height: size, 
        minWidth: size,
        fontSize: Math.max(12, Math.floor(size * 0.42)),
        background: 'linear-gradient(135deg,#f8a8c5 0%,#ff7eb9 100%)' 
      }}>
        {initial}
      </div>
    );
  }

  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name || "User"}
        className="rounded-full object-cover"
        style={{ width: size, height: size, minWidth: size }}
        title={name}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-pink-200 text-pink-900 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        minWidth: size,
        fontSize: Math.max(12, Math.floor(size * 0.42)),
      }}
      aria-label={name}
      title={name}
    >
      {initials || "?"}
    </div>
  );
}
