import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { sendBookingStatusEmailToClient } from "@/lib/email/bookingEmails";
import { formatWhenFromBooking } from "@/lib/emailFormat";
import { getEffectiveNotificationPrefsForUser } from "@/lib/settings/notifications";

type Body = {
  bookingId: string;
  action: "confirm" | "decline" | "cancel" | "complete";
};

/**
 * Helper to send booking status email to client after status change.
 * Logs errors without throwing to avoid breaking booking update flow.
 */
async function sendBookingStatusEmailToClientHelper(
  db: FirebaseFirestore.Firestore,
  bookingData: any,
  status: "confirmed" | "declined" | "cancelled",
  bookingId: string
): Promise<void> {
  try {
    const clientUid = bookingData.clientUid || bookingData.clientId || null;
    if (!clientUid) {
      return;
    }

    // Get effective notification preferences for client
    const prefs = await getEffectiveNotificationPrefsForUser(clientUid);

    // Check if notifications are enabled for booking status changes
    if (!prefs.bookingStatusChangeEnabled) {
      console.log("[email-booking] skip: client disabled booking status emails", {
        clientUserId: clientUid,
        bookingId,
        status,
      });
      return;
    }

    if (!prefs.emailForNotifications) {
      console.log("[email-booking] skip: no email for notifications", {
        clientUserId: clientUid,
        bookingId,
        status,
      });
      return;
    }

    // Load client profile for display name
    const clientProfileSnap = await db.collection("profiles").doc(clientUid).get();
    const clientProfile =
      clientProfileSnap && clientProfileSnap.exists
        ? (clientProfileSnap.data() as any)
        : null;

    // Format date/time
    const bookingDateTimeText = formatWhenFromBooking(bookingData);

    // Get master profile for master name
    const masterUid = bookingData.masterUid || bookingData.masterId || null;
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
    if (bookingData.listingId) {
      try {
        const ls = await db.collection("listings").doc(bookingData.listingId).get();
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
      status,
      dashboardBookingUrl,
    });
  } catch (error) {
    console.error("[bookingAct] sendBookingStatusEmailToClientHelper error:", error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 503 }
      );
    }
    const { auth, db } = admin;
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (!idToken)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const { uid } = await auth.verifyIdToken(idToken);
    const { bookingId, action } = (await req.json()) as Body;
    if (!bookingId || !action)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const ref = db.collection("bookings").doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const b = snap.data() as any;
    const now = Date.now();
    const isMaster = b.masterUid === uid;
    const isClient = b.clientUid === uid;

    if (action === "confirm") {
      if (!isMaster)
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      if (b.status !== "pending")
        return NextResponse.json({ error: "Invalid state" }, { status: 400 });
      await db.runTransaction(async (tx) => {
        const s2 = await tx.get(ref);
        const bb = s2.data() as any;
        if (bb.status !== "pending") throw new Error("State changed");
        const q = await tx.get(
          db
            .collection("bookings")
            .where("masterUid", "==", bb.masterUid)
            .where("status", "==", "confirmed")
            .where("startMs", "<", bb.endMs)
        );
        const overlapping = q.docs.some(
          (d) => (d.data() as any).endMs > bb.startMs && d.id !== ref.id
        );
        if (overlapping) throw new Error("Time slot not available");
        tx.update(ref, { status: "confirmed", updatedAt: now });
      });
      if (b.masterUid && b.clientUid) {
        const chatId = `${b.masterUid}_${b.clientUid}`;
        const chatRef = db.collection("chats").doc(chatId);
        await chatRef.set(
          {
            participants: [b.masterUid, b.clientUid],
            lastMessage: "",
            lastUpdated: FieldValue.serverTimestamp(),
            bookingId: ref.id,
          },
          { merge: true }
        );
      }
      try {
        // chat notification schema: { userId, type, read, createdAt, ... }
        // Use userId field to match chat notification pattern
        // updated for unified targetUid
        const notificationData = {
          userId: b.clientUid || null, // target user who should see this notification
          type: "booking_status",
          bookingId: ref.id,
          masterUid: b.masterUid || null,
          clientUid: b.clientUid || null,
          targetUid: b.clientUid || null, // unified field for recipient
          status: "confirmed",
          message: "Your booking was confirmed",
          createdAt: FieldValue.serverTimestamp(),
          read: false,
        };
        await db.collection("notifications").add(notificationData);
        console.log("[booking] status notification for client created", {
          bookingId: ref.id,
          status: "confirmed",
          clientUid: b.clientUid || null,
          masterUid: b.masterUid || null,
          notificationData: {
            ...notificationData,
            createdAt: "[serverTimestamp]",
          },
        });
      } catch (err) {
        console.error("Failed to create booking status notification", err);
      }

      // Email notification to client (best-effort, after status update + notification)
      try {
        const updatedBooking = await ref.get();
        const bookingData = updatedBooking.exists ? (updatedBooking.data() as any) : null;
        if (bookingData && bookingData.clientUid) {
          await sendBookingStatusEmailToClientHelper(
            db,
            bookingData,
            "confirmed",
            bookingId
          );
        }
      } catch (emailErr) {
        console.error("[bookingAct] confirm email error", emailErr);
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "decline") {
      if (!isMaster)
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      if (b.status !== "pending")
        return NextResponse.json({ error: "Invalid state" }, { status: 400 });
      await ref.update({ status: "declined", updatedAt: now });
      try {
        // chat notification schema: { userId, type, read, createdAt, ... }
        // Use userId field to match chat notification pattern
        // updated for unified targetUid
        const notificationData = {
          userId: b.clientUid || null, // target user who should see this notification
          type: "booking_status",
          bookingId: ref.id,
          masterUid: b.masterUid || null,
          clientUid: b.clientUid || null,
          targetUid: b.clientUid || null, // unified field for recipient
          status: "declined",
          message: "Your booking was declined",
          createdAt: FieldValue.serverTimestamp(),
          read: false,
        };
        await db.collection("notifications").add(notificationData);
        console.log("[booking] status notification for client created", {
          bookingId: ref.id,
          status: "declined",
          clientUid: b.clientUid || null,
          masterUid: b.masterUid || null,
          notificationData: {
            ...notificationData,
            createdAt: "[serverTimestamp]",
          },
        });
      } catch (err) {
        console.error("Failed to create booking status notification", err);
      }

      // Email notification to client (best-effort, after status update + notification)
      try {
        const updatedBooking = await ref.get();
        const bookingData = updatedBooking.exists ? (updatedBooking.data() as any) : null;
        if (bookingData && bookingData.clientUid) {
          await sendBookingStatusEmailToClientHelper(
            db,
            bookingData,
            "declined",
            bookingId
          );
        }
      } catch (emailErr) {
        console.error("[bookingAct] decline email error", emailErr);
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "cancel") {
      if (!isMaster && !isClient)
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      if (!["pending", "confirmed"].includes(b.status))
        return NextResponse.json({ error: "Invalid state" }, { status: 400 });
      
      const previousStatus = b.status;
      await ref.update({ status: "cancelled", updatedAt: now });

      // Email notification to client (best-effort, after status update)
      // Only send if status actually changed
      if (previousStatus !== "cancelled" && b.clientUid) {
        try {
          const updatedBooking = await ref.get();
          const bookingData = updatedBooking.exists ? (updatedBooking.data() as any) : null;
          if (bookingData) {
            await sendBookingStatusEmailToClientHelper(
              db,
              bookingData,
              "cancelled",
              bookingId
            );
          }
        } catch (emailErr) {
          console.error("[bookingAct] cancel email error", emailErr);
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "complete") {
      if (!isMaster)
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      if (b.status !== "confirmed")
        return NextResponse.json({ error: "Invalid state" }, { status: 400 });
      await ref.update({ status: "completed", updatedAt: now });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}
