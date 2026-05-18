import type { Metadata } from "next";
import React from "react";
import RelatedMastersSections from "@/components/seo/RelatedMastersSections";
import { loadRelatedMasterLinks } from "@/lib/seo/loadRelatedMasters";
import ClientListing from "@/app/masters/[id]/ClientListing";
import { buildListingJsonLd } from "@/app/masters/[id]/buildListingJsonLd";
import ListingSeoContent from "@/app/masters/[id]/ListingSeoContent";
import { loadMasterListingPageData } from "@/app/masters/[id]/loadMasterListingPageData";
import type { ClientListingInitialData } from "@/app/masters/[id]/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    alternates: {
      canonical: `/masters/${id}`,
    },
  };
}

// Next.js 15: params is now a Promise and must be awaited
export default async function ListingOpenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { listing, profile, reviews } = await loadMasterListingPageData(id);
  const relatedMasters =
    listing || profile
      ? await loadRelatedMasterLinks({ profile, listing, pageId: id })
      : { nearby: [], similarServices: [] };

  const initial: ClientListingInitialData | null = listing
    ? {
        listing,
        profile,
        reviews: reviews.reviews,
        avgRating: reviews.avgRating,
        totalReviews: reviews.totalReviews,
      }
    : null;

  const jsonLd = listing
    ? buildListingJsonLd(id, listing, profile, reviews)
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      {listing ? (
        <ListingSeoContent
          listing={listing}
          avgRating={reviews.avgRating}
          totalReviews={reviews.totalReviews}
        />
      ) : null}
      <ClientListing id={id} initial={initial} />
      <div className="container mx-auto min-w-0 px-4 pb-8">
        <RelatedMastersSections {...relatedMasters} />
      </div>
    </>
  );
}
