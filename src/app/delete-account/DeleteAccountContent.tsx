'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function DeleteAccountContent() {
  const { user } = useAuth();
  const settingsHref = user ? '/dashboard/settings' : '/login';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-pink-600 hover:text-pink-700 hover:underline mb-4 inline-block"
          >
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Delete Your BeautyReviewty Account
        </h1>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <p>To delete your account:</p>

          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>Log in to your BeautyReviewty account.</li>
            <li>Open Settings.</li>
            <li>Scroll to the Delete Account section.</li>
            <li>Click &quot;Delete Account&quot;.</li>
            <li>Confirm deletion.</li>
          </ol>

          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
            Data deleted when an account is removed:
          </h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Profile information</li>
            <li>Listings</li>
            <li>Reviews created by the account</li>
            <li>Booking history</li>
            <li>Chat messages</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Need help?</h2>
          <p>
            Contact:{' '}
            <a
              href="mailto:hello@beautyreviewty.com"
              className="text-pink-600 hover:text-pink-700 hover:underline"
            >
              hello@beautyreviewty.com
            </a>
          </p>

          <div className="pt-4">
            <Link
              href={settingsHref}
              className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 transition-colors"
            >
              Open Settings
            </Link>
          </div>
        </div>

        <div className="py-8" />
      </div>
    </div>
  );
}
