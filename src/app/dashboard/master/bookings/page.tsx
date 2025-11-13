"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

type Booking = {
  id: string;
  clientId: string;
  masterId?: string;
  masterUid: string;
  listingId?: string;
  dateTime?: string;
  date?: string;
  start?: string;
  startAt?: string;
  time?: string;
  duration?: number;
  status?: string;
  note?: string;
  comment?: string;
  clientName?: string;
  clientPhone?: string;
  name?: string;
  phone?: string;
  customerName?: string;
  customerPhone?: string;
  unreadForMaster?: number;
  unreadForClient?: number;
};

export default function MasterBookingsPage() {
  const { user, loading } = useAuth() as { user: any; loading?: boolean };
  const router = useRouter();
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const userId = user?.uid || null;

  useEffect(() => {
    if (loading) return;

    if (!userId) {
      setClientBookings([]);
      setIncomingBookings([]);
      return;
    }

    const clientQ = query(
      collection(db, "bookings"),
      where("clientId", "==", userId)
    );
    const unsubClient = onSnapshot(clientQ, (snap) => {
      const data: Booking[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setClientBookings(data);
    });

    const masterQ = query(
      collection(db, "bookings"),
      where("masterUid", "==", userId)
    );
    const unsubMaster = onSnapshot(masterQ, (snap) => {
      const data: Booking[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setIncomingBookings(data);
    });

    return () => {
      unsubClient();
      unsubMaster();
    };
  }, [loading, userId]);

  const allBookings = [...clientBookings, ...incomingBookings].sort((a, b) => {
    const aDate = extractDate(a);
    const bDate = extractDate(b);
    return aDate - bDate;
  });

  function extractDate(booking: Booking) {
    const raw =
      booking.dateTime ||
      booking.startAt ||
      booking.start ||
      booking.date ||
      "";
    const d = raw ? new Date(raw) : null;
    if (d && !Number.isNaN(d.getTime())) return d.getTime();
    return 0;
  }

  function formatDateTime(booking: Booking) {
    let raw =
      booking.dateTime ||
      booking.startAt ||
      booking.start ||
      booking.date ||
      "";
    const hasSeparateTime = booking.time;
    if (!raw && hasSeparateTime) {
      return hasSeparateTime;
    }
    const d = raw ? new Date(raw) : null;
    if (d && !Number.isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString();
      const timePart = d.toLocaleTimeString();
      return datePart + " " + (booking.time || timePart);
    }
    return raw || "—";
  }

  function getClientName(booking: Booking) {
  return (
    booking.clientName ||
    booking.customerName ||
    booking.name ||
    ""
  );
}

  function getClientPhone(booking: Booking) {
  return (
    booking.clientPhone ||
    booking.customerPhone ||
    booking.phone ||
    ""
  );
}

  async function handleUpdateBookingStatus(id: string, status: string) {
    await updateDoc(doc(db, "bookings", id), {
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  async function handleDeleteBooking(id: string) {
    await deleteDoc(doc(db, "bookings", id));
  }

  function handleOpenChat(bookingId: string) {
    router.push(`/dashboard/chat/${bookingId}`);
  }

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold mb-4">My Bookings</h1>
        <p>Loading bookings…</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>
      {allBookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {allBookings.map((booking) => {
            const userId = user?.uid;
            const masterOfBooking = booking.masterId ?? booking.masterUid;
            const isMaster = masterOfBooking === userId;
            const isClient = booking.clientId === userId;
            const status = booking.status || "pending";
            const clientName = getClientName(booking);
            const clientPhone = getClientPhone(booking);
            return (
              <div
                key={booking.id}
                className="rounded-lg bg-white/70 border p-4 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    BOOKING #{booking.id.slice(0, 6)}
                  </div>
                  {booking.listingId ? (
                    <Link
                      href={`/listings/${booking.listingId}`}
                      className="text-xs text-pink-500 hover:underline"
                    >
                      Open listing →
                    </Link>
                  ) : null}
                </div>

                <div className="text-sm">
                  <span className="font-medium">Date &amp; time:</span>{" "}
                  {formatDateTime(booking)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Duration:</span>{" "}
                  {booking.duration ? `${booking.duration} min` : "—"}
                </div>

                {clientName ? (
                  <div className="text-sm">
                    <span className="font-medium">Client:</span> {clientName}
                  </div>
                ) : null}
                {clientPhone ? (
                  <div className="text-sm">
                    <span className="font-medium">Phone:</span> {clientPhone}
                  </div>
                ) : null}
                {booking.note || booking.comment ? (
                  <div className="text-sm">
                    <span className="font-medium">Comment:</span>{" "}
                    {booking.note || booking.comment}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : status === "declined"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {status}
                  </span>

                  <button
                    onClick={() => handleOpenChat(booking.id)}
                    className="px-3 py-1 rounded-full text-xs bg-pink-100 text-pink-700 flex items-center gap-1"
                  >
                    Chat
                    {((isMaster ? booking.unreadForMaster : booking.unreadForClient) || 0) > 0 ? (
                      <span className="min-w-4 h-4 px-1 rounded-full bg-pink-500 text-white text-[9px] flex items-center justify-center">
                        {isMaster ? booking.unreadForMaster : booking.unreadForClient}
                      </span>
                    ) : null}
                  </button>

                  {isMaster ? (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateBookingStatus(booking.id, "confirmed")
                        }
                        className="px-3 py-1 rounded-full text-xs bg-green-400 text-white"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateBookingStatus(booking.id, "declined")
                        }
                        className="px-3 py-1 rounded-full text-xs bg-yellow-300 text-gray-800"
                      >
                        Decline
                      </button>
                    </>
                  ) : null}

                  {isClient && !isMaster ? (
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
