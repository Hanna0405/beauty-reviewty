import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: { absolute: 'BeautyReviewty Support' },
  description:
    'Contact BeautyReviewty support for help with bookings, reviews, listings, accounts, and technical issues.',
};

export default function SupportPage() {
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
          BeautyReviewty Support
        </h1>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <p>Need help with BeautyReviewty?</p>

          <div>
            <p className="font-medium text-gray-900">Contact us:</p>
            <p>
              <a
                href="mailto:support@beautyreviewty.com"
                className="text-pink-600 hover:text-pink-700 hover:underline"
              >
                support@beautyreviewty.com
              </a>
            </p>
          </div>

          <p>We typically respond within 1–2 business days.</p>

          <div>
            <p className="font-medium text-gray-900 mb-2">Common issues:</p>
            <ul className="list-none space-y-1 pl-0">
              <li>• Account access</li>
              <li>• Booking issues</li>
              <li>• Reviews and ratings</li>
              <li>• Listing management</li>
              <li>• Technical problems</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-gray-900 mb-2">Useful links:</p>
            <ul className="list-none space-y-2 pl-0">
              <li>
                <Link
                  href="/privacy"
                  className="text-pink-600 hover:text-pink-700 hover:underline"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-pink-600 hover:text-pink-700 hover:underline"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-8" />
      </div>
    </div>
  );
}
