import React from "react";

export function Avatar({ name, size=36 }: { name?: string; size?: number }) {
 const initials = (name || "?")
 .split(" ")
 .filter(Boolean)
 .slice(0,2)
 .map(w=>w[0]?.toUpperCase())
 .join("");
 return (
 <div
 className="rounded-full bg-pink-200 text-pink-900 flex items-center justify-center"
 style={{ width: size, height: size, minWidth: size, fontSize: Math.max(12, Math.floor(size*0.42)) }}
 aria-label={name}
 title={name}
 >
 {initials || "?"}
 </div>
 );
}
