"use client";

import Link from "next/link";

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header with back link */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-pink-600 hover:text-pink-700 hover:underline mb-4 inline-block"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Privacy Policy</h1>

        {/* Last updated */}
        <p className="text-sm text-gray-500 mb-8">Last updated: {currentDate}</p>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <p>
            BeautyReviewty ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services ("Services").
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h3>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Account information (name, email, phone number if provided)</li>
            <li>Profile and review content (text, ratings, photos, location related to services)</li>
            <li>Technical data (IP address, browser type, device information, approximate location)</li>
            <li>Usage data (pages visited, actions on the platform, clicks and interactions)</li>
          </ul>
          <p className="mt-4">
            If you sign in with Google or other providers, we receive basic profile information that you authorize (such as name, email, and profile picture).
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h3>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Create and manage your account</li>
            <li>Display your reviews, ratings, photos, and profile information</li>
            <li>Help users find beauty masters and services based on filters and location</li>
            <li>Improve and protect our Services</li>
            <li>Communicate important updates, notifications, and service-related emails</li>
            <li>Prevent abuse, fraud, and violations of our Terms of Service</li>
          </ul>
          <p className="mt-4">
            We do not sell your personal information.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">3. Cookies and Analytics</h3>
          <p>We may use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Keep you logged in</li>
            <li>Remember your preferences</li>
            <li>Analyze how users interact with the platform</li>
          </ul>
          <p className="mt-4">
            You can control cookies through your browser settings, but some features of the Services may not work properly if cookies are disabled.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">4. User-Generated Content</h3>
          <p>
            When you post reviews, photos, or other content, this information may become publicly visible on the platform. Please do not share sensitive personal data in public content.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">5. Sharing of Information</h3>
          <p>We may share information with:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Service providers that help us operate the platform (for example, hosting, email delivery, analytics)</li>
            <li>Authorities or third parties when required by law or to protect our rights, users, or the public</li>
          </ul>
          <p className="mt-4">
            We do not share your personal information for unrelated marketing by third parties.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">6. Data Security</h3>
          <p>
            We take reasonable technical and organizational measures to protect your information from unauthorized access, loss, or misuse. However, no method of transmission or storage is completely secure.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h3>
          <p>
            We retain personal data for as long as it is necessary to provide our Services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account, and we will delete or anonymize your data where legally possible.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">8. Your Rights</h3>
          <p>
            Depending on your location, you may have rights to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Access personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your data, where applicable</li>
            <li>Object to or restrict certain types of processing</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us using the details below.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">9. Children's Privacy</h3>
          <p>
            Our Services are not intended for children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete it.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will update the "Last updated" date when changes are made. Continued use of the Services after changes means you accept the updated Policy.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy or your data, please contact us at:
          </p>
          <p className="mt-2">
            <a
              href="mailto:support@beautyreviewty.app"
              className="text-pink-600 hover:text-pink-700 hover:underline"
            >
              support@beautyreviewty.app
            </a>
          </p>
        </div>

        {/* Footer spacing */}
        <div className="py-8"></div>
      </div>
    </div>
  );
}

