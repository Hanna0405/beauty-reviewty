import { loadMasterListingPageData } from "@/app/masters/[id]/loadMasterListingPageData";
import { loadMasterProfilePageData } from "@/app/master/[id]/loadMasterProfilePageData";
import type { ListingLike } from "@/lib/listings/presenters";
import type { MasterProfileRecord } from "@/app/master/[id]/loadMasterProfilePageData";

export type OgMasterImageData = {
  profile: MasterProfileRecord | null;
  listing: ListingLike | null;
};

export type OgListingImageData = {
  listing: ListingLike | null;
  profile: Record<string, unknown> | null;
};

/** Same resolution order as the public /master/[id] SSR page, then listing page. */
export async function loadOgMasterImageData(
  rawId: string
): Promise<OgMasterImageData> {
  const id = decodeURIComponent(rawId.trim());

  const masterPage = await loadMasterProfilePageData(id);
  if (masterPage.profile) {
    return {
      profile: masterPage.profile,
      listing: (masterPage.listings[0] as ListingLike | undefined) ?? null,
    };
  }

  const listingPage = await loadMasterListingPageData(id);
  return {
    profile: (listingPage.profile as MasterProfileRecord | null) ?? null,
    listing: listingPage.listing,
  };
}

/** Same data as the public /masters/[id] listing SSR page. */
export async function loadOgListingImageData(
  rawId: string
): Promise<OgListingImageData> {
  const id = decodeURIComponent(rawId.trim());
  const { listing, profile } = await loadMasterListingPageData(id);
  return { listing, profile };
}
