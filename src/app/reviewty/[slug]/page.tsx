import { notFound } from "next/navigation";
import Image from "next/image";
import { getAdminDb } from "@/lib/firebaseAdmins";
import PublicCardReviewFormClient from "@/components/reviewty/PublicCardReviewFormClient";
import PhotoGallery from "@/components/reviewty/PhotoGallery";
import { normalizePhotos } from "@/components/reviewty/getPhotoUrl";
import PublicCardReviews from "@/components/review/PublicCardReviews";

type PublicCard = {
  id: string;
  masterName: string;
  rating: number;
  serviceKeys: string[];
  languageKeys: string[];
  cityDisplay: string;
  photos: string[];
  text?: string;
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

// Safe load function for server-side
async function loadPublicCard(id: string) {
  const db = getAdminDb();
  const ref = db.collection("publicCards").doc(id);

  try {
    const snap = await ref.get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err: any) {
    console.error("[loadPublicCard] Error loading card:", err);
    throw err;
  }

  return null;
}

// Next.js 15: params is now a Promise and must be awaited in async components
export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. load Firestore doc by id = slug (with offline tolerance)
  const cardData = await loadPublicCard(slug);
  if (!cardData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Not Available
          </h1>
          <p className="text-sm text-gray-600">
            This public card is not available right now.
          </p>
        </div>
      </div>
    );
  }

  const data: any = cardData;
  const cardId = cardData.id;

  const photos: string[] = Array.isArray(data.photos) ? data.photos : [];
  const normalizedPhotos = normalizePhotos(data.photos ?? data.images);

  // decide how to show location:
  // prefer old-style full string city.formatted, fallback cityKey
  const cityDisplay =
    data.city?.formatted || data.city?.cityName || data.cityKey || "";

  const card: PublicCard = {
    id: cardId,
    masterName: data.masterName || data.masterSlug || "Unknown master",
    rating: typeof data.rating === "number" ? data.rating : 5.0,
    serviceKeys: Array.isArray(data.serviceKeys) ? data.serviceKeys : [],
    languageKeys: Array.isArray(data.languageKeys) ? data.languageKeys : [],
    cityDisplay,
    photos,
    text: data.text || "",
  };

  async function loadAllReviews(slug: string, listingId?: string) {
    const db = getAdminDb();
    const all: any[] = [];

    // 1) publicCards/{slug}/reviews
    try {
      const s1 = await db
        .collection("publicCards")
        .doc(slug)
        .collection("reviews")
        .orderBy("createdAt", "desc")
        .get();
      s1.forEach((d) => all.push({ id: d.id, ...d.data() }));
    } catch (_) {}

    // 2) reviewty/{slug}/reviews
    try {
      const s2 = await db
        .collection("reviewty")
        .doc(slug)
        .collection("reviews")
        .orderBy("createdAt", "desc")
        .get();
      s2.forEach((d) => all.push({ id: d.id, ...d.data() }));
    } catch (_) {}

    // 3) TOP collection publicReviews (from "existing master" flow)
    try {
      const s3 = await db
        .collection("publicReviews")
        .where("publicCardSlug", "==", slug)
        .get();
      s3.forEach((d) => all.push({ id: d.id, ...d.data() }));
    } catch (_) {}

    // 4) listings/{listingId}/reviews (from "existing master" flow)
    if (listingId) {
      try {
        const s4 = await db
          .collection("listings")
          .doc(listingId)
          .collection("reviews")
          .get();
        s4.forEach((d) =>
          all.push({ id: d.id, source: "listing", ...d.data() })
        );
      } catch (_) {}
    }

    // filter and sort
    const filtered = all.filter((r) => r.rating);
    filtered.sort((a, b) => {
      const ta = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : (a.createdAt?.seconds || 0) * 1000;
      const tb = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : (b.createdAt?.seconds || 0) * 1000;
      return tb - ta;
    });

    // calc rating
    const total = filtered.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    const avg = filtered.length ? total / filtered.length : 0;

    return { reviews: filtered, avg, count: filtered.length };
  }

  // Get listingId from card data
  const listingId = data.listingId || data.masterListingId || data.listing?.id;
  const { reviews, avg, count } = await loadAllReviews(slug, listingId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* HEADER: name / rating / review count / location / badges */}
      <section className="bg-pink-50 border border-pink-100 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold text-gray-900 flex flex-wrap items-center gap-2">
            <span>{card.masterName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span>{avg.toFixed(1)}</span>
              <span className="text-sm text-gray-500">
                • {count} review{count === 1 ? "" : "s"}
              </span>
            </div>

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

      {/* REVIEW TEXT */}
      {card.text && (
        <section className="bg-pink-50 border border-pink-100 rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Review</h2>
          <p className="whitespace-pre-line text-sm md:text-base text-slate-800">
            {card.text}
          </p>
        </section>
      )}

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
          <span>
            {avg.toFixed(1)} · {count} review{count === 1 ? "" : "s"}
          </span>
        </div>

        {/* review submission form */}
        <PublicCardReviewFormClient publicCardSlug={card.id} />
      </section>

      {/* CLIENT REVIEWS */}
      <PublicCardReviews publicCardSlug={card.id} />
    </div>
  );
}
