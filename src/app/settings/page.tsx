'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Settings UI lives at /dashboard/settings (working hours, notifications, delete account). */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings');
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-sm text-gray-500">
      Redirecting to settings…
    </div>
  );
}
