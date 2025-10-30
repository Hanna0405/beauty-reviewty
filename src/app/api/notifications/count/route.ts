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

    const { userId, role } = await req.json();
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

    // 2) Unread messages across chats
    // reads path: chats/{chatId}/reads/{userId} = { lastReadAt: Timestamp }
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

    return new Response(
      JSON.stringify({
        ok: true,
        pendingBookings,
        unreadMessages,
        total: unreadMessages + pendingBookings,
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
