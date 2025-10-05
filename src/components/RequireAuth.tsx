'use client';

import React, { PropsWithChildren, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

export default function RequireAuth({ children }: PropsWithChildren) {
 const { user, loading } = useAuth();
 const router = useRouter();
 const pathname = usePathname();

 useEffect(() => {
 if (!loading && !user) {
 const ret = encodeURIComponent(pathname || '/');
 router.push(`/login?returnTo=${ret}`);
 }
 }, [loading, user, pathname, router]);

 if (loading) return null; // optionally render a spinner
 if (!user) return null; // we redirect
 return <>{children}</>;
}
