import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import PublicCardReviewForm from "@/components/reviewty/PublicCardReviewForm";
import PhotoGallery from "@/components/reviewty/PhotoGallery";
import { normalizePhotos } from "@/components/reviewty/getPhotoUrl";
import dynamic from "next/dynamic";

const PublicCardReviews = dynamic(
  () => import("@/components/review/PublicCardReviews"),
  { ssr: false }
);

const PublicCardReviewStats = dynamic(
  () => import("@/components/review/PublicCardReviewStats"),
  { ssr: false }
);

type PublicCard = {
  id: string;
  masterName: string;
  rating: number;
  serviceKeys: string[];
  languageKeys: string[];
  cityDisplay: string;
  photos: string[];
  // later we could expose text/description, etc.
};

// Stars component (inline since we need it for server component)
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          className={i <= rating ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}
      <span className="sr-only">{rating} of 5</span>
    </div>
  );
}

export default async function PublicCardPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  // 1. load Firestore doc by id = slug
  const ref = doc(db, "publicCards", slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return notFound();
  }

  const data: any = snap.data();

  const photos: string[] = Array.isArray(data.photos) ? data.photos : [];
  const normalizedPhotos = normalizePhotos(data.photos ?? data.images);

  // decide how to show location:
  // prefer old-style full string city.formatted, fallback cityKey
  const cityDisplay =
    data.city?.formatted || data.city?.cityName || data.cityKey || "";

  const card: PublicCard = {
    id: snap.id,
    masterName: data.masterName || data.masterSlug || "Unknown master",
    rating: typeof data.rating === "number" ? data.rating : 5.0,
    serviceKeys: Array.isArray(data.serviceKeys) ? data.serviceKeys : [],
    languageKeys: Array.isArray(data.languageKeys) ? data.languageKeys : [],
    cityDisplay,
    photos,
  };

  // temp reviews (we'll wire actual reviews later)
  const reviewCount = 1; // hardcode "1 review" to match old UI screenshot
  // const reviewCount = reviews.length in future

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* HEADER: name / rating / review count / location / badges */}
      <section className="bg-pink-50 border border-pink-100 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold text-gray-900 flex flex-wrap items-center gap-2">
            <span>{card.masterName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <PublicCardReviewStats publicCardSlug={card.id} />

            {card.cityDisplay && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-700">{card.cityDisplay}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {/* service pills */}
            {card.serviceKeys.map((srv, i) => (
              <span
                key={`srv-${i}`}
                className="inline-block rounded-full bg-pink-100 text-pink-800 border border-pink-200 px-2 py-0.5"
              >
                {srv}
              </span>
            ))}

            {/* language pills */}
            {card.languageKeys.map((lang, i) => (
              <span
                key={`lang-${i}`}
                className="inline-block rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WORK PHOTOS */}
      <section className="bg-pink-50 border border-pink-100 rounded-lg p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Work photos
        </h2>

        {normalizedPhotos.length === 0 ? (
          <div className="text-sm text-gray-500">No photos yet.</div>
        ) : (
          <PhotoGallery photos={normalizedPhotos} />
        )}
      </section>

      {/* LEAVE A REVIEW */}
      <section className="bg-pink-50 border border-pink-100 rounded-lg p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Leave a review
        </h2>

        <div className="text-sm text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-gray-900 font-medium">Current rating</span>
          <PublicCardReviewStats publicCardSlug={card.id} />
        </div>

        {/* review submission form */}
        <PublicCardReviewForm publicCardSlug={card.id} />
      </section>

      {/* CLIENT REVIEWS */}
      <PublicCardReviews publicCardSlug={card.id} />
    </div>
  );
}
