import type { Metadata } from "next";
import { buildMasterListingMetadata } from "@/app/masters/[id]/buildListingMetadata";
import { buildListingJsonLd } from "@/app/masters/[id]/buildListingJsonLd";
import { loadMasterListingPageData } from "@/app/masters/[id]/loadMasterListingPageData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildMasterListingMetadata(id, {
    canonicalPath: `/masters/${id}`,
    ogImagePath: `/listings/${id}/opengraph-image`,
  });
}

export default async function ListingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let jsonLd: Record<string, unknown> | null = null;

  try {
    const { listing, profile, reviews } = await loadMasterListingPageData(id);
    jsonLd = listing ? buildListingJsonLd(id, listing, profile, reviews) : null;
  } catch (error) {
    console.warn("[listings/[id]] Failed to build JSON-LD:", error);
  }

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      {children}
    </>
  );
}
