import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin"; // << use admin version
import { toSlug as slugify } from "@/lib/slug";
// Removed client-side Firebase auth import - this is a server-side API route

function slugifyOld(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function deriveCountry(formatted: string) {
  // очень лёгкий парсер конца строки
  const f = (formatted || "").toLowerCase();
  if (f.includes(", canada") || f.endsWith(" canada"))
    return { country: "Canada", countryCode: "CA" };
  if (
    f.includes(", united states") ||
    f.includes(", usa") ||
    f.endsWith(" usa")
  )
    return { country: "United States", countryCode: "US" };
  return { country: "Unknown", countryCode: "ZZ" }; // fallback: не валим валидацию
}

const CityLoose = z.object({
  formatted: z.string().min(1),
  // остальное опционально — достроим ниже
  placeId: z.string().optional(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  stateCode: z.string().optional().nullable(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  slug: z.string().optional(),
  cityName: z.string().optional(),
  cityKey: z.string().optional(),
});

const BodySchema = z.object({
  masterName: z.string().min(1),
  cityKey: z.string().optional(),
  city: CityLoose,
  services: z
    .array(
      z.object({
        key: z.string(),
        name: z.string(),
        emoji: z.string().optional(),
      })
    )
    .default([]),
  serviceKeys: z.array(z.string()).default([]),
  serviceNames: z.array(z.string()).default([]),
  languages: z
    .array(
      z.object({
        key: z.string(),
        name: z.string(),
        emoji: z.string().optional(),
      })
    )
    .default([]),
  languageKeys: z.array(z.string()).default([]),
  languageNames: z.array(z.string()).default([]),
  rating: z.number().min(1).max(5),
  text: z.string().min(3),
  photos: z.array(z.string()).default([]),
  createdByUid: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    if (!json)
      return NextResponse.json(
        { ok: false, code: "BAD_JSON", message: "Invalid JSON body" },
        { status: 400 }
      );

    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Payload validation failed",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 422 }
      );
    }

    const d = {
      ...parsed.data,
      cityKey:
        parsed.data.cityKey ||
        parsed.data.city?.cityKey ||
        parsed.data.city?.slug,
    };

    // Note: Authentication should be handled by middleware or client-side before calling this API

    // Validate required fields
    if (!d.cityKey) {
      return NextResponse.json(
        { ok: false, code: "VALIDATION_ERROR", message: "Missing cityKey" },
        { status: 422 }
      );
    }
    if (!d.masterName) {
      return NextResponse.json(
        { ok: false, code: "VALIDATION_ERROR", message: "Missing masterName" },
        { status: 422 }
      );
    }
    const formatted = d.city.formatted;
    const { country, countryCode } = {
      country: d.city.country,
      countryCode: d.city.countryCode,
      ...(!d.city.country || !d.city.countryCode
        ? deriveCountry(formatted)
        : {}),
    };

    const slug = d.city.slug || slugify(formatted);
    const cityName = d.city.cityName || formatted;
    const cityKey = d.city.cityKey || slug;

    const city = {
      city: d.city.city ?? null,
      state: d.city.state ?? null,
      stateCode: d.city.stateCode ?? null,
      country,
      countryCode,
      formatted,
      lat: d.city.lat ?? null,
      lng: d.city.lng ?? null,
      placeId: d.city.placeId ?? null,
      slug,
      cityName,
      cityKey,
    };

    // ---- ensure mirrors arrays exist even if empty
    const services = d.services ?? [];
    const serviceKeys =
      (d.serviceKeys?.length ? d.serviceKeys : services.map((s) => s.key)) ??
      [];
    const serviceNames =
      (d.serviceNames?.length ? d.serviceNames : services.map((s) => s.name)) ??
      [];

    const languages = d.languages ?? [];
    const languageKeys =
      (d.languageKeys?.length ? d.languageKeys : languages.map((l) => l.key)) ??
      [];
    const languageNames =
      (d.languageNames?.length
        ? d.languageNames
        : languages.map((l) => l.name)) ?? [];

    // Generate stable non-empty threadKey
    const masterSlug = slugify(d.masterName.trim()).slice(0, 80);
    const threadKey = `pc_${cityKey}_${masterSlug}`;

    // Use the same id for publicCards to keep things consistent
    const cardId = threadKey;

    // Get uid from request headers or use placeholder for server-side
    const uid = req.headers.get("x-user-id") || "server-created";

    console.log("[CreatePublicCard] →", {
      cardPath: `publicCards/${cardId}`,
      threadKey,
      uid,
    });

    // 1) Create/merge the public card (rules require createdByUid and forbid sensitive fields)
    const cardRef = adminDb().collection("publicCards").doc(cardId);
    await cardRef.set(
      {
        createdByUid: uid,
        cityKey,
        masterName: d.masterName.trim(),
        masterSlug,
        threadKey,
        type: "public-card",
        serviceKeys,
        languageKeys,
        city,
        services,
        serviceNames,
        languages,
        languageNames,
        rating: d.rating,
        text: d.text.trim(),
        photos: d.photos ?? [],
        createdAt: new Date(),
        createdAtMillis: Date.now(),
        cityName: cityName,
      },
      { merge: true }
    );

    // 2) Add the public review to global /reviews (rules: isPublic==true, has threadKey, valid rating)
    const reviewRef = await adminDb()
      .collection("reviews")
      .add({
        isPublic: true,
        threadKey,
        rating: d.rating,
        text: d.text.trim(),
        authorUid: uid, // optional by rules, but set for consistency
        serviceKeys,
        languageKeys,
        photosCount: (d.photos ?? []).length || 0,
        masterName: d.masterName.trim(),
        publicCardId: cardId,
        cityKey: cityKey,
        photos: d.photos ?? [],
        createdAt: new Date(),
      });

    return NextResponse.json(
      { ok: true, id: cardId, threadKey, reviewId: reviewRef.id },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("public-card POST failed", e);
    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL",
        message: e?.message ?? "Unexpected error",
      },
      { status: 500 }
    );
  }
}
