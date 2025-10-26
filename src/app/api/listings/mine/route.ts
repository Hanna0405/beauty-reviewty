import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader } from "@/server/auth/verifyIdToken";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const auth = await verifyAuthHeader(
    req.headers.get("authorization") || undefined
  );
  if (!auth?.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Query listings by ownerId
    const snap = await adminDb()
      .collection("listings")
      .where("ownerId", "==", auth.uid)
      .orderBy("updatedAt", "desc")
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
