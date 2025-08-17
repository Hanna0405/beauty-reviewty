import Link from 'next/link';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div>
      <Header />

      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect <span className="block text-pink-200">Beauty Master</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-pink-100 max-w-3xl mx-auto">
            Discover talented beauty professionals in your area. From hair styling to makeup,
            find the perfect expert for your beauty needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/masters"
              className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-pink-50 transition"
            >
              Browse Masters
            </Link>
          </div>

          <div className="flex justify-center mt-10">
            <Link
              href="/auth"
              className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:bg-pink-700 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
