import Link from 'next/link';

export default function MasterCta() {
  return (
    <div className="w-full mx-auto max-w-5xl rounded-2xl bg-white/90 border border-pink-100 p-5 md:p-6 text-center shadow-sm">
      <p className="text-gray-900 font-semibold text-base md:text-lg">
        Are you a beauty master? Create your <span className="font-semibold text-pink-600">FREE</span> profile today!
      </p>
      <div className="mt-3">
        <Link
          href="/signup?role=master"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-pink-500 bg-pink-500 text-white hover:bg-pink-600 transition text-sm font-medium"
        >
          Join Now
        </Link>
      </div>
    </div>
  );
}
