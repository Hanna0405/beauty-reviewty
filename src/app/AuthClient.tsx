"use client";
import { AuthProvider } from "@/context/AuthContext";
export default function AuthClient({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
