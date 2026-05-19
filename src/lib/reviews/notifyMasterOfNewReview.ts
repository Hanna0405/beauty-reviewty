import { getEffectiveNotificationPrefsForUser } from "@/lib/settings/notifications";
import {
  buildMasterProfileUrl,
  sendReviewNotificationEmail,
} from "@/lib/email/sendReviewNotificationEmail";

export type NotifyMasterOfNewReviewOptions = {
  masterUid: string;
  masterName: string;
  /** Public profile doc id for /master/[id] links (falls back to masterUid). */
  profilePathId?: string;
  rating: number;
  text: string;
};

function emailFromProfileFields(
  profile: Record<string, unknown> | null | undefined
): string | null {
  if (!profile) return null;
  for (const key of ["email", "contactEmail", "ownerEmail"] as const) {
    const value = profile[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/**
 * Best-effort email to a master after a new review is saved.
 * Never throws — callers should still return success for review creation.
 */
export async function notifyMasterOfNewReview(
  options: NotifyMasterOfNewReviewOptions
): Promise<void> {
  const { masterUid, masterName, profilePathId, rating, text } = options;

  if (!masterUid?.trim()) {
    return;
  }

  try {
    const prefs = await getEffectiveNotificationPrefsForUser(masterUid.trim());
    let masterEmail = prefs.emailForNotifications?.trim() || null;

    if (!masterEmail) {
      const { getAdminDb } = await import("@/lib/firebaseAdmins");
      const db = getAdminDb();
      for (const collectionName of ["profiles", "masters"] as const) {
        const snap = await db.collection(collectionName).doc(masterUid).get();
        if (snap.exists) {
          masterEmail = emailFromProfileFields(
            snap.data() as Record<string, unknown>
          );
          if (masterEmail) break;
        }
      }
    }

    if (!masterEmail) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[notifyMasterOfNewReview] skip: no notification email for master",
          { masterUid }
        );
      }
      return;
    }

    const pathId = (profilePathId || masterUid).trim();
    const masterProfileUrl = buildMasterProfileUrl(pathId);

    await sendReviewNotificationEmail({
      masterEmail,
      masterName: masterName || "there",
      rating,
      text,
      masterProfileUrl,
    });
  } catch (error) {
    console.error("[notifyMasterOfNewReview] error:", error);
  }
}
