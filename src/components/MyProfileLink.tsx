'use client';

import Link from 'next/link';
import { useCurrentUserOrRedirect } from '@/hooks/useCurrentUserOrRedirect';

export default function MyProfileLink() {
  const { user, loading } = useCurrentUserOrRedirect();

  // Don't render if not authenticated or still loading
  if (loading || !user) {
    return null;
  }

  return (
    <Link
      href="/dashboard/master/profile"
      className="text-gray-700 hover:text-pink-600 transition-colors font-medium flex items-center"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      My Profile
    </Link>
  );
}
