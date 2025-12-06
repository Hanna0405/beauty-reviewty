"use client";

import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Terms of Service</h1>

        {/* Last updated */}
        <p className="text-sm text-gray-500 mb-8">Last updated: {currentDate}</p>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <p>
            Welcome to BeautyReviewty! These Terms of Service ("Terms") govern your access to and use of the BeautyReviewty website, services, and user-generated content ("Services"). By accessing or using the Services, you agree to be bound by these Terms.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">1. User-Generated Content</h3>
          <p>
            Users may post reviews, photos, and other materials. All submitted content remains the intellectual property of its creator. By submitting content, you grant BeautyReviewty a non-exclusive, worldwide, royalty-free license to use, display, store, and distribute the material within the platform.
          </p>
          <p>
            Users are fully responsible for the accuracy, legality, and authenticity of the submitted content.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">2. Prohibited Activities</h3>
          <p>Users agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Post false, misleading, or defamatory content</li>
            <li>Upload copyrighted material without rights</li>
            <li>Impersonate others or share personal/private data of third parties</li>
            <li>Engage in harassment, abuse, discrimination, or illegal activity</li>
          </ul>
          <p className="mt-4">
            BeautyReviewty may remove or restrict content that violates these Terms or applicable laws.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">3. Booking and Services Provided by Masters</h3>
          <p>
            BeautyReviewty does not provide beauty services and is not a party to any transactions between users and masters. Any agreements, payments, disputes, or outcomes of services obtained outside our platform are the responsibility of the involved parties.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">4. Platform Availability</h3>
          <p>
            We strive to provide reliable service but do not guarantee uninterrupted or error-free operation. Maintenance or external factors may affect access.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">5. Account Security</h3>
          <p>
            Users must protect their login credentials and notify us if unauthorized access is suspected. The user is responsible for any activity performed under their account.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">6. Age Requirements</h3>
          <p>
            The Services are intended for users 13+ years old. Users under legal age must have permission from a parent or guardian.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">7. Modifications</h3>
          <p>
            BeautyReviewty may update these Terms to reflect improvements or legal requirements. Continued use after changes means acceptance of the updated Terms.
          </p>

          <hr className="border-gray-300 my-8" />

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">8. Contact</h3>
          <p>
            If you have questions about these Terms, please contact:
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

