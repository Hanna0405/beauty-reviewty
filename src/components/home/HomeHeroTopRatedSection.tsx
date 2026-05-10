"use client";

import { useEffect, useMemo, useState } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeCategoryPills from "@/components/home/HomeCategoryPills";
import FeaturedMastersRow from "@/components/marketing/FeaturedMastersRow";
import {
  fetchTopRatedMastersRows,
  pickHeroFromTopRatedRows,
  type TopRatedListingRow,
} from "@/components/home/topRatedMastersShared";

export default function HomeHeroTopRatedSection() {
  const [rows, setRows] = useState<TopRatedListingRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchTopRatedMastersRows();
        if (alive) setRows(data);
      } catch {
        if (alive) setRows([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const { latestHeroListing, heroImageUrl, reviewCount, ratingAvg } = useMemo(() => {
    if (!rows || rows.length === 0) {
      return {
        latestHeroListing: null as TopRatedListingRow | null,
        heroImageUrl: null as string | null,
        reviewCount: 0,
        ratingAvg: null as number | null,
      };
    }
    const { listing, heroImageUrl: url } = pickHeroFromTopRatedRows(rows);
    return {
      latestHeroListing: listing,
      heroImageUrl: url,
      reviewCount: listing?.reviewCount ?? 0,
      ratingAvg: listing?.ratingAvgNullable ?? null,
    };
  }, [rows]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.log("hero listing", latestHeroListing);
    console.log("hero image url", heroImageUrl);
  }, [latestHeroListing, heroImageUrl]);

  return (
    <div className="flex flex-col gap-2 sm:gap-2.5">
      <HomeHero
        coverUrl={heroImageUrl}
        reviewCount={reviewCount}
        ratingAvg={ratingAvg}
      />

      <section aria-label="Service categories" className="min-w-0 pt-0">
        <HomeCategoryPills />
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 px-0.5">
          <h2 className="text-base font-semibold text-rose-900">
            Top rated masters
          </h2>
          <a
            href="/masters"
            className="shrink-0 text-sm font-semibold text-pink-600 hover:text-pink-700"
          >
            View all
          </a>
        </div>
        <FeaturedMastersRow prefetchedListings={rows} />
      </section>
    </div>
  );
}
