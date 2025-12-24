import { Resend } from "resend";

// Use only production RESEND_API_KEY (no dev fallback)
const apiKey = process.env.RESEND_API_KEY || "";

// Default verified sender on our domain
const DEFAULT_FROM = "BeautyReviewty <notifications@beautyreviewty.app>";

// Support RESEND_FROM env var override, fallback to default
const emailFrom = process.env.RESEND_FROM || DEFAULT_FROM;

// Debug logging (server-side only)
if (typeof window === "undefined") {
  const senderDomain = emailFrom.match(/@([^>]+)/)?.[1] || emailFrom;
  console.log(
    `[Resend] Initialized - sender: ${senderDomain}, API key: ${
      apiKey ? "present" : "missing"
    }`
  );
}

export const resend = apiKey ? new Resend(apiKey) : null;

export type SendAppEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendAppEmail(params: SendAppEmailParams) {
  // Validate API key (server-side only)
  if (typeof window === "undefined" && !apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn("[Resend] sendAppEmail called but client is not configured");
    return;
  }

  const { to, subject, html, text } = params;

  try {
    // eslint-disable-next-line no-console
    console.log("[Resend] sending email to", to, "with subject", subject);

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
      text: text ?? "",
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[Resend] sendAppEmail error", error);
    } else {
      // eslint-disable-next-line no-console
      console.log("[Resend] sendAppEmail success", data);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[Resend] sendAppEmail exception", err);
  }
}
