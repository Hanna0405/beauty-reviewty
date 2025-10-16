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
  services?: string[];
  languages?: string[];
  collection?: 'profiles' | 'masters'; // Allow specifying which collection to use
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

    // Determine final avatar URL from any possible field
    const avatarUrl =
      payload?.photoURL ||
      payload?.avatarUrl ||
      (payload?.avatar as any)?.url ||
      '';

    // 1) Update Firebase Auth photoURL if avatar present
    if (avatarUrl) {
      try {
        await adminAuth.updateUser(uid, { photoURL: avatarUrl });
      } catch (authErr) {
        console.warn('[profile/update] Failed to update Auth photoURL:', authErr);
        // Continue with Firestore update even if Auth update fails
      }
    }

    // 2) Determine collection (default to 'profiles' for backwards compatibility)
    const collection = payload.collection || 'profiles';
    delete payload.collection; // Remove from payload before saving

    // 3) Write to {collection}/{uid} with unified avatar fields
    await adminDb
      .collection(collection)
      .doc(uid)
      .set(
        {
          ...payload,
          photoURL: avatarUrl || null,
          avatarUrl: avatarUrl || null,
          avatar: { ...(payload?.avatar || {}), url: avatarUrl || '' },
          updatedAt: new Date(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true, photoURL: avatarUrl });
  } catch (err: any) {
    console.error("Profile update failed:", err);
    // Standardize 401 for auth issues
    if (err?.code === "auth/argument-error" || err?.message === "NOT_SIGNED_IN") {
      return NextResponse.json({ error: "not signed in" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
