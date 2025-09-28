import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || '';
// В проде лучше указать свой домен-отправитель, но в dev можно sandbox:
const defaultFrom = process.env.RESEND_FROM || 'BeautyReviewty <onboarding@resend.dev>';

export type BookingEmailPayload = {
  listingTitle: string;
  listingId: string;
  dateISO: string; // дата в ISO (например, "2025-09-24")
  time: string; // "HH:mm"
  durationMin: number;
  note?: string;
  clientName?: string | null;
  masterName?: string | null;
  dashboardUrl?: string; // ссылка мастеру на его кабинет
  clientBookingsUrl?: string; // ссылка клиенту на его заявки
};

const resend = apiKey ? new Resend(apiKey) : null;

async function safeSend(params: { to?: string | null; subject: string; html: string; from?: string }) {
  const to = params.to;
  if (!resend || !to) return; // нет API ключа или email — тихо пропускаем
  try {
    await resend.emails.send({
      from: params.from || defaultFrom,
      to,
      subject: params.subject,
      html: params.html,
    });
  } catch (e) {
    // Не роняем API; просто лог
    console.error('[email] send failed', e);
  }
}

export async function sendBookingCreatedEmails(opts: {
  masterEmail?: string | null;
  clientEmail?: string | null;
  payload: BookingEmailPayload;
}) {
  const { masterEmail, clientEmail, payload } = opts;

  const when = `${payload.dateISO} ${payload.time}`;
  const duration = `${payload.durationMin} min`;
  const noteHtml = payload.note ? `<p><b>Note:</b> ${escapeHtml(payload.note)}</p>` : '';
  const title = escapeHtml(payload.listingTitle);
  const masterName = escapeHtml(payload.masterName || 'Master');
  const clientName = escapeHtml(payload.clientName || 'Client');

  const masterHtml = `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
  <h2>New booking request</h2>
  <p>You received a new booking request for <b>${title}</b>.</p>
  <p><b>From:</b> ${clientName}</p>
  <p><b>When:</b> ${when}</p>
  <p><b>Duration:</b> ${duration}</p>
  ${noteHtml}
  <p>
  <a href="${payload.dashboardUrl || '#'}" style="display:inline-block;padding:10px 16px;background:#ec2aa9;color:#fff;text-decoration:none;border-radius:6px">
  Open dashboard
  </a>
  </p>
  <p style="color:#666">Listing ID: ${payload.listingId}</p>
  </div>
  `;

  const clientHtml = `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
  <h2>Request sent </h2>
  <p>Your booking request for <b>${title}</b> has been sent to ${masterName}.</p>
  <p><b>When:</b> ${when}</p>
  <p><b>Duration:</b> ${duration}</p>
  ${noteHtml}
  <p>
  <a href="${payload.clientBookingsUrl || '#'}" style="display:inline-block;padding:10px 16px;background:#ec2aa9;color:#fff;text-decoration:none;border-radius:6px">
  View my requests
  </a>
  </p>
  <p style="color:#666">Listing ID: ${payload.listingId}</p>
  </div>
  `;

  await Promise.all([
    safeSend({
      to: masterEmail,
      subject: `New booking request: ${payload.listingTitle}`,
      html: masterHtml,
    }),
    safeSend({
      to: clientEmail,
      subject: `Your booking request has been sent`,
      html: clientHtml,
    }),
  ]);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
