import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb();

    // If no admin credentials in dev => don't crash, just return {count:0}
    if (!adminDb) {
      return new Response(
        JSON.stringify({
          ok: true,
          pendingBookings: 0,
          unreadMessages: 0,
          total: 0,
        }),
        { status: 200 }
      );
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: "userId required" }),
        { status: 400 }
      );
    }

    // 1) Pending bookings (и как master, и как client — чтобы всегда было корректно)
    const [asMaster, asClient] = await Promise.all([
      adminDb
        .collection("bookings")
        .where("masterId", "==", userId)
        .where("status", "==", "pending")
        .get(),
      adminDb
        .collection("bookings")
        .where("clientId", "==", userId)
        .where("status", "==", "pending")
        .get(),
    ]);
    const pendingBookings = (asMaster.size || 0) + (asClient.size || 0);

    // 2) Unread messages across chats (chat unread badge – source, works for both client and master)
    // reads path: chats/{chatId}/reads/{userId} = { lastReadAt: Timestamp }
    // This query works for both client and master since it filters by participants array containing userId
    const chatsSnap = await adminDb
      .collection("chats")
      .where("participants", "array-contains", userId)
      .limit(100)
      .get();
    let unreadMessages = 0;
    for (const chatDoc of chatsSnap.docs) {
      const chatId = chatDoc.id;
      const readDoc = await adminDb
        .collection("chats")
        .doc(chatId)
        .collection("reads")
        .doc(userId)
        .get();
      const lastReadAt = readDoc.exists
        ? (readDoc.data()!.lastReadAt as any)
        : null;

      // Возьмём последние 50 сообщений и посчитаем те, что новее lastReadAt и не от самого пользователя
      let q = adminDb
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(50);
      const msgsSnap = await q.get();
      for (const m of msgsSnap.docs) {
        const d: any = m.data();
        if (d.senderId === userId) continue;
        const ts = d.createdAt;
        const tMillis = ts?.toMillis
          ? ts.toMillis()
          : (ts?._seconds || 0) * 1000;
        const rMillis = lastReadAt?.toMillis
          ? lastReadAt.toMillis()
          : (lastReadAt?._seconds || 0) * 1000;
        if (!lastReadAt || tMillis > rMillis) unreadMessages++;
      }
    }

    // 3) Booking notifications: query all unread notifications for this user, filter by type
    // Use userId field to match notification schema
    const allNotificationsSnap = await adminDb
      .collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    const allDocs = allNotificationsSnap.docs;
    const bookingRequestCount = allDocs.filter(
      (d) => d.data().type === "booking_request"
    ).length;
    const bookingStatusCount = allDocs.filter(
      (d) => d.data().type === "booking_status"
    ).length;
    const bookingNotifications = bookingRequestCount + bookingStatusCount;

    // Debug: log what we found
    if (process.env.NODE_ENV === "development") {
      console.log("[unread] booking notifications for user", userId, {
        bookingRequestCount,
        bookingStatusCount,
        bookingNotifications,
        totalDocs: allDocs.length,
      });
    }

    const total = unreadMessages + pendingBookings + bookingNotifications;

    // Debug log in development
    if (process.env.NODE_ENV === "development" && total > 0) {
      console.log("[unread] total for user", userId, {
        unreadMessages,
        pendingBookings,
        bookingNotifications,
        total,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        pendingBookings,
        unreadMessages,
        bookingNotifications,
        total,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "Server error" }),
      { status: 500 }
    );
  }
}
