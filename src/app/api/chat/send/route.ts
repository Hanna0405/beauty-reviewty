import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { sendChatMessageEmailNotification } from "@/lib/email/bookingEmails";
import { getEffectiveNotificationPrefsForUser } from "@/lib/settings/notifications";

/** Body: { chatId: string, senderId: string, text: string } */
export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return new Response(JSON.stringify({ ok: false, error: "Admin DB not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { chatId, senderId, text } = await req.json();
    if (!chatId || !senderId || !text) {
      return new Response(
        JSON.stringify({ ok: false, error: "chatId, senderId, text required" }),
        { status: 400 },
      );
    }

    // Guard: no email if message content is empty or only whitespace
    const trimmedText = String(text).trim();
    if (!trimmedText) {
      return new Response(
        JSON.stringify({ ok: false, error: "Message text cannot be empty" }),
        { status: 400 },
      );
    }

    const msg = { senderId, text: trimmedText, createdAt: Timestamp.now() };
    const ref = db.collection("chats").doc(chatId);
    await ref.collection("messages").add(msg);
    await ref.update({ lastMessage: trimmedText, updatedAt: Timestamp.now() });

    // EMAIL: notify the other participant (best-effort, respects profile settings)
    try {
      console.log("[chat-email] starting email check", {
        chatId,
        senderId,
        messageLength: trimmedText.length,
      });

      const snap = await ref.get();
      const c = snap.data() as any;
      if (!c) {
        console.log("[chat-email] skip: chat document not found", { chatId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const targetUid = (c.participants || []).find(
        (p: string) => p !== senderId && p && p.trim()
      );

      // Guard: no email if sender and recipient are the same
      if (!targetUid || targetUid === senderId) {
        console.log("[chat-email] skip: no recipient or same as sender", {
          chatId,
          senderId,
          targetUid,
          participants: c.participants,
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      console.log("[chat-email] recipient found", {
        chatId,
        senderId,
        recipientId: targetUid,
      });

      // Get effective notification preferences for recipient
      const prefs = await getEffectiveNotificationPrefsForUser(targetUid);

      // Check if chat message notifications are enabled
      if (!prefs.chatMessageEnabled) {
        console.log("[chat-email] skip: user disabled chat emails", {
          recipientId: targetUid,
          chatId,
          bookingId: c.bookingId || null,
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Guard: no email if there is no recipient email
      if (!prefs.emailForNotifications) {
        console.log("[chat-email] skip: no email for notifications", {
          chatId,
          recipientId: targetUid,
          bookingId: c.bookingId || null,
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Load recipient profile for display name
      const recipientProfileSnap = await db
        .collection("profiles")
        .doc(targetUid)
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

      // Build chat URL using bookingId if available
      const bookingId = c.bookingId || null;
      let dashboardChatUrl: string | null = null;
      if (bookingId) {
        const APP_BASE_URL =
          process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
        dashboardChatUrl = `${APP_BASE_URL}/dashboard/chat/${bookingId}`;
      }

      console.log("[chat-email] will send", {
        bookingId,
        senderId,
        recipientId: targetUid,
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
            recipientId: targetUid,
          });
        })
        .catch((error) => {
          console.error("[chat-email] error sending email", error);
        });
    } catch (emailErr) {
      console.error("[chat/send] email error", emailErr);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "Server error" }),
      { status: 500 },
    );
  }
}
