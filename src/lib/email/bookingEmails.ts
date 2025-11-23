import { sendAppEmail } from "./resendClient";
import { renderBeautyReviewtyEmailLayout } from "./templates";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DEFAULT_SENDER = "onboarding@resend.dev";

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "http://localhost:3000";

export type NewBookingEmailToMasterOptions = {
  masterEmail: string;
  masterName?: string | null;
  clientName?: string | null;
  serviceName?: string | null;
  bookingDateTimeText?: string | null;
  bookingId: string;
  bookingStatus: string;
  dashboardBookingUrl?: string | null;
};

/**
 * Sends email notification to master when a new booking request is created.
 * Logs errors without throwing to avoid breaking booking creation flow.
 */
export async function sendNewBookingEmailToMaster(
  options: NewBookingEmailToMasterOptions
): Promise<void> {
  const {
    masterEmail,
    masterName,
    clientName,
    serviceName,
    bookingDateTimeText,
    bookingId,
    bookingStatus,
    dashboardBookingUrl,
  } = options;

  if (!masterEmail || !masterEmail.trim()) {
    console.warn(
      "[bookingEmails] sendNewBookingEmailToMaster: missing masterEmail"
    );
    return;
  }

  try {
    const greeting = masterName ? `Hi ${escapeHtml(masterName)},` : "Hi there,";
    const clientDisplay = clientName || "A client";
    const serviceDisplay = serviceName || "a service";
    const dateTimeDisplay = bookingDateTimeText || "date/time";
    const statusDisplay = bookingStatus || "pending";

    const finalDashboardBookingUrl =
      dashboardBookingUrl ||
      `${APP_BASE_URL}/dashboard/booking?bookingId=${bookingId}`;

    const contentHtml = `
      <p style="margin:0 0 12px 0;">${greeting}</p>
      <p style="margin:0 0 12px 0;">
        You have a new booking request on BeautyReviewty.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:8px;margin-bottom:8px;font-size:13px;color:#374151;">
        <tr><td style="padding:4px 0;"><strong>Client:</strong> ${escapeHtml(clientDisplay)}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Service:</strong> ${escapeHtml(serviceDisplay)}</td></tr>
        ${dateTimeDisplay ? `<tr><td style="padding:4px 0;"><strong>Date &amp; Time:</strong> ${escapeHtml(dateTimeDisplay)}</td></tr>` : ""}
        <tr><td style="padding:4px 0;"><strong>Status:</strong> ${escapeHtml(statusDisplay)}</td></tr>
      </table>
      <p style="margin:12px 0 0 0;">You can review and manage this booking in your dashboard.</p>
      <p style="margin:8px 0 0 0;color:#6b7280;font-size:12px;">Booking ID: ${escapeHtml(bookingId)}</p>
    `;

    const html = renderBeautyReviewtyEmailLayout({
      title: "New Booking Request",
      preheader: "You have a new booking on BeautyReviewty.",
      contentHtml,
      ctaLabel: "View Booking in Dashboard",
      ctaUrl: finalDashboardBookingUrl,
    });

    const text = `New booking request on BeautyReviewty\n\nClient: ${clientDisplay}\nService: ${serviceDisplay}\nDate & Time: ${dateTimeDisplay}\nStatus: ${statusDisplay}\n\nView booking: ${finalDashboardBookingUrl}`;

    await sendAppEmail({
      to: masterEmail,
      subject: "BeautyReviewty: You have a new booking request",
      html,
      text,
    });
  } catch (error) {
    console.error(
      "[bookingEmails] sendNewBookingEmailToMaster error:",
      error
    );
  }
}

export type BookingStatusEmailToClientOptions = {
  clientEmail: string;
  clientName?: string | null;
  masterName?: string | null;
  serviceName?: string | null;
  bookingDateTimeText?: string | null;
  bookingId: string;
  status: "confirmed" | "declined" | "cancelled";
  dashboardBookingUrl?: string | null;
};

/**
 * Sends email notification to client when booking status changes to confirmed, declined, or cancelled.
 * Logs errors without throwing to avoid breaking booking update flow.
 */
export async function sendBookingStatusEmailToClient(
  options: BookingStatusEmailToClientOptions
): Promise<void> {
  const {
    clientEmail,
    clientName,
    masterName,
    serviceName,
    bookingDateTimeText,
    bookingId,
    status,
    dashboardBookingUrl,
  } = options;

  if (!clientEmail || !clientEmail.trim()) {
    console.warn(
      "[bookingEmails] sendBookingStatusEmailToClient: missing clientEmail"
    );
    return;
  }

  if (!["confirmed", "declined", "cancelled"].includes(status)) {
    console.warn(
      `[bookingEmails] sendBookingStatusEmailToClient: unsupported status "${status}"`
    );
    return;
  }

  try {
    const greeting = clientName ? `Hi ${escapeHtml(clientName)},` : "Hello,";
    const masterDisplay = masterName || "the master";
    const serviceDisplay = serviceName || "your service";
    const dateTimeDisplay = bookingDateTimeText || "scheduled date/time";

    let subject: string;
    let statusMessage: string;
    let title: string;

    if (status === "confirmed") {
      subject = "BeautyReviewty: Your booking is confirmed";
      title = "Your booking is confirmed";
      statusMessage = "Your booking has been <strong>confirmed</strong>.";
    } else if (status === "declined") {
      subject = "BeautyReviewty: Your booking was declined";
      title = "Your booking was declined";
      statusMessage = "Your booking has been <strong>declined</strong>.";
    } else {
      subject = "BeautyReviewty: Your booking was cancelled";
      title = "Your booking was cancelled";
      statusMessage = "Your booking has been <strong>cancelled</strong>.";
    }

    const finalDashboardBookingUrl =
      dashboardBookingUrl ||
      `${APP_BASE_URL}/dashboard/booking?bookingId=${bookingId}`;

    const contentHtml = `
      <p style="margin:0 0 12px 0;">${greeting}</p>
      <p style="margin:0 0 12px 0;">${statusMessage}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:8px;margin-bottom:8px;font-size:13px;color:#374151;">
        <tr><td style="padding:4px 0;"><strong>Master:</strong> ${escapeHtml(masterDisplay)}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Service:</strong> ${escapeHtml(serviceDisplay)}</td></tr>
        ${dateTimeDisplay ? `<tr><td style="padding:4px 0;"><strong>Date &amp; Time:</strong> ${escapeHtml(dateTimeDisplay)}</td></tr>` : ""}
      </table>
      <p style="margin:12px 0 0 0;">View your booking details in the dashboard.</p>
      <p style="margin:8px 0 0 0;color:#6b7280;font-size:12px;">Booking ID: ${escapeHtml(bookingId)}</p>
    `;

    const html = renderBeautyReviewtyEmailLayout({
      title,
      preheader: "Your booking status has changed.",
      contentHtml,
      ctaLabel: "View Booking",
      ctaUrl: finalDashboardBookingUrl,
    });

    const text = `${subject}\n\n${greeting}\n\n${statusMessage}\n\nMaster: ${masterDisplay}\nService: ${serviceDisplay}\nDate & Time: ${dateTimeDisplay}\n\nView booking details: ${finalDashboardBookingUrl}`;

    await sendAppEmail({
      to: clientEmail,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error(
      "[bookingEmails] sendBookingStatusEmailToClient error:",
      error
    );
  }
}

export type ChatMessageEmailOptions = {
  recipientEmail: string;
  recipientName?: string | null;
  senderName?: string | null;
  bookingId?: string | null;
  messagePreview?: string | null;
  dashboardChatUrl?: string | null;
};

/**
 * Sends email notification to recipient when they receive a new chat message.
 * Logs errors without throwing to avoid breaking chat message sending flow.
 */
export async function sendChatMessageEmailNotification(
  options: ChatMessageEmailOptions
): Promise<void> {
  console.log("[chat-email] helper called", {
    recipientEmail: options.recipientEmail,
    bookingId: options.bookingId,
  });

  const {
    recipientEmail,
    recipientName,
    senderName,
    bookingId,
    messagePreview,
    dashboardChatUrl,
  } = options;

  if (!recipientEmail || !recipientEmail.trim()) {
    console.warn(
      "[bookingEmails] sendChatMessageEmailNotification: missing recipientEmail"
    );
    return;
  }

  // Truncate message preview to ~120 chars
  const truncatedPreview =
    messagePreview && messagePreview.length > 120
      ? messagePreview.slice(0, 120) + "..."
      : messagePreview || "";

  try {
    const greeting = recipientName ? `Hi ${escapeHtml(recipientName)},` : "Hi there,";
    const senderDisplay = senderName || "Someone";

    // Build chat URL if not provided
    let finalDashboardChatUrl = dashboardChatUrl;
    if (!finalDashboardChatUrl && bookingId) {
      finalDashboardChatUrl = `${APP_BASE_URL}/dashboard/chat/${bookingId}`;
    } else if (!finalDashboardChatUrl) {
      // Fallback to chat list if no bookingId
      finalDashboardChatUrl = `${APP_BASE_URL}/dashboard/chat`;
    }

    const BRAND_PINK = "#ff4fa3";
    const contentHtml = `
      <p style="margin:0 0 12px 0;">${greeting}</p>
      <p style="margin:0 0 12px 0;">
        You have a new message on BeautyReviewty${senderName ? ` from <strong>${escapeHtml(senderName)}</strong>` : ""}.
      </p>
      ${
        truncatedPreview
          ? `
      <div style="margin:12px 0;padding:10px 12px;border-left:4px solid ${BRAND_PINK};background:#f9fafb;border-radius:8px;font-size:13px;color:#374151;">
        "${escapeHtml(truncatedPreview)}"
      </div>
      `
          : ""
      }
      <p style="margin:12px 0 0 0;">Open the chat to reply and manage your booking.</p>
    `;

    const html = renderBeautyReviewtyEmailLayout({
      title: "New Message",
      preheader: "You have a new message on BeautyReviewty.",
      contentHtml,
      ctaLabel: finalDashboardChatUrl ? "Open Chat" : undefined,
      ctaUrl: finalDashboardChatUrl || undefined,
    });

    const text = `BeautyReviewty: You have a new message\n\n${greeting}\n\nYou have a new message on BeautyReviewty.\nFrom: ${senderDisplay}${
      truncatedPreview ? `\n\n"${truncatedPreview}"` : ""
    }\n\n${
      finalDashboardChatUrl
        ? `Open chat: ${finalDashboardChatUrl}`
        : "Log in to BeautyReviewty to view your messages."
    }`;

    await sendAppEmail({
      to: recipientEmail,
      subject: "BeautyReviewty: You have a new message",
      html,
      text,
    });
  } catch (error) {
    console.error("Error sending chat email", error);
  }
}

