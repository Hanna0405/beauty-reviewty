import { ImageResponse } from "next/og";
import { OG_BRAND, OG_SIZE } from "./constants";

export function renderDefaultOgImage(alt = "BeautyReviewty") {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: `linear-gradient(135deg, ${OG_BRAND.pinkLight} 0%, ${OG_BRAND.white} 55%, ${OG_BRAND.pinkLight} 100%)`,
          padding: 48,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            background: OG_BRAND.pink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: OG_BRAND.white,
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          BR
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 56,
            fontWeight: 700,
            color: OG_BRAND.pinkDark,
          }}
        >
          BeautyReviewty
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 28,
            color: OG_BRAND.muted,
          }}
        >
          {alt}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
