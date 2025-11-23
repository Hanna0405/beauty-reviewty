import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sendBookingStatusEmailToClient } from "@/lib/email/bookingEmails";
import { formatWhenFromBooking } from "@/lib/emailFormat";
import { getEffectiveNotificationPrefsForUser } from "@/lib/settings/notifications";

export async function POST(req: NextRequest) {
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
    const { bookingId, action, userId } = await req.json();
    if (!bookingId || !action || !userId)
      return new Response(
        JSON.stringify({
          ok: false,
          error: "bookingId, action, userId required",
        }),
        { status: 400 }
      );
    const ref = db.collection("bookings").doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists)
      return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
        status: 404,
      });
    const data = snap.data()!;
    if (data.masterId !== userId)
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
      });
    let newStatus: "confirmed" | "declined" | null = null;
    if (action === "confirm") {
      await ref.update({ status: "confirmed", updatedAt: Timestamp.now() });
      newStatus = "confirmed";
    } else if (action === "decline") {
      await ref.update({ status: "declined", updatedAt: Timestamp.now() });
      newStatus = "declined";
    } else if (action === "delete") {
      await ref.delete();
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: "Unknown action" }),
        { status: 400 }
      );
    }

    if (newStatus) {
      try {
        const clientUid = data.clientUid || data.clientId || null;
        // chat notification schema: { userId, type, read, createdAt, ... }
        // Use userId field to match chat notification pattern
        // updated for unified targetUid
        const notificationData = {
          userId: clientUid, // target user who should see this notification
          type: "booking_status",
          bookingId,
          masterUid: data.masterUid || data.masterId || userId,
          clientUid,
          targetUid: clientUid, // unified field for recipient
          status: newStatus,
          message:
            newStatus === "confirmed"
              ? "Your booking was confirmed"
              : "Your booking was declined",
          createdAt: FieldValue.serverTimestamp(),
          read: false,
        };
        await db.collection("notifications").add(notificationData);
        console.log("[booking] status notification for client created", {
          bookingId,
          status: newStatus,
          clientUid,
          masterUid: data.masterUid || data.masterId || userId,
          notificationData: {
            ...notificationData,
            createdAt: "[serverTimestamp]",
          },
        });
      } catch (err) {
        console.error("Failed to create booking status notification", err);
      }

      // Booking status email notification to client (best-effort, after Firestore writes)
      try {
        const after = await ref.get();
        const b = { id: after.id, ...after.data() } as any;
        const bookingDateTimeText = formatWhenFromBooking(b);

        const clientUidFinal = b.clientUid || b.clientId || null;
        if (!clientUidFinal) {
          // No client UID, skip email
          return;
        }

        // Get effective notification preferences for client
        const prefs = await getEffectiveNotificationPrefsForUser(clientUidFinal);

        // Check if notifications are enabled for booking status changes
        if (!prefs.bookingStatusChangeEnabled) {
          console.log("[email-booking] skip: client disabled booking status emails", {
            clientUserId: clientUidFinal,
            bookingId,
            status: newStatus,
          });
        } else if (!prefs.emailForNotifications) {
          console.log("[email-booking] skip: no email for notifications", {
            clientUserId: clientUidFinal,
            bookingId,
            status: newStatus,
          });
        } else {
          // Load client profile for display name
          const clientProfileSnap = await db.collection("profiles").doc(clientUidFinal).get();
          const clientProfile =
            clientProfileSnap && clientProfileSnap.exists
              ? (clientProfileSnap.data() as any)
              : null;

        // Get master profile for master name
        const masterUid = b.masterUid || b.masterId || userId;
        let masterName: string | null = null;
        if (masterUid) {
          try {
            const masterProfileSnap = await db.collection("profiles").doc(masterUid).get();
            if (masterProfileSnap.exists) {
              const masterProfileData = masterProfileSnap.data() as any;
              masterName = masterProfileData?.displayName || null;
            }
          } catch {
            // ignore master profile lookup errors
          }
        }

        // Get service name from listing
        let serviceName: string | null = null;
        if (b.listingId) {
          try {
            const ls = await db.collection("listings").doc(b.listingId).get();
            if (ls.exists) {
              const listingData = ls.data() as any;
              serviceName = listingData?.title || listingData?.serviceName || null;
            }
          } catch {
            // ignore listing load errors
          }
        }

        // Construct dashboard URL
        const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const dashboardBookingUrl = `${host}/dashboard/bookings`;

          await sendBookingStatusEmailToClient({
            clientEmail: prefs.emailForNotifications,
            clientName: clientProfile?.displayName || null,
            masterName,
            serviceName,
            bookingDateTimeText,
            bookingId,
            status: newStatus,
            dashboardBookingUrl,
          });
        }
      } catch (emailErr) {
        console.error("[booking/update] email error", emailErr);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "Server error" }),
      { status: 500 }
    );
  }
}
