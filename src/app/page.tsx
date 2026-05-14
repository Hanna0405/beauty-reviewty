import type { Metadata } from "next";

import LatestReviewsCarousel from "@/components/home/LatestReviewsCarousel";
import ListingCarousel from "@/components/home/ListingCarousel";
import HomeHeroTopRatedSection from "@/components/home/HomeHeroTopRatedSection";
import HomeSkincareBanner from "@/components/home/HomeSkincareBanner";
import HomeMasterSignupBanner from "@/components/home/HomeMasterSignupBanner";
import { buildLatestReviewCards } from "@/app/(public)/homeData/buildLatestReviewCards";
import { getFeaturedListings } from "@/app/(public)/homeData/getFeaturedListings";

export const metadata: Metadata = {
  title: "Find Beauty Masters Near You",
  description:
    "Find trusted beauty professionals by city, service, language, and real client reviews on BeautyReviewty.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const [latestReviews, featuredListings] = await Promise.all([
    buildLatestReviewCards(),
    getFeaturedListings(10),
  ]);

  return (
    <main className="container mx-auto max-w-xl px-3 pt-2 pb-4 sm:pt-3 sm:pb-5 space-y-3 sm:space-y-4 lg:max-w-6xl lg:px-8 lg:pt-6 lg:pb-10 lg:space-y-6 xl:max-w-7xl">
      <HomeHeroTopRatedSection />

      <section>
        <HomeSkincareBanner />
      </section>

      <section>
        <HomeMasterSignupBanner />
      </section>

      {featuredListings.length > 0 ? (
        <section className="pt-1 lg:pt-3 [&_a.snap-start]:lg:w-[280px] [&_a.snap-start]:xl:w-[300px] [&_.h-40]:lg:h-48">
          <ListingCarousel items={featuredListings} />
        </section>
      ) : null}

      {latestReviews.length > 0 ? (
        <section className="pt-1 pb-4 lg:pt-3 lg:pb-6 [&_article.snap-start]:lg:w-[280px] [&_article.snap-start]:xl:w-[300px] [&_article_.h-40]:lg:h-48">
          <LatestReviewsCarousel items={latestReviews} />
        </section>
      ) : null}
    </main>
  );
}
