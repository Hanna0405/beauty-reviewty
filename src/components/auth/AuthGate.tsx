"use client";
import { ReactNode } from "react";
import { useAuthState } from "@/context/AuthContext";

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
  const auth = useAuthState();
  if (auth.status === "loading") {
    return loadingFallback ?? <div style={{ padding: 16 }}>Loading…</div>;
  }
  if (requireAuth && auth.status === "guest") {
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
