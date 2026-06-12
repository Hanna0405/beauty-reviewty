import { NextResponse } from "next/server";
import { syncMasterPublicCard } from "@/lib/reviewty/ensurePublicCardForMaster.server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const masterId = String(body.masterId || "").trim();
    if (!masterId) {
      return NextResponse.json(
        { ok: false, error: "masterId is required" },
        { status: 400 }
      );
    }

    const cardId = await syncMasterPublicCard({
      masterId,
      masterName: body.masterName ? String(body.masterName) : undefined,
      masterCity: body.masterCity ? String(body.masterCity) : undefined,
      masterServices: Array.isArray(body.masterServices)
        ? body.masterServices
        : undefined,
      masterLanguages: Array.isArray(body.masterLanguages)
        ? body.masterLanguages
        : undefined,
      profileId: body.profileId ? String(body.profileId) : undefined,
    });

    return NextResponse.json({ ok: true, cardId });
  } catch (error) {
    console.error("[ensure-master-card] failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to ensure master public card" },
      { status: 500 }
    );
  }
}
