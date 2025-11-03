"use client";

import HeroBanner from "@/components/hero/HeroBanner";
import BannerExtrasClient from "@/components/marketing/BannerExtrasClient";
import FeaturedMastersRow from "@/components/marketing/FeaturedMastersRow";
import LatestReviewsCarousel from "@/components/home/LatestReviewsCarousel";
import ListingCarousel from "@/components/home/ListingCarousel";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [latestReviews, setLatestReviews] = useState<any[]>([]);
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);

  useEffect(() => {
    // Load data on client side
    const loadData = async () => {
      try {
        const [reviews, listings] = await Promise.all([
          import("@/app/(public)/homeData/buildLatestReviewCards").then(m => m.buildLatestReviewCards()),
          import("@/app/(public)/homeData/getFeaturedListings").then(m => m.getFeaturedListings(10)),
        ]);
        setLatestReviews(reviews);
        setFeaturedListings(listings);
      } catch (error) {
        console.error("Failed to load home data:", error);
      }
    };
    loadData();
  }, []);

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
        <BannerExtrasClient
          showSearch={false}
          showCategories={false}
          showCta={true}
        />
      </section>

      {/* Real reviews carousel */}
      <section className="container mx-auto px-4 mt-8 md:mt-12">
        <div className="rounded-3xl bg-rose-50/40 border border-rose-100 shadow-sm p-4 md:p-6">
          <LatestReviewsCarousel items={latestReviews} />
        </div>
      </section>
    </main>
  );
}
