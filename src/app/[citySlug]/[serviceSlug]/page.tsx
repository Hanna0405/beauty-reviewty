import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityServiceLanding from "@/components/seo/CityServiceLanding";
import { loadCityServicePageData } from "@/lib/seo/loadCityServicePageData";

const SITE = "BeautyReviewty";
const BASE_URL = "https://beautyreviewty.com";

type PageProps = {
  params: Promise<{ citySlug: string; serviceSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug, serviceSlug } = await params;
  const data = await loadCityServicePageData(citySlug, serviceSlug);

  if (!data.valid) {
    return {
      title: `Beauty services | ${SITE}`,
      robots: { index: false, follow: false },
    };
  }

  const { city, service } = data;
  const title = `${service.serviceName} in ${city.cityName} | ${SITE}`;
  const description = `Find trusted ${service.serviceName.toLowerCase()} masters in ${city.cityName}. Compare profiles, services, languages and real reviews.`;
  const canonicalPath = `/${city.citySlug}/${service.serviceSlug}`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CityServicePage({ params }: PageProps) {
  const { citySlug, serviceSlug } = await params;
  const data = await loadCityServicePageData(citySlug, serviceSlug);

  if (!data.valid) {
    notFound();
  }

  return <CityServiceLanding {...data} />;
}
