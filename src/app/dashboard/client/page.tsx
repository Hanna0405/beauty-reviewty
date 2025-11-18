"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadBookingNotifications } from "@/lib/notifications";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { bookingStatusCount: unreadClientBookings } =
    useUnreadBookingNotifications({
      mode: "client",
      userUid: user?.uid,
    });

  return (
    <div className="space-y-6">
      {/* top header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.email || "client"}
        </h1>
        <p className="text-sm text-gray-500">Your client workspace</p>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-blue-700">
            Role: client
          </span>
          {user?.email && <span>Email: {user.email}</span>}
          {user?.uid && <span>UID: {user.uid.slice(0, 10)}...</span>}
        </div>
      </div>

      {/* cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bookings */}
        <div className="rounded-xl bg-white shadow-sm border border-blue-100 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Bookings</h2>
                {unreadClientBookings > 0 && (
                  <span className="inline-flex min-w-[20px] h-5 px-1 rounded-full text-xs font-semibold bg-red-500 text-white items-center justify-center">
                    {unreadClientBookings > 9 ? "9+" : unreadClientBookings}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                View your booking requests and statuses.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex w-fit rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50"
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}
