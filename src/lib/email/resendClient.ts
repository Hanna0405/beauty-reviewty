import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY_DEV || "";

if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn("[Resend] Missing RESEND_API_KEY / RESEND_API_KEY_DEV env");
}

export const resend = apiKey ? new Resend(apiKey) : null;

export type SendAppEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendAppEmail(params: SendAppEmailParams) {
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
      from: "BeautyReviewty <onboarding@resend.dev>",
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

