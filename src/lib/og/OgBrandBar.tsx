import { OG_BRAND } from "./constants";

export function OgBrandBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        width: "100%",
        marginTop: "auto",
      }}
    >
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: OG_BRAND.pinkDark,
        }}
      >
        BeautyReviewty
      </span>
    </div>
  );
}
