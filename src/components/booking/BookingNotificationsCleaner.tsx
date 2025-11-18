"use client";

import { useEffect } from "react";
import { clearBookingNotificationsForUser } from "@/lib/notifications";

type BookingNotificationsCleanerProps = {
  userUid: string | null | undefined;
  mode: "master" | "client";
};

export function BookingNotificationsCleaner({
  userUid,
  mode,
}: BookingNotificationsCleanerProps) {
  useEffect(() => {
    if (!userUid) return;

    clearBookingNotificationsForUser({ mode, userUid }).catch((err) => {
      console.error(
        `[notifications/cleaner] error clearing booking notifications (mode: "${mode}")`,
        err
      );
    });
  }, [userUid, mode]);

  return null;
}
