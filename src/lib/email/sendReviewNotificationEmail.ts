import { sendAppEmail } from "./resendClient";
import { getEmailBaseUrl } from "./baseUrl";

export type SendReviewNotificationEmailOptions = {
  masterEmail: string;
  masterName: string;
  rating: number;
  text: string;
  masterProfileUrl: string;
};

function isEmailProviderConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/**
 * Sends a plain notification email when a master receives a new review.
 * Skips silently when Resend is not configured (dev log only).
 */
export async function sendReviewNotificationEmail(
  options: SendReviewNotificationEmailOptions
): Promise<void> {
  const { masterEmail, masterName, rating, text, masterProfileUrl } = options;

  if (!masterEmail?.trim()) {
    return;
  }

  if (!isEmailProviderConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Review notification email skipped: email provider not configured"
      );
    }
    return;
  }

  const name = masterName?.trim() || "there";
  const reviewText = text?.trim() || "(No written review)";
  const ratingDisplay = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));

  const subject = "New review on BeautyReviewty";
  const plainBody = `Hi ${name},

You received a new review on BeautyReviewty.

Rating: ${ratingDisplay}/5

Review:
${reviewText}

View your profile:
${masterProfileUrl}

— BeautyReviewty`;

  const html = plainBody
    .split("\n")
    .map((line) => `<p style="margin:0 0 8px 0;">${line || "&nbsp;"}</p>`)
    .join("");

  try {
    await sendAppEmail({
      to: masterEmail.trim(),
      subject,
      html,
      text: plainBody,
    });
  } catch (error) {
    console.error("[sendReviewNotificationEmail] error:", error);
  }
}

export function buildMasterProfileUrl(profilePathId: string): string {
  const id = encodeURIComponent(profilePathId.trim());
  return `${getEmailBaseUrl()}/master/${id}`;
}
