import { ImageResponse } from "next/og";
import { OG_BRAND, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/constants";
import { renderDefaultOgImage } from "@/lib/og/defaultOgImage";
import {
  masterServices,
  profileCityLabel,
  profileDisplayName,
  resolveProfileAvatarUrl,
} from "@/lib/og/extractOgFields";
import { loadOgMasterImageData } from "@/lib/og/loadOgImageData";
import { OgAvatarFallback } from "@/lib/og/OgAvatarFallback";
import { OgBrandBar } from "@/lib/og/OgBrandBar";

export const runtime = "nodejs";
export const alt = "BeautyReviewty master profile";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

function MasterOgCard({
  name,
  city,
  services,
  avatarUrl,
}: {
  name: string;
  city: string;
  services: string[];
  avatarUrl: string | null;
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
          alignItems: "center",
          gap: 48,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            width={200}
            height={200}
            style={{
              borderRadius: 100,
              objectFit: "cover",
              border: `6px solid ${OG_BRAND.pink}`,
            }}
          />
        ) : (
          <OgAvatarFallback label={name} size={200} />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: OG_BRAND.text,
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            {name}
          </div>

          {city ? (
            <div
              style={{
                fontSize: 36,
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
                    fontSize: 26,
                    color: OG_BRAND.pinkDark,
                    background: OG_BRAND.white,
                    border: `2px solid ${OG_BRAND.pink}`,
                    borderRadius: 999,
                    padding: "8px 20px",
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

export default async function MasterOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const { profile, listing } = await loadOgMasterImageData(id);
    const name = profileDisplayName(profile, listing);
    const city = profileCityLabel(profile, listing);
    const services = masterServices(profile, listing, 3);
    const avatarUrl = await resolveProfileAvatarUrl(profile, listing);

    try {
      return new ImageResponse(
        (
          <MasterOgCard
            name={name}
            city={city}
            services={services}
            avatarUrl={avatarUrl}
          />
        ),
        { ...OG_SIZE }
      );
    } catch (renderError) {
      console.warn(
        "[masters/[id]/opengraph-image] Image render failed, retrying without photo:",
        renderError
      );
      return new ImageResponse(
        (
          <MasterOgCard
            name={name}
            city={city}
            services={services}
            avatarUrl={null}
          />
        ),
        { ...OG_SIZE }
      );
    }
  } catch (error) {
    console.warn("[masters/[id]/opengraph-image]", error);
    return renderDefaultOgImage("Beauty Master");
  }
}
