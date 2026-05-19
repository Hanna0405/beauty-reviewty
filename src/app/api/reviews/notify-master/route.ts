import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmins";
import { notifyMasterOfNewReview } from "@/lib/reviews/notifyMasterOfNewReview";

const bad = (msg: string, code = 400) =>
  NextResponse.json({ ok: false, error: msg }, { status: code });

/**
 * Best-effort review notification for client-side review saves (e.g. Reviewty modal).
 * Review must already exist; this route only sends email.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return bad("Missing Authorization token", 401);

    await getAdminAuth().verifyIdToken(token);

    const body = await req.json().catch(() => ({}));
    const {
      masterUid,
      masterName,
      profilePathId,
      rating,
      text = "",
    }: {
      masterUid?: string;
      masterName?: string;
      profilePathId?: string;
      rating?: number;
      text?: string;
    } = body || {};

    if (!masterUid?.trim()) return bad("masterUid is required");
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return bad("Invalid rating (1..5).");
    }

    void notifyMasterOfNewReview({
      masterUid: masterUid.trim(),
      masterName: String(masterName || "Master").trim(),
      profilePathId: profilePathId?.trim() || masterUid.trim(),
      rating,
      text: String(text ?? "").trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    console.error("[api/reviews/notify-master] error:", e);
    const status = String(err?.code || "").includes("auth") ? 401 : 500;
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal error" },
      { status }
    );
  }
}
