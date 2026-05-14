import type { MetadataRoute } from "next";

const SITE_URL = "https://beautyreviewty.com";

/**
 * Static marketing URLs only.
 * TODO: Add dynamic entries for /masters/[id], /reviewty/[slug] (and optionally /listing/[id])
 * using server-safe reads once indexing scope is confirmed — avoid new queries until then.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/masters`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/reviewty`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/skincare-checker`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
