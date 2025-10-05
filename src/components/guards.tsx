'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

export function RequireAuth({ children }: { children: ReactNode }) {
const { user, loading } = useAuth();
const router = useRouter();
useEffect(() => {
if (!loading && !user) router.replace('/auth');
}, [loading, user, router]);
if (!user) return null;
return <>{children}</>;
}

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
const { user, loading } = useAuth();
const router = useRouter();
useEffect(() => {
if (!loading && !user) router.replace('/auth');
}, [loading, user, router]);
if (!user) return null;
return <>{children}</>;
}