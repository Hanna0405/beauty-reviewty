import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";

export type EffectiveNotificationPrefs = {
  bookingNewRequestEnabled: boolean;
  bookingStatusChangeEnabled: boolean;
  chatMessageEnabled: boolean;
  emailForNotifications: string | null;
  marketingEnabled: boolean;
};

/**
 * Gets effective notification preferences for a user by:
 * 1. Loading settings from profiles/{uid}
 * 2. Loading user auth record for primary email
 * 3. Applying defaults and override logic
 *
 * Returns sensible defaults if user/profile not found.
 */
export async function getEffectiveNotificationPrefsForUser(
  userId: string
): Promise<EffectiveNotificationPrefs> {
  const db = getAdminDb();
  if (!db) {
    console.warn(
      "[notifications] getEffectiveNotificationPrefsForUser: Admin DB not available"
    );
    return {
      bookingNewRequestEnabled: true,
      bookingStatusChangeEnabled: true,
      chatMessageEnabled: true,
      emailForNotifications: null,
      marketingEnabled: false,
    };
  }

  try {
    // 1) Load raw settings doc from profiles/{uid}
    const profileSnap = await db.collection("profiles").doc(userId).get();
    const profile = profileSnap.exists ? (profileSnap.data() as any) : null;

    // 2) Load user auth record for primary email
    let primaryEmail: string | null = null;
    try {
      const auth = getAdminAuth();
      const userRecord = await auth.getUser(userId);
      primaryEmail = userRecord.email || null;
    } catch {
      // If auth record not found, fallback to profile email
      primaryEmail = profile?.email || null;
    }

    // 3) Apply defaults + override logic

    // Toggles: if explicitly false → disable, otherwise enable (default true)
    const bookingNewRequestEnabled =
      profile?.notifyOnBookingRequest !== false &&
      profile?.notifyOnBooking !== false;
    const bookingStatusChangeEnabled =
      profile?.notifyOnBookingStatus !== false;
    const chatMessageEnabled =
      profile?.notifyOnChatMessages !== false &&
      profile?.notifyOnChat !== false;
    const marketingEnabled = profile?.marketingOptIn === true;

    // Email override: if useNotifyEmail !== false AND notifyEmail is set → use notifyEmail
    // Otherwise → use primary email
    let emailForNotifications: string | null = null;
    const notifyEmail = profile?.notifyEmail?.trim();
    const useNotifyEmail = profile?.useNotifyEmail !== false; // default true if missing

    if (useNotifyEmail && notifyEmail) {
      emailForNotifications = notifyEmail;
    } else {
      emailForNotifications = primaryEmail;
    }

    return {
      bookingNewRequestEnabled,
      bookingStatusChangeEnabled,
      chatMessageEnabled,
      emailForNotifications,
      marketingEnabled,
    };
  } catch (error) {
    console.error(
      "[notifications] getEffectiveNotificationPrefsForUser error:",
      error
    );
    // Return defaults on error
    return {
      bookingNewRequestEnabled: true,
      bookingStatusChangeEnabled: true,
      chatMessageEnabled: true,
      emailForNotifications: null,
      marketingEnabled: false,
    };
  }
}

