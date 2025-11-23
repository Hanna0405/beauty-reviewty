import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sendChatMessageEmailNotification } from "@/lib/email/bookingEmails";
import { getEffectiveNotificationPrefsForUser } from "@/lib/settings/notifications";

/** Body: { bookingId: string, senderId: string, messageText: string } */
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

    const { bookingId, senderId, messageText } = await req.json();
    if (!bookingId || !senderId || !messageText) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "bookingId, senderId, messageText required",
        }),
        { status: 400 }
      );
    }

    const trimmedText = String(messageText).trim();
    if (!trimmedText) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    console.log("[chat-email] booking message notify called", {
      bookingId,
      senderId,
      messageLength: trimmedText.length,
    });

    // Load booking to get participants
    const bookingSnap = await db.collection("bookings").doc(bookingId).get();
    if (!bookingSnap.exists) {
      console.log("[chat-email] skip: booking not found", { bookingId });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const bookingData = bookingSnap.data() as any;
    const masterUid = bookingData.masterUid || bookingData.masterId || null;
    const clientUid = bookingData.clientUid || bookingData.clientId || null;

    // Find recipient (the other participant)
    const recipientId =
      senderId === masterUid ? clientUid : senderId === clientUid ? masterUid : null;

    if (!recipientId || recipientId === senderId) {
      console.log("[chat-email] skip: no recipient or same as sender", {
        bookingId,
        senderId,
        masterUid,
        clientUid,
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    console.log("[chat-email] recipient found", {
      bookingId,
      senderId,
      recipientId,
    });

    // Get effective notification preferences for recipient
    const prefs = await getEffectiveNotificationPrefsForUser(recipientId);

    // Check if chat message notifications are enabled
    if (!prefs.chatMessageEnabled) {
      console.log("[chat-email] skip: user disabled chat emails", {
        recipientId,
        bookingId,
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Guard: no email if there is no recipient email
    if (!prefs.emailForNotifications) {
      console.log("[chat-email] skip: no email for notifications", {
        bookingId,
        recipientId,
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Load recipient profile for display name
    const recipientProfileSnap = await db
      .collection("profiles")
      .doc(recipientId)
      .get();
    const recipientProfile = recipientProfileSnap.exists
      ? (recipientProfileSnap.data() as any)
      : null;

    // Get sender profile for sender name
    let senderName: string | null = null;
    try {
      const senderProfileSnap = await db
        .collection("profiles")
        .doc(senderId)
        .get();
      if (senderProfileSnap.exists) {
        const senderProfileData = senderProfileSnap.data() as any;
        senderName = senderProfileData?.displayName || null;
      }
    } catch {
      // ignore sender profile lookup errors
    }

    // Build chat URL
    const APP_BASE_URL =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const dashboardChatUrl = `${APP_BASE_URL}/dashboard/chat/${bookingId}`;

    console.log("[chat-email] will send", {
      bookingId,
      senderId,
      recipientId,
      recipientEmail: prefs.emailForNotifications,
    });

    // Send email notification
    await sendChatMessageEmailNotification({
      recipientEmail: prefs.emailForNotifications,
      recipientName: recipientProfile?.displayName || null,
      senderName,
      bookingId,
      messagePreview: trimmedText,
      dashboardChatUrl,
    })
      .then(() => {
        console.log("[chat-email] sent", {
          bookingId,
          recipientId,
        });
      })
      .catch((error) => {
        console.error("[chat-email] error sending email", error);
      });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    console.error("[booking/message/notify] error", e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "Server error" }),
      { status: 500 }
    );
  }
}

