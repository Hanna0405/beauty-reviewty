import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyAuthHeader } from "@/server/auth/verifyIdToken";

type Role = "master" | "client";

export async function GET(req: NextRequest) {
  return handleRequest(req, "GET");
}

export async function POST(req: NextRequest) {
  return handleRequest(req, "POST");
}

async function handleRequest(req: NextRequest, method: "GET" | "POST") {
  try {
    const db = getAdminDb();
    if (!db) {
      return new Response(JSON.stringify({ ok: false, error: "Admin DB not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let userId: string | null = null;
    let role: Role | null = null;

    let body: any = null;
    if (method === "POST") {
      body = await req.json().catch(() => null);
    }

    if (body?.userId && body?.scope) {
      userId = body.userId;
      role = body.scope === "master" ? "master" : "client";
    } else {
      const authHeader = req.headers.get("authorization") || "";
      const decoded = await verifyAuthHeader(authHeader);
      if (!decoded?.uid) {
        return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
      }
      userId = decoded.uid;

      const profileSnap = await db.collection("profiles").doc(userId).get();
      const profile = profileSnap.exists ? profileSnap.data() : null;
      if (profile?.role === "master" || profile?.isMaster === true) {
        role = "master";
      } else {
        role = "client";
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing user id" }), { status: 400 });
    }

    const queries =
      role === "master"
        ? [
            db.collection("bookings").where("masterUid", "==", userId).orderBy("createdAt", "desc").limit(200),
            db.collection("bookings").where("masterId", "==", userId).orderBy("createdAt", "desc").limit(200),
          ]
        : [
            db.collection("bookings").where("clientId", "==", userId).orderBy("createdAt", "desc").limit(200),
            db.collection("bookings").where("clientUid", "==", userId).orderBy("createdAt", "desc").limit(200),
          ];

    const snapshots = await Promise.all(
      queries.map(async (q) => {
        try {
          return await q.get();
        } catch (err) {
          return null;
        }
      })
    );

    const bookingsMap = new Map<string, any>();
    snapshots.forEach((snap) => {
      if (!snap) return;
      snap.forEach((doc) => {
        bookingsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    });

    const raw = Array.from(bookingsMap.values());

    const listingIds = Array.from(new Set(raw.map((r: any) => r.listingId).filter(Boolean)));
    const listingMap: Record<string, any> = {};
    await Promise.all(
      listingIds.map(async (lid) => {
        try {
          const ls = await db.collection("listings").doc(lid).get();
          if (ls.exists) {
            const data = ls.data()!;
            listingMap[lid] = { title: data.title || "Listing", slug: data.slug || lid };
          }
        } catch {
          /* ignore */
        }
      })
    );

    const items = raw
      .map((entry: any) => ({
        ...entry,
        _listing: listingMap[entry.listingId] || null,
      }))
      .sort((a: any, b: any) => {
        const ax = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?._seconds || 0) * 1000;
        const bx = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?._seconds || 0) * 1000;
        return bx - ax;
      });

    return new Response(JSON.stringify({ ok: true, role, items }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Server error" }), { status: 500 });
  }
}
