"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Avatar } from "@/components/ui/Avatar";
import { db } from "@/lib/firebase";

type AvatarWithBadgeProps = {
  user: {
    uid: string;
    role: "master" | "client";
    name?: string;
    photoURL?: string | null;
    avatarUrl?: string | null;
    avatar?: { url?: string };
  };
};

export function AvatarWithBadge({ user }: AvatarWithBadgeProps) {
  const [clientUnread, setClientUnread] = useState(0);
  const [masterUnread, setMasterUnread] = useState(0);
  const [bookingRequestCount, setBookingRequestCount] = useState(0);
  const [bookingStatusCount, setBookingStatusCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setClientUnread(0);
      setMasterUnread(0);
      setBookingRequestCount(0);
      setBookingStatusCount(0);
      return;
    }

    // Booking chat unread (existing logic - do not change)
    const bookingsCol = collection(db, "bookings");
    const clientQ = query(bookingsCol, where("clientId", "==", user.uid));
    const masterQ = query(bookingsCol, where("masterUid", "==", user.uid));

    const unsubClient = onSnapshot(
      clientQ,
      (snap) => {
        let sum = 0;
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (typeof data?.unreadForClient === "number") {
            sum += data.unreadForClient;
          }
        });
        setClientUnread(sum);
      },
      () => {
        setClientUnread(0);
      }
    );

    const unsubMaster = onSnapshot(
      masterQ,
      (snap) => {
        let sum = 0;
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (typeof data?.unreadForMaster === "number") {
            sum += data.unreadForMaster;
          }
        });
        setMasterUnread(sum);
      },
      () => {
        setMasterUnread(0);
      }
    );

    // Booking unread counts from notifications collection
    // updated for unified targetUid - query all booking notifications for this user
    const notificationsRef = collection(db, "notifications");
    const bookingNotificationsQuery = query(
      notificationsRef,
      where("targetUid", "==", user.uid),
      where("read", "==", false),
      where("type", "in", ["booking_request", "booking_status"])
    );

    const unsubBookingNotifications = onSnapshot(
      bookingNotificationsQuery,
      (snap) => {
        let reqCount = 0;
        let statusCount = 0;
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.type === "booking_request") {
            reqCount += 1;
          } else if (data.type === "booking_status") {
            statusCount += 1;
          }
        });
        setBookingRequestCount(reqCount);
        setBookingStatusCount(statusCount);
      },
      () => {
        setBookingRequestCount(0);
        setBookingStatusCount(0);
      }
    );

    return () => {
      unsubClient();
      unsubMaster();
      unsubBookingNotifications();
    };
  }, [user?.uid]);

  const chatCount = clientUnread + masterUnread;
  const bookingNotifications = bookingRequestCount + bookingStatusCount;
  const totalUnread = chatCount + bookingNotifications;

  console.log(
    "[unread hook] chat:",
    chatCount,
    "bookingReq:",
    bookingRequestCount,
    "bookingStatus:",
    bookingStatusCount,
    "total:",
    totalUnread
  );

  return (
    <div className="relative inline-block">
      <Avatar
        name={user?.name || "User"}
        size={36}
        photoURL={user?.photoURL}
        avatarUrl={user?.avatarUrl}
        avatar={user?.avatar}
      />
      {!!totalUnread && (
        <span
          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[11px] leading-none px-1.5 py-0.5 border-2 border-white"
          title={`${totalUnread} unread`}
        >
          {totalUnread}
        </span>
      )}
    </div>
  );
}
