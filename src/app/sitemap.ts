import type { MetadataRoute } from "next";
import { buildCityServiceSitemapEntries } from "@/lib/seo/buildCityServiceSitemapEntries";

const SITE_URL = "https://beautyreviewty.com";

const STATIC_ENTRIES: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: `${SITE_URL}/masters`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/reviewty`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/skincare-checker`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = STATIC_ENTRIES.map((entry) => ({
    ...entry,
    lastModified: now,
  }));

  const cityServiceEntries = await buildCityServiceSitemapEntries();

  const seen = new Set<string>();
  const merged: MetadataRoute.Sitemap = [];

  for (const entry of [...staticEntries, ...cityServiceEntries]) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    merged.push(entry);
  }

  return merged;
}
