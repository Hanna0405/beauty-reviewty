// src/app/api/booking/request/route.ts
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

type Body = {
  // allow both new/old payload shapes
  listingId?: string;
  masterId?: string;
  masterUid?: string;
  clientId?: string | null;
  clientUid?: string | null;
  dateISO?: string;
  date?: string; // 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  durationMin?: number | string;
  duration?: number | string;
  note?: string;
  customerName?: string;
  customerPhone?: string;
  contactName?: string;
  contactPhone?: string;
};

export async function POST(req: Request) {
  try {
    const db = getAdminDb();
    if (!db) {
      return new Response(
        JSON.stringify({ ok: false, error: "Admin DB not available" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const body = (await req.json()) as Body;

    const listingId = body.listingId || body.masterId;
    if (!listingId) {
      return NextResponse.json(
        { ok: false, error: "listingId missing" },
        { status: 400 }
      );
    }

    const masterUid = body.masterId || body.masterUid;
    if (!masterUid) {
      return NextResponse.json(
        { ok: false, error: "masterId missing" },
        { status: 400 }
      );
    }

    const clientUid = body.clientId || body.clientUid || null;

    const clientName = body.customerName ?? body.contactName ?? "";
    const clientPhone = body.customerPhone ?? body.contactPhone ?? "";

    // Parse time
    let start: Date | null = null;
    if (body.dateISO) {
      start = new Date(body.dateISO);
    } else if (body.date && body.time) {
      start = new Date(`${body.date}T${body.time}`);
    }
    if (!start || isNaN(start.getTime())) {
      return NextResponse.json(
        { ok: false, error: "invalid date/time" },
        { status: 400 }
      );
    }

    const rawDuration = body.durationMin ?? body.duration ?? 60;
    const durationMin =
      typeof rawDuration === "string"
        ? parseInt(rawDuration, 10)
        : Number(rawDuration);

    if (!Number.isFinite(durationMin) || durationMin <= 0) {
      return NextResponse.json(
        { ok: false, error: "invalid duration" },
        { status: 400 }
      );
    }

    const startMs = start.getTime();
    const endMs = startMs + durationMin * 60_000;
    const endAt = new Date(endMs);

    const payload = {
      listingId,
      masterUid,
      masterId: masterUid,
      clientUid,
      clientId: clientUid,
      startAt: start.toISOString(),
      endAt: endAt.toISOString(),
      startMs,
      endMs,
      durationMin,
      note: body.note ?? "",
      customerName: clientName,
      contactName: clientName,
      customerPhone: clientPhone,
      contactPhone: clientPhone,
      status: "pending" as const,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Write via Admin SDK (bypasses client-side security rules)
    const ref = await db.collection("bookings").add(payload);

    // chat notification schema: { userId, type, read, createdAt, ... }
    // Use userId field to match chat notification pattern
    // updated for unified targetUid
    const notificationData = {
      userId: masterUid, // target user who should see this notification
      type: "booking_request",
      masterUid, // keep for backwards compatibility
      clientUid: clientUid ?? null,
      targetUid: masterUid, // unified field for recipient
      bookingId: ref.id,
      message: `${clientName || "Client"} sent you a booking request.`,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    };
    await db.collection("notifications").add(notificationData);
    console.log("[booking] notification for master created", {
      bookingId: ref.id,
      masterUid,
      clientUid: clientUid ?? null,
      notificationData: { ...notificationData, createdAt: "[serverTimestamp]" },
    });

    return NextResponse.json({ ok: true, id: ref.id }, { status: 200 });
  } catch (e: any) {
    console.error("booking/request error", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "server error" },
      { status: 500 }
    );
  }
}
