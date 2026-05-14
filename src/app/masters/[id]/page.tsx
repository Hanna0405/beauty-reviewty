import type { Metadata } from "next";
import React from "react";
import ClientListing from "./ClientListing";
import { buildMasterListingMetadata } from "./buildListingMetadata";
import { buildListingJsonLd } from "./buildListingJsonLd";
import { loadMasterListingPageData } from "./loadMasterListingPageData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildMasterListingMetadata(id);
}

// Next.js 15: params is now a Promise and must be awaited
export default async function MastersListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { listing, profile } = await loadMasterListingPageData(id);
  const jsonLd = listing ? buildListingJsonLd(id, listing, profile) : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ClientListing id={id} />
    </>
  );
}
