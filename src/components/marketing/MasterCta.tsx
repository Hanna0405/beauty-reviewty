import Link from 'next/link';

export default function MasterCta() {
  return (
    <div className="w-full mx-auto max-w-5xl rounded-2xl bg-white/90 border border-rose-100 p-5 md:p-6 text-center shadow-sm">
      <p className="text-rose-800 font-semibold text-base md:text-lg">
        Are you a beauty master? Create your free profile today!
      </p>
      <div className="mt-3">
        <Link
          href="/signup?role=master"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 transition"
        >
          Join Now
        </Link>
      </div>
    </div>
  );
}
