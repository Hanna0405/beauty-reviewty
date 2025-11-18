"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadBookingNotifications } from "@/lib/notifications";

export default function MasterDashboardPage() {
  const { user } = useAuth();
  const { bookingRequestCount: unreadMasterBookings } =
    useUnreadBookingNotifications({
      mode: "master",
      userUid: user?.uid,
    });

  return (
    <div className="space-y-6">
      {/* top header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.email || "beauty master"}
        </h1>
        <p className="text-sm text-gray-500">Your master workspace</p>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-pink-700">
            Role: master
          </span>
          {user?.email && <span>Email: {user.email}</span>}
          {user?.uid && <span>UID: {user.uid.slice(0, 10)}...</span>}
        </div>
      </div>

      {/* cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* My Listings */}
        <div className="rounded-xl bg-white shadow-sm border border-pink-100 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="font-semibold">My Listings</h2>
              <p className="text-xs text-gray-500">
                Manage your services, photos and pricing.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/master/listings"
            className="inline-flex w-fit rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
          >
            Manage Listings
          </Link>
        </div>

        {/* My Profile */}
        <div className="rounded-xl bg-white shadow-sm border border-pink-100 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧍</span>
            <div>
              <h2 className="font-semibold">My Profile</h2>
              <p className="text-xs text-gray-500">
                Edit profile, photos and socials.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/master/profile"
            className="inline-flex w-fit rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
          >
            Manage Profile
          </Link>
        </div>

        {/* Bookings */}
        <div className="rounded-xl bg-white shadow-sm border border-pink-100 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Bookings</h2>
                {unreadMasterBookings > 0 && (
                  <span className="inline-flex min-w-[20px] h-5 px-1 rounded-full text-xs font-semibold bg-red-500 text-white items-center justify-center">
                    {unreadMasterBookings > 9 ? "9+" : unreadMasterBookings}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">Manage booking requests.</p>
            </div>
          </div>
          <Link
            href="/dashboard/master/bookings"
            className="inline-flex w-fit rounded-md bg-white px-4 py-2 text-sm font-medium text-pink-600 border border-pink-200 hover:bg-pink-50"
          >
            Open
          </Link>
        </div>

        {/* Settings */}
        <div className="rounded-xl bg-white shadow-sm border border-pink-100 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="font-semibold">Settings</h2>
              <p className="text-xs text-gray-500">General preferences.</p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex w-fit rounded-md bg-white px-4 py-2 text-sm font-medium text-pink-600 border border-pink-200 hover:bg-pink-50"
          >
            Open Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
