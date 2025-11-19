"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Clears booking notifications for any user (unified with targetUid).
 * updated for unified targetUid - removes role-dependent logic
 */
export async function clearMasterBookingUnread(uid: string): Promise<void> {
  if (!uid) return;

  try {
    // updated for unified targetUid
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("targetUid", "==", uid),
      where("type", "in", ["booking_request", "booking_status"]),
      where("read", "==", false)
    );

    const snap = await getDocs(q);
    if (snap.empty) {
      console.log(
        "[notifications/cleaner] no unread booking notifications for master",
        uid
      );
      return;
    }

    const batch = writeBatch(db);
    snap.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();

    console.log(
      "[notifications/cleaner] cleared master booking unread flags for",
      uid,
      "count:",
      snap.size
    );

    // Trigger badge refresh
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("notify:refresh"));
    }
  } catch (error) {
    console.error(
      "[notifications/cleaner] error clearing master booking unread flags",
      error
    );
    throw error;
  }
}

/**
 * Clears booking notifications for client (queries by clientUid field).
 * updated for client dashboard - uses clientUid field instead of targetUid
 */
export async function clearClientBookingUnread(uid: string): Promise<void> {
  if (!uid) return;

  try {
    // Query by clientUid field for client notifications
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("clientUid", "==", uid),
      where("type", "in", ["booking_request", "booking_status"]),
      where("read", "==", false)
    );

    const snap = await getDocs(q);
    if (snap.empty) {
      console.log(
        "[notifications/cleaner] no unread booking notifications for client",
        uid
      );
      return;
    }

    const batch = writeBatch(db);
    snap.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();

    console.log(
      "[notifications/cleaner] cleared client booking unread flags for",
      uid,
      "count:",
      snap.size
    );

    // Trigger badge refresh
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("notify:refresh"));
    }
  } catch (error) {
    console.error(
      "[notifications/cleaner] error clearing client booking unread flags",
      error
    );
    throw error;
  }
}

/**
 * Legacy function for backward compatibility - delegates to unified function
 * updated for unified targetUid
 */
export async function clearBookingNotificationsForUser({
  mode,
  userUid,
}: {
  mode: "master" | "client";
  userUid: string;
}): Promise<void> {
  // Both modes now use the same logic with targetUid
  return clearMasterBookingUnread(userUid);
}

/**
 * Hook to subscribe to unread booking notifications for a user.
 * updated for unified targetUid - queries notifications collection with targetUid
 * mode: 'master' | 'client' | 'all' | 'clientDashboard' (clientDashboard uses clientUid field)
 * Returns both bookingRequestCount and bookingStatusCount
 */
export function useUnreadBookingNotifications({
  mode,
  userUid,
}: {
  mode: "master" | "client" | "all" | "clientDashboard";
  userUid: string | null | undefined;
}): { bookingRequestCount: number; bookingStatusCount: number } {
  const [bookingRequestCount, setBookingRequestCount] = useState(0);
  const [bookingStatusCount, setBookingStatusCount] = useState(0);

  useEffect(() => {
    if (!userUid) {
      setBookingRequestCount(0);
      setBookingStatusCount(0);
      return;
    }

    const notificationsRef = collection(db, "notifications");
    let q;

    if (mode === "clientDashboard") {
      // clientDashboard mode: query by clientUid field
      q = query(
        notificationsRef,
        where("clientUid", "==", userUid),
        where("read", "==", false),
        where("type", "in", ["booking_request", "booking_status"])
      );
    } else {
      // All other modes: use unified targetUid
      q = query(
        notificationsRef,
        where("targetUid", "==", userUid),
        where("read", "==", false),
        where("type", "in", ["booking_request", "booking_status"])
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let reqCount = 0;
        let statusCount = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.type === "booking_request") {
            reqCount += 1;
          } else if (data.type === "booking_status") {
            statusCount += 1;
          }
        });
        setBookingRequestCount(reqCount);
        setBookingStatusCount(statusCount);

        const total = reqCount + statusCount;
        if (mode !== "all") {
          console.log(
            `[dashboard/${mode}] unread booking notifications count:`,
            total
          );
        }
      },
      (error) => {
        console.error(
          `[dashboard/${mode}] booking notifications listener error`,
          error
        );
        setBookingRequestCount(0);
        setBookingStatusCount(0);
      }
    );

    return () => unsubscribe();
  }, [userUid, mode]);

  return { bookingRequestCount, bookingStatusCount };
}
