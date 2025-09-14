'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface RequireRoleProps {
  children: ReactNode;
  role: "master" | "client";
  fallback?: ReactNode;
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
    </div>
  );
}

// RequireAuth component - ensures user is authenticated
export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return fallback ? <>{fallback}</> : <LoadingSpinner />;
  }

  return <>{children}</>;
}

// RequireRole component - ensures user has specific role
export function RequireRole({ children, role, fallback }: RequireRoleProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== role) {
        // User doesn't have the required role, redirect based on their actual role
        if (profile.role === 'master') {
          router.push('/dashboard/master');
        } else {
          router.push('/masters');
        }
      }
    }
  }, [user, profile, loading, role, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return fallback ? <>{fallback}</> : <LoadingSpinner />;
  }

  if (!profile || profile.role !== role) {
    return fallback ? <>{fallback}</> : <LoadingSpinner />;
  }

  return <>{children}</>;
}
