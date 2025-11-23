// src/app/api/booking/request/route.ts
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sendNewBookingEmailToMaster } from "@/lib/email/bookingEmails";
import { getEffectiveNotificationPrefsForUser } from "@/lib/settings/notifications";
import { doesMasterAllowBookingRequestsServer } from "@/lib/settings/masterVisibilityServer";

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

    // Check if master allows booking requests (server-side check)
    const allowBooking = await doesMasterAllowBookingRequestsServer(masterUid);
    if (!allowBooking) {
      console.log("[booking] blocked: master disabled booking", {
        masterId: masterUid,
        clientId: body.clientId || body.clientUid || null,
      });
      return NextResponse.json(
        { ok: false, error: "booking-disabled-by-master" },
        { status: 403 }
      );
    }

    // Parse time to get the date string for off days check
    let bookingDateStr: string | null = null;
    if (body.dateISO) {
      const dateObj = new Date(body.dateISO);
      if (!isNaN(dateObj.getTime())) {
        bookingDateStr = dateObj.toISOString().split('T')[0]; // Extract YYYY-MM-DD
      }
    } else if (body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      bookingDateStr = body.date; // Already in YYYY-MM-DD format
    }

    // Check if the booking date is an off day (server-side check)
    if (bookingDateStr) {
      try {
        const masterProfileSnap = await db.collection("profiles").doc(masterUid).get();
        if (masterProfileSnap.exists) {
          const masterProfile = masterProfileSnap.data() as any;
          const offDays = Array.isArray(masterProfile?.offDays)
            ? masterProfile.offDays.filter((d: any) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
            : [];
          
          if (offDays.includes(bookingDateStr)) {
            console.log("[booking] blocked: booking on off day", {
              masterId: masterUid,
              bookingDate: bookingDateStr,
              clientId: body.clientId || body.clientUid || null,
            });
            return NextResponse.json(
              { ok: false, error: "booking-on-off-day" },
              { status: 403 }
            );
          }
        }
      } catch (offDayCheckError) {
        console.error("[booking] error checking off days:", offDayCheckError);
        // Continue with booking if off day check fails (fail open for safety)
      }
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

    // Email notification (best-effort, after booking + notification are written)
    try {
      // Get effective notification preferences for master
      const prefs = await getEffectiveNotificationPrefsForUser(masterUid);

      // Check if notifications are enabled for new booking requests
      if (!prefs.bookingNewRequestEnabled) {
        console.log("[email-booking] skip: master disabled new booking emails", {
          masterUserId: masterUid,
          bookingId: ref.id,
        });
      } else if (!prefs.emailForNotifications) {
        console.log("[email-booking] skip: no email for notifications", {
          masterUserId: masterUid,
          bookingId: ref.id,
        });
      } else {
        // Load master profile for display name
        const masterProfileSnap = await db.collection("profiles").doc(masterUid).get();
        const masterProfile = masterProfileSnap.exists ? (masterProfileSnap.data() as any) : null;
        // Get listing title for service name
        let serviceName: string | null = null;
        try {
          const ls = await db.collection("listings").doc(listingId).get();
          if (ls.exists) {
            const ld = ls.data() as any;
            serviceName = ld.title || ld.serviceName || null;
          }
        } catch {
          // ignore listing lookup errors
        }

        // Format date/time
        const bookingDateTimeText = start.toLocaleString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        // Construct dashboard URL
        const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const dashboardBookingUrl = `${host}/dashboard/master/bookings`;

        // Get client profile for client name
        let clientNameFromProfile: string | null = null;
        if (clientUid) {
          try {
            const clientProfileSnap = await db.collection("profiles").doc(clientUid).get();
            if (clientProfileSnap.exists) {
              const clientProfileData = clientProfileSnap.data() as any;
              clientNameFromProfile = clientProfileData?.displayName || null;
            }
          } catch {
            // ignore client profile lookup errors
          }
        }

        await sendNewBookingEmailToMaster({
          masterEmail: prefs.emailForNotifications,
          masterName: masterProfile?.displayName || null,
          clientName: clientNameFromProfile || clientName || null,
          serviceName,
          bookingDateTimeText,
          bookingId: ref.id,
          bookingStatus: payload.status,
          dashboardBookingUrl,
        });
      }
    } catch (emailErr) {
      console.error("[booking/request] email error", emailErr);
    }

    return NextResponse.json({ ok: true, id: ref.id }, { status: 200 });
  } catch (e: any) {
    console.error("booking/request error", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "server error" },
      { status: 500 }
    );
  }
}
