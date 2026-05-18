import { ImageResponse } from "next/og";
import { OG_BRAND, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/constants";
import { renderDefaultOgImage } from "@/lib/og/defaultOgImage";
import {
  listingCity,
  listingServices,
  listingTitle,
  resolveListingPhotoUrl,
} from "@/lib/og/extractOgFields";
import { loadOgListingImageData } from "@/lib/og/loadOgImageData";
import { OgAvatarFallback } from "@/lib/og/OgAvatarFallback";
import { OgBrandBar } from "@/lib/og/OgBrandBar";

export const runtime = "nodejs";
export const alt = "BeautyReviewty listing";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

function ListingOgCard({
  title,
  city,
  services,
  photoUrl,
}: {
  title: string;
  city: string;
  services: string[];
  photoUrl: string | null;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${OG_BRAND.pinkLight} 0%, ${OG_BRAND.white} 60%)`,
        padding: 56,
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "stretch",
          gap: 40,
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            width={420}
            height={420}
            style={{
              borderRadius: 24,
              objectFit: "cover",
              border: `6px solid ${OG_BRAND.pink}`,
              flexShrink: 0,
            }}
          />
        ) : (
          <OgAvatarFallback label={title} size={420} />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              color: OG_BRAND.text,
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            {title}
          </div>

          {city ? (
            <div
              style={{
                fontSize: 34,
                color: OG_BRAND.muted,
                marginBottom: 20,
              }}
            >
              {city}
            </div>
          ) : null}

          {services.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {services.map((service) => (
                <span
                  key={service}
                  style={{
                    fontSize: 24,
                    color: OG_BRAND.pinkDark,
                    background: OG_BRAND.white,
                    border: `2px solid ${OG_BRAND.pink}`,
                    borderRadius: 999,
                    padding: "8px 18px",
                    fontWeight: 600,
                  }}
                >
                  {service}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <OgBrandBar />
    </div>
  );
}

export default async function ListingOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const { listing } = await loadOgListingImageData(id);
    const title = listingTitle(listing);
    const city = listingCity(listing);
    const services = listingServices(listing, 3);
    const photoUrl = await resolveListingPhotoUrl(listing);

    try {
      return new ImageResponse(
        (
          <ListingOgCard
            title={title}
            city={city}
            services={services}
            photoUrl={photoUrl}
          />
        ),
        { ...OG_SIZE }
      );
    } catch (renderError) {
      console.warn(
        "[listings/[id]/opengraph-image] Image render failed, retrying without photo:",
        renderError
      );
      return new ImageResponse(
        (
          <ListingOgCard
            title={title}
            city={city}
            services={services}
            photoUrl={null}
          />
        ),
        { ...OG_SIZE }
      );
    }
  } catch (error) {
    console.warn("[listings/[id]/opengraph-image]", error);
    return renderDefaultOgImage("Beauty Listing");
  }
}
