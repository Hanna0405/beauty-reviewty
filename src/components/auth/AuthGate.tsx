"use client";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function AuthGate({
  children,
  requireAuth = false,
  returnTo = "/",
  loadingFallback = null,
}: {
  children: ReactNode;
  requireAuth?: boolean;
  returnTo?: string;
  loadingFallback?: ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) {
    return loadingFallback ?? <div style={{ padding: 16 }}>Loading…</div>;
  }
  if (requireAuth && !user) {
    const ret = encodeURIComponent(returnTo);
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 8 }}>You're not signed in.</div>
        <a href={`/login?returnTo=${ret}`} style={{ padding: "10px 16px", display: "inline-block", borderRadius: 8, textDecoration: "none", background: "#ef4a84", color: "white" }}>
          Sign in
        </a>
      </div>
    );
  }
  return <>{children}</>;
}
