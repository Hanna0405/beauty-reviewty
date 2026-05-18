import Link from "next/link";
import MasterCard from "@/components/MasterCard";
import ListingCard from "@/app/masters/components/ListingCard";
import type { CityServicePageData } from "@/lib/seo/loadCityServicePageData";

type Props = Extract<CityServicePageData, { valid: true }>;

export default function CityServiceLanding({
  city,
  service,
  masters,
  listings,
  relatedServices,
}: Props) {
  const hasResults = masters.length > 0 || listings.length > 0;

  return (
    <div className="container-page w-full max-w-full min-w-0 overflow-x-hidden px-4 py-6">
      <Link
        href="/masters"
        className="text-sm text-pink-600 underline underline-offset-2 hover:text-pink-700"
      >
        &larr; Browse all masters
      </Link>

      <header className="mt-4 min-w-0">
        <h1 className="break-words text-2xl font-semibold text-gray-900 sm:text-3xl">
          {service.serviceName} masters in {city.cityName}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
          Find trusted {service.serviceName.toLowerCase()} professionals in{" "}
          {city.cityName}. Compare profiles, services, languages, and real
          client reviews on BeautyReviewty.
        </p>
      </header>

      {masters.length > 0 ? (
        <section className="mt-8 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">Masters</h2>
          <div className="mt-4 grid min-w-0 gap-4">
            {masters.map((master) => (
              <MasterCard
                key={String(master.uid || master.id)}
                master={master}
              />
            ))}
          </div>
        </section>
      ) : null}

      {listings.length > 0 ? (
        <section className="mt-8 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">Listings</h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} item={listing} />
            ))}
          </div>
        </section>
      ) : null}

      {!hasResults ? (
        <section className="mt-8 rounded-xl border border-dashed border-pink-200 bg-white/70 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            No matches yet in {city.cityName}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            We do not have active {service.serviceName.toLowerCase()} masters or
            listings in {city.cityName} right now. Browse all masters or try a
            nearby service category.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/masters"
              className="rounded-lg border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50"
            >
              Browse all masters
            </Link>
            <Link
              href={`/masters?city=${encodeURIComponent(city.citySlug)}`}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Masters in {city.cityName}
            </Link>
          </div>
        </section>
      ) : null}

      {relatedServices.length > 0 ? (
        <section className="mt-8 min-w-0 rounded-xl border bg-white/60 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            More services in {city.cityName}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {relatedServices.map((link) => (
              <li key={link.href} className="min-w-0">
                <Link
                  href={link.href}
                  prefetch={false}
                  className="break-words text-sm text-pink-600 underline underline-offset-2 hover:text-pink-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
