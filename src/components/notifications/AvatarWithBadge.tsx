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

  useEffect(() => {
    if (!user?.uid) {
      setClientUnread(0);
      setMasterUnread(0);
      return;
    }

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

    return () => {
      unsubClient();
      unsubMaster();
    };
  }, [user?.uid]);

  const count = clientUnread + masterUnread;

  return (
    <div className="relative inline-block">
      <Avatar
        name={user?.name || "User"}
        size={36}
        photoURL={user?.photoURL}
        avatarUrl={user?.avatarUrl}
        avatar={user?.avatar}
      />
      {!!count && (
        <span
          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[11px] leading-none px-1.5 py-0.5 border-2 border-white"
          title={`${count} unread`}
        >
          {count}
        </span>
      )}
    </div>
  );
}
