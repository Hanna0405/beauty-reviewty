import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore/lite";

// 1. get Firestore Lite instance safely in Node (no window)
function getDbLite() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length ? getApp() : initializeApp(config);
  return getFirestore(app);
}

// Next.js 15: params is now a Promise and must be awaited
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    // Find publicCard by slug
    const q = query(
      collection(getDbLite(), "publicCards"),
      where("slug", "==", slug),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    // shape data for the frontend
    const card = {
      id: doc.id,
      slug: data.slug ?? "",
      masterName: data.masterName ?? "Unknown master",
      locationFormatted: data.city?.formatted ?? data.city?.cityName ?? "",
      rating: data.rating ?? 5,
      services: Array.isArray(data.services)
        ? data.services.map((s: any) => s?.name ?? s?.key ?? "")
        : [],
      photos: Array.isArray(data.photos) ? data.photos : [],
      text: data.text ?? "",
      languages: data.languages ?? [],
    };

    // TODO: later - fetch real per-card reviews from a reviews collection filtered by this slug.
    // For now just return empty to unblock UI:
    const reviews: any[] = [];

    return NextResponse.json({ card, reviews }, { status: 200 });
  } catch (err) {
    console.error("GET /api/reviewty/[slug] failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
