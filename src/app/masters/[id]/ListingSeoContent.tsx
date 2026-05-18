import {
  cityLabel,
  languagesLabel,
  serviceLabel,
  type ListingLike,
} from "@/lib/listings/presenters";

function readServices(listing: ListingLike): string[] {
  if (Array.isArray(listing.serviceNames)) {
    return listing.serviceNames.map(String).filter(Boolean);
  }
  if (Array.isArray(listing.services)) {
    return listing.services
      .map((service) => {
        if (typeof service === "string") return service;
        if (service?.name) return String(service.name);
        if (service?.key) return String(service.key);
        return "";
      })
      .filter(Boolean);
  }
  const single = serviceLabel(listing);
  return single ? [single] : [];
}

function readDescription(listing: ListingLike): string {
  const fields = [
    listing.description,
    listing.about,
    listing.bio,
    listing.details,
  ];
  for (const field of fields) {
    if (typeof field === "string" && field.trim()) return field.trim();
  }
  return "";
}

type Props = {
  listing: ListingLike;
  avgRating: number;
  totalReviews: number;
};

/** Crawler-visible listing fields not always shown in the interactive layout. */
export default function ListingSeoContent({
  listing,
  avgRating,
  totalReviews,
}: Props) {
  const title = String(listing.title || listing.name || "Service").trim();
  const city = cityLabel(listing);
  const languages = languagesLabel(listing);
  const services = readServices(listing);
  const description = readDescription(listing);

  return (
    <div className="sr-only">
      <h1>{title}</h1>
      {city ? <p>City: {city}</p> : null}
      {services.length > 0 ? <p>Services: {services.join(", ")}</p> : null}
      {languages ? <p>Languages: {languages}</p> : null}
      {description ? <p>{description}</p> : null}
      {totalReviews > 0 ? (
        <p>
          Rating: {avgRating.toFixed(1)} / 5 ({totalReviews} reviews)
        </p>
      ) : null}
    </div>
  );
}
