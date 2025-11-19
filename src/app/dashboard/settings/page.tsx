"use client";

import React, { useEffect, useMemo, useState } from "react";
import { requireAuth, requireDb } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

type SettingsData = {
  // Notifications
  notifyOnBooking?: boolean;
  notifyOnBookingStatus?: boolean;
  notifyOnChat?: boolean;
  // Email preferences
  notifyEmail?: string | null;
  useNotifyEmail?: boolean;
  allowMarketingEmails?: boolean;
  // Profile & privacy
  isVisibleAsMaster?: boolean;
  allowBookings?: boolean;
};

const defaultSettings: SettingsData = {
  notifyOnBooking: true,
  notifyOnBookingStatus: true,
  notifyOnChat: true,
  notifyEmail: null,
  useNotifyEmail: true,
  allowMarketingEmails: false,
  isVisibleAsMaster: true,
  allowBookings: true,
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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
        if (snap.exists()) {
          const data = snap.data() as any;
          if (cancelled) return;

          const loaded: SettingsData = {
            notifyOnBooking:
              data.notifyOnBooking ?? defaultSettings.notifyOnBooking,
            notifyOnBookingStatus:
              data.notifyOnBookingStatus ??
              defaultSettings.notifyOnBookingStatus,
            notifyOnChat: data.notifyOnChat ?? defaultSettings.notifyOnChat,
            notifyEmail: data.notifyEmail ?? defaultSettings.notifyEmail,
            useNotifyEmail:
              data.useNotifyEmail ?? defaultSettings.useNotifyEmail,
            allowMarketingEmails:
              data.allowMarketingEmails ?? defaultSettings.allowMarketingEmails,
            isVisibleAsMaster:
              data.isVisibleAsMaster ?? defaultSettings.isVisibleAsMaster,
            allowBookings: data.allowBookings ?? defaultSettings.allowBookings,
          };

          setSettings(loaded);
        } else {
          if (cancelled) return;
          setSettings(defaultSettings);
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
      const payload: SettingsData = {
        notifyOnBooking: settings.notifyOnBooking,
        notifyOnBookingStatus: settings.notifyOnBookingStatus,
        notifyOnChat: settings.notifyOnChat,
        notifyEmail: settings.notifyEmail?.trim() || null,
        useNotifyEmail: settings.useNotifyEmail,
        allowMarketingEmails: settings.allowMarketingEmails,
        isVisibleAsMaster: settings.isVisibleAsMaster,
        allowBookings: settings.allowBookings,
      };

      await setDoc(doc(db, "profiles", uid), payload, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !user.email) {
      setPasswordError("No authenticated user.");
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (!currentPassword || !newPassword) {
      setPasswordError("All fields are required.");
      return;
    }

    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      // Reauthenticate with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setPasswordError("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setPasswordError(err.message || "Password is too weak.");
      } else {
        setPasswordError(err?.message || "Failed to change password.");
      }
    } finally {
      setChangingPassword(false);
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

            {/* 1) Booking & chat notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <h2 className="text-lg font-semibold">
                Booking & chat notifications
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnBooking ?? true}
                    onChange={(e) =>
                      setField("notifyOnBooking", e.target.checked)
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
                    checked={settings.notifyOnBookingStatus ?? true}
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
                    checked={settings.notifyOnChat ?? true}
                    onChange={(e) => setField("notifyOnChat", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Notify about new chat messages
                  </span>
                </label>
              </div>
            </div>

            {/* 2) Email preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <h2 className="text-lg font-semibold">Email preferences</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Notification email
                  </label>
                  <input
                    type="email"
                    value={settings.notifyEmail ?? ""}
                    onChange={(e) =>
                      setField("notifyEmail", e.target.value || null)
                    }
                    placeholder="your@email.com"
                    className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useNotifyEmail ?? true}
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
                    checked={settings.allowMarketingEmails ?? false}
                    onChange={(e) =>
                      setField("allowMarketingEmails", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Receive promos & updates from BeautyReviewty
                  </span>
                </label>
              </div>
            </div>

            {/* 3) Profile & privacy */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <h2 className="text-lg font-semibold">Profile & privacy</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isVisibleAsMaster ?? true}
                    onChange={(e) =>
                      setField("isVisibleAsMaster", e.target.checked)
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
                    checked={settings.allowBookings ?? true}
                    onChange={(e) =>
                      setField("allowBookings", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm">
                    Allow clients to send me booking requests
                  </span>
                </label>
              </div>
            </div>

            {/* 4) Change password */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 space-y-4">
              <h2 className="text-lg font-semibold">Change password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="rounded-md bg-red-50 border border-red-200 text-sm text-red-700 p-3">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="rounded-md bg-green-50 border border-green-200 text-sm text-green-700 p-3">
                    Password updated
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2 rounded-md bg-pink-500 text-white text-sm hover:bg-pink-600 disabled:opacity-60"
                  >
                    {changingPassword ? "Changing…" : "Change password"}
                  </button>
                </div>
              </form>
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
        </div>
      )}
    </div>
  );
}
