import { OG_BRAND } from "./constants";

type Props = {
  label: string;
  size?: number;
};

export function OgAvatarFallback({ label, size = 200 }: Props) {
  const initial = (label.trim()[0] || "B").toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: OG_BRAND.pink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: OG_BRAND.white,
        fontSize: Math.round(size * 0.35),
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
