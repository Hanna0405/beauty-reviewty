"use client";

import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { requireAuth, requireDb } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

type SettingsData = {
  // Notifications
  notifyOnBookingRequest: boolean;
  notifyOnBookingStatus: boolean;
  notifyOnChatMessages: boolean;
  // Email preferences
  notifyEmail: string;
  useNotifyEmail: boolean;
  marketingOptIn: boolean;
  // Profile & privacy
  isPublicProfile: boolean;
  allowBookingRequests: boolean;
  // Availability
  offDays: string[]; // array of ISO dates 'YYYY-MM-DD'
  // Working hours
  workingHours?: {
    start: string; // "09:00"
    end: string; // "18:00"
  };
};

const defaultSettings: SettingsData = {
  notifyOnBookingRequest: true,
  notifyOnBookingStatus: true,
  notifyOnChatMessages: true,
  notifyEmail: "",
  useNotifyEmail: true,
  marketingOptIn: false,
  isPublicProfile: true,
  allowBookingRequests: true,
  offDays: [],
  workingHours: undefined,
};

export default function SettingsPage() {
  const auth = requireAuth();
  const user = auth.currentUser;
  const uid = useMemo(() => user?.uid ?? "", [user]);

  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isAdminAccount, setIsAdminAccount] = useState(false);

  // Off days management
  const [newOffDay, setNewOffDay] = useState("");
  
  // Working hours state (managed separately but synced to settings)
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const db = requireDb();
        const snap = await getDoc(doc(db, "profiles", uid));

        // Per-field defaults, including user email fallback
        const defaults: SettingsData = {
          notifyOnBookingRequest: true,
          notifyOnBookingStatus: true,
          notifyOnChatMessages: true,
          notifyEmail: user?.email ?? "",
          useNotifyEmail: true,
          marketingOptIn: false,
          isPublicProfile: true,
          allowBookingRequests: true,
          offDays: [],
          workingHours: undefined,
        };

        if (snap.exists()) {
          const data = snap.data() as any;
          if (cancelled) return;

          const loaded: SettingsData = {
            notifyOnBookingRequest:
              data.notifyOnBookingRequest ??
              data.notifyOnBooking ??
              defaults.notifyOnBookingRequest,
            notifyOnBookingStatus:
              data.notifyOnBookingStatus ?? defaults.notifyOnBookingStatus,
            notifyOnChatMessages:
              data.notifyOnChatMessages ??
              data.notifyOnChat ??
              defaults.notifyOnChatMessages,
            notifyEmail: data.notifyEmail ?? defaults.notifyEmail,
            useNotifyEmail: data.useNotifyEmail ?? defaults.useNotifyEmail,
            marketingOptIn:
              data.marketingOptIn ??
              data.allowMarketingEmails ??
              defaults.marketingOptIn,
            isPublicProfile:
              data.isPublicProfile ??
              data.isVisibleAsMaster ??
              defaults.isPublicProfile,
            allowBookingRequests:
              data.allowBookingRequests ??
              data.allowBookings ??
              defaults.allowBookingRequests,
            offDays: Array.isArray(data.offDays)
              ? data.offDays.filter((d: any) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
              : defaults.offDays,
            workingHours: data?.workingHours && typeof data.workingHours === 'object' && 
              typeof data.workingHours.start === 'string' && 
              typeof data.workingHours.end === 'string'
              ? {
                  start: data.workingHours.start,
                  end: data.workingHours.end,
                }
              : defaults.workingHours,
          };

          setSettings(loaded);
          setIsAdminAccount(data.role === "admin");

          // Sync working hours to local state for form inputs
          if (loaded.workingHours) {
            setStartTime(loaded.workingHours.start || "09:00");
            setEndTime(loaded.workingHours.end || "18:00");
          }
        } else {
          if (cancelled) return;
          setSettings(defaults);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  function setField<K extends keyof SettingsData>(
    key: K,
    val: SettingsData[K]
  ) {
    setSettings((s) => ({ ...s, [key]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) {
      setError("No authenticated user.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const db = requireDb();
      const payload: any = {
        // New canonical settings fields
        notifyOnBookingRequest: settings.notifyOnBookingRequest,
        notifyOnBookingStatus: settings.notifyOnBookingStatus,
        notifyOnChatMessages: settings.notifyOnChatMessages,
        notifyEmail: settings.notifyEmail.trim(),
        marketingOptIn: settings.marketingOptIn,
        isPublicProfile: settings.isPublicProfile,
        allowBookingRequests: settings.allowBookingRequests,
        // Legacy fields kept in sync for backwards compatibility
        notifyOnBooking: settings.notifyOnBookingRequest,
        notifyOnChat: settings.notifyOnChatMessages,
        allowMarketingEmails: settings.marketingOptIn,
        isVisibleAsMaster: settings.isPublicProfile,
        allowBookings: settings.allowBookingRequests,
        useNotifyEmail: settings.useNotifyEmail,
        offDays: settings.offDays,
        workingHours: startTime && endTime ? {
          start: startTime.trim(),
          end: endTime.trim(),
        } : undefined,
      };

      await setDoc(doc(db, "profiles", uid), payload, { merge: true });
      
      // Update settings state with working hours
      setSettings(prev => ({ 
        ...prev, 
        workingHours: startTime && endTime ? { start: startTime.trim(), end: endTime.trim() } : undefined 
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user || isAdminAccount) return;

    setIsDeletingAccount(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to delete account");
      }

      setShowDeleteModal(false);
      await signOut(auth);
      window.location.href = "/";
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr?.code === "auth/requires-recent-login") {
        setError(
          "For security, please sign out, sign in again, then try deleting your account."
        );
      } else {
        setError(
          firebaseErr?.message || "Failed to delete account. Please try again."
        );
      }
    } finally {
      setIsDeletingAccount(false);
    }
  }

  if (!uid) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-pink-50 p-6">
          <h1 className="text-2xl font-semibold mb-2">Settings</h1>
          <p className="text-red-600 text-sm">
            Please sign in to access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-pink-50 p-6">
          Loading…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-gray-500">
              Manage notifications, profile visibility and preferences.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 text-sm text-red-700 p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 text-sm text-green-700 p-3">
                Settings saved
              </div>
            )}

            {/* 0) Working hours */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <h2 className="text-lg font-semibold">Working hours</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Start time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full max-w-xs rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">End time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full max-w-xs rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 1) Availability */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Availability (for masters)</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Mark days when you are not available for bookings.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newOffDay}
                    onChange={(e) => setNewOffDay(e.target.value)}
                    className="flex-1 rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newOffDay) return;
                      const normalizedDate = newOffDay.trim();
                      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
                        setError("Invalid date format. Please use YYYY-MM-DD.");
                        return;
                      }
                      if (settings.offDays.includes(normalizedDate)) {
                        setError("This date is already marked as unavailable.");
                        return;
                      }
                      setField("offDays", [...settings.offDays, normalizedDate].sort());
                      setNewOffDay("");
                      setError(null);
                    }}
                    className="px-4 py-2 rounded-md bg-pink-500 text-white text-sm hover:bg-pink-600 whitespace-nowrap"
                  >
                    Add day
                  </button>
                </div>
                {settings.offDays.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      Non-working days:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.offDays.map((dateStr) => (
                        <div
                          key={dateStr}
                          className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
                        >
                          <span>
                            {new Date(dateStr + "T12:00:00").toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setField(
                                "offDays",
                                settings.offDays.filter((d) => d !== dateStr)
                              );
                            }}
                            className="text-red-600 hover:text-red-700 font-medium"
                            aria-label={`Remove ${dateStr}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2) Booking & chat notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <h2 className="text-lg font-semibold">
                Booking & chat notifications
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnBookingRequest}
                    onChange={(e) =>
                      setField("notifyOnBookingRequest", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Notify about new booking requests
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnBookingStatus}
                    onChange={(e) =>
                      setField("notifyOnBookingStatus", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Notify when booking status changes
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnChatMessages}
                    onChange={(e) =>
                      setField("notifyOnChatMessages", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Notify about new chat messages
                  </span>
                </label>
              </div>
            </div>

            {/* 3) Email preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <h2 className="text-lg font-semibold">Email preferences</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Notification email
                  </label>
                  <input
                    type="email"
                    value={settings.notifyEmail}
                    onChange={(e) =>
                      setField("notifyEmail", e.target.value || "")
                    }
                    placeholder="your@email.com"
                    className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useNotifyEmail}
                    onChange={(e) =>
                      setField("useNotifyEmail", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Use this email for booking & chat notifications
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.marketingOptIn}
                    onChange={(e) =>
                      setField("marketingOptIn", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Receive promos & updates from BeautyReviewty
                  </span>
                </label>
              </div>
            </div>

            {/* 4) Profile & privacy */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <h2 className="text-lg font-semibold">Profile & privacy</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isPublicProfile}
                    onChange={(e) =>
                      setField("isPublicProfile", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Show my master profile in public search
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowBookingRequests}
                    onChange={(e) =>
                      setField("allowBookingRequests", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Allow clients to send me booking requests
                  </span>
                </label>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-pink-500 text-white text-sm hover:bg-pink-600 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 space-y-3">
            <h2 className="text-lg font-semibold text-red-900/90">Delete account</h2>
            <p className="text-sm text-gray-600">
              Permanently delete your account. This action cannot be undone.
            </p>
            <p className="text-xs text-gray-500">
              Need help? Contact{" "}
              <a
                href="mailto:hello@beautyreviewty.app"
                className="text-pink-600 hover:text-pink-700 hover:underline"
              >
                hello@beautyreviewty.app
              </a>
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeletingAccount || isAdminAccount}
              className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete account
            </button>
            {isAdminAccount ? (
              <p className="text-xs text-gray-500">
                Admin accounts cannot be deleted here.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => {
              if (!isDeletingAccount) setShowDeleteModal(false);
            }}
          />
          <div
            className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-lg ring-1 ring-red-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <h3
              id="delete-account-title"
              className="text-lg font-semibold text-gray-900"
            >
              Delete account?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingAccount ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
