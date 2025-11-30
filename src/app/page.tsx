import BannerExtrasClient from "@/components/marketing/BannerExtrasClient";
import MasterCta from "@/components/marketing/MasterCta";
import FeaturedMastersRow from "@/components/marketing/FeaturedMastersRow";
import LatestReviewsCarousel from "@/components/home/LatestReviewsCarousel";
import ListingCarousel from "@/components/home/ListingCarousel";
import { buildLatestReviewCards } from "@/app/(public)/homeData/buildLatestReviewCards";
import { getFeaturedListings } from "@/app/(public)/homeData/getFeaturedListings";

export default async function HomePage() {
  // Fetch data on the server
  const [latestReviews, featuredListings] = await Promise.all([
    buildLatestReviewCards(),
    getFeaturedListings(10),
  ]);

  return (
    <main className="container mx-auto px-4 py-8 space-y-10">
      {/* Unified Hero Block */}
      <section className="container mx-auto px-4 mt-6 md:mt-10">
        <div
          className="rounded-3xl shadow-sm border border-rose-100 overflow-hidden
          bg-gradient-to-r from-rose-50 via-rose-50/70 to-white"
        >
          <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-8 p-5 md:p-8">
            {/* Left: text & buttons */}
            <div className="md:basis-1/2 flex flex-col justify-center">
              <h1 className="text-2xl md:text-3xl font-bold text-rose-900">
                Find your perfect beauty master
              </h1>
              <p className="mt-2 text-rose-700/80">
                Search by city, services, and language. Read real reviews with
                photos.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="/masters"
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                >
                  Browse Masters
                </a>
                <a
                  href="/reviewty"
                  className="px-4 py-2 rounded-lg bg-rose-200 text-rose-800 hover:bg-rose-300 transition"
                >
                  Reviewty
                </a>
              </div>
            </div>

            {/* Right: 3 compact cards in one row */}
            <div className="md:basis-1/2">
              <FeaturedMastersRow />
            </div>
          </div>

          {/* Featured Listings Carousel */}
          <div className="px-5 md:px-8 pb-5 md:pb-8 mt-4">
            <ListingCarousel items={featuredListings} />
          </div>
        </div>
      </section>

      {/* Master CTA */}
      <section className="container mx-auto px-4 mt-6 md:mt-8">
        <MasterCta />
      </section>

      {/* Banner extras (categories only, NO search, NO CTA) */}
      <section className="container mx-auto px-4 mt-4 md:mt-6">
        <BannerExtrasClient
          showSearch={false}
          showCategories={true}
          showCta={false}
        />
      </section>

      {/* Real reviews carousel */}
      <section className="container mx-auto px-4 mt-8 md:mt-12">
        <div className="rounded-3xl bg-rose-50/40 border border-rose-100 shadow-sm p-4 md:p-6">
          <LatestReviewsCarousel items={latestReviews} />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 mb-10 flex flex-col items-center text-center text-rose-700">
        {/* Social icons */}
        <div className="flex items-center gap-6 mb-4">
          {/* Instagram */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:opacity-80 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
            >
              <defs>
                <linearGradient
                  id="ig-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#feda75" />
                  <stop offset="25%" stopColor="#fa7e1e" />
                  <stop offset="50%" stopColor="#d62976" />
                  <stop offset="75%" stopColor="#962fbf" />
                  <stop offset="100%" stopColor="#4f5bd5" />
                </linearGradient>
              </defs>
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="6"
                fill="url(#ig-gradient)"
              />
              <circle cx="12" cy="12" r="4.2" fill="#fff" />
              <circle cx="17" cy="7.5" r="1.1" fill="#fff" />
            </svg>
          </a>

          {/* TikTok */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="hover:opacity-80 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
            >
              {/* Black rounded background */}
              <rect x="2" y="2" width="20" height="20" rx="6" fill="#000000" />

              {/* Pink accent circle */}
              <circle cx="9" cy="16" r="2.4" fill="#ff0050" />

              {/* Cyan accent circle */}
              <circle cx="15.5" cy="9" r="1.6" fill="#00f2ea" />

              {/* White musical note */}
              <path
                d="M13.5 6v8.5a3.2 3.2 0 11-1.8-2.9V6h1.8z"
                fill="#ffffff"
              />
            </svg>
          </a>

          {/* Facebook */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:opacity-80 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="2" width="20" height="20" rx="6" fill="#1877F2" />
              <path
                d="M13.4 18.5v-4.9h1.6l.3-2h-1.9V9.9c0-.6.2-1 .9-1h1.1V7.1h-1.8A2.7 2.7 0 0011.4 10v1.6H10v2h1.4v4.9h2z"
                fill="#ffffff"
              />
            </svg>
          </a>
        </div>

        {/* Contact */}
        <div className="text-sm">
          Contact us:{" "}
          <a
            href="mailto:hello@beautyreviewty.app"
            className="underline hover:opacity-80 transition"
          >
            hello@beautyreviewty.app
          </a>
        </div>
      </footer>
    </main>
  );
}
