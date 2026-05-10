import LatestReviewsCarousel from "@/components/home/LatestReviewsCarousel";
import ListingCarousel from "@/components/home/ListingCarousel";
import HomeHeroTopRatedSection from "@/components/home/HomeHeroTopRatedSection";
import HomeSkincareBanner from "@/components/home/HomeSkincareBanner";
import HomeMasterSignupBanner from "@/components/home/HomeMasterSignupBanner";
import { buildLatestReviewCards } from "@/app/(public)/homeData/buildLatestReviewCards";
import { getFeaturedListings } from "@/app/(public)/homeData/getFeaturedListings";

export default async function HomePage() {
  const [latestReviews, featuredListings] = await Promise.all([
    buildLatestReviewCards(),
    getFeaturedListings(10),
  ]);

  return (
    <main className="container mx-auto max-w-xl px-3 pt-2 pb-4 sm:pt-3 sm:pb-5 space-y-3 sm:space-y-4">
      <HomeHeroTopRatedSection />

      <section>
        <HomeSkincareBanner />
      </section>

      <section>
        <HomeMasterSignupBanner />
      </section>

      {featuredListings.length > 0 ? (
        <section className="pt-1">
          <ListingCarousel items={featuredListings} />
        </section>
      ) : null}

      {latestReviews.length > 0 ? (
        <section className="pt-1 pb-4">
          <LatestReviewsCarousel items={latestReviews} />
        </section>
      ) : null}
    </main>
  );
}
