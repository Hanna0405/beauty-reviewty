"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import AuthProvider to prevent server-side execution
const AuthProvider = dynamic(() => import("@/contexts/AuthContext").then(mod => ({ default: mod.AuthProvider })), {
  ssr: false,
  loading: () => null
});

export default function Providers({ children }: { children: React.ReactNode }) {
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
   setMounted(true);
 }, []);

 if (!mounted) {
   return <>{children}</>;
 }

 return <AuthProvider>{children}</AuthProvider>;
}