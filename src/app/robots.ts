import type { MetadataRoute } from "next";

const HOST = "https://beautyreviewty.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/profile/edit",
        "/settings",
        "/login",
        "/signup",
        "/api",
      ],
    },
    sitemap: `${HOST}/sitemap.xml`,
  };
}
