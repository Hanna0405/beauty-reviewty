import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs"; // IMPORTANT: Admin SDK requires Node.js runtime
export const dynamic = "force-dynamic"; // avoid any caching issues

type UpdatePayload = {
  displayName?: string | null;
  phone?: string | null;
  city?: any; // keep flexible to not break your existing CityAutocomplete shape
  about?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown; // allow extra fields, they will be merged
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "not signed in" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const payload: UpdatePayload = await req.json();

    // Write to profiles/{uid} with merge to avoid touching other fields.
    await adminDb
      .collection("profiles")
      .doc(uid)
      .set(
        {
          ...payload,
          updatedAt: new Date(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Profile update failed:", err);
    // Standardize 401 for auth issues
    if (err?.code === "auth/argument-error" || err?.message === "NOT_SIGNED_IN") {
      return NextResponse.json({ error: "not signed in" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
