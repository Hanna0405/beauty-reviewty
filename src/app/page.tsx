import Link from 'next/link';
import ReviewsList from '@/components/ReviewsList';

export default function Home() {
  return (
    <main>
      <section>
        <div>
          <Link
            href="/auth"
            className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:bg-pink-700"
          >
            Register
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
        <ReviewsList />
      </section>
    </main>
  );
}
