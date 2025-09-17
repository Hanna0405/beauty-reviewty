import Link from 'next/link';

export default function MasterCtaHero() {
  return (
    <div className="w-full rounded-3xl bg-rose-50/90 border border-rose-100 p-5 md:p-7 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-rose-900 font-semibold text-lg md:text-xl">
          Are you a beauty master? Create your free profile today!
        </p>
        <Link
          href="/signup?role=master"
          className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-rose-600 text-white text-base md:text-lg font-semibold shadow-sm hover:bg-rose-700 active:bg-rose-800 transition relative overflow-hidden animate-glow"
          aria-label="Join as a beauty master"
        >
          Join Now
        </Link>
      </div>
    </div>
  );
}
