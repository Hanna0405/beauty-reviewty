"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireRole({
 role,
 children,
}: {
 role: "master" | "client" | "admin";
 children: React.ReactNode;
}) {
 const { user, role: currentRole, loading } = useAuth();
 const router = useRouter();

 useEffect(() => {
 if (loading) return;
 if (!user) {
 router.replace("/auth/login");
 return;
 }
 if (role !== currentRole && currentRole !== "admin") {
 // Not allowed here → send to profile
 router.replace("/profile");
 }
 }, [loading, user, currentRole, role, router]);

 if (loading) return null; // don't flash

 return <>{children}</>;
}
