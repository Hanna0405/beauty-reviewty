import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "BeautyReviewty <onboarding@resend.dev>";
const fallback = process.env.EMAIL_FALLBACK;

let resend: Resend | null = null;
if (apiKey) resend = new Resend(apiKey);

type MailParams = {
 to: string | string[];
 subject: string;
 html: string;
};

export async function sendMail(params: MailParams) {
 try {
 if (!resend) {
 console.warn("[mailer] RESEND_API_KEY not set — skipping email");
 return { skipped: true };
 }
 const res = await resend.emails.send({
 from,
 to: params.to,
 subject: params.subject,
 html: params.html,
 });
 return { ok: true, res };
 } catch (e:any) {
 console.error("[mailer] send error:", e?.message || e);
 if (fallback) {
 try {
 await resend!.emails.send({
 from,
 to: fallback,
 subject: "Mailer error",
 html: `<pre>${String(e?.message || e)}</pre>`,
 });
 } catch {}
 }
 return { ok: false, error: e?.message || "mail error" };
 }
}

/* -------- Templates -------- */
export function tplBookingCreated(opts:{
 masterName?: string; clientName?: string;
 listingTitle?: string; listingUrl?: string;
 when?: string; durationMin?: number; note?: string;
 contactName?: string; contactPhone?: string;
}) {
 const {
 masterName = "Master",
 clientName = "Client",
 listingTitle = "Listing",
 listingUrl = "#",
 when = "",
 durationMin = 60,
 note = "",
 contactName = "",
 contactPhone = "",
 } = opts;

 return `
 <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
 <h2>New booking request</h2>
 <p><b>Listing:</b> <a href="${listingUrl}">${listingTitle}</a></p>
 <p><b>Time:</b> ${when} • ${durationMin} min</p>
 ${note ? `<p><b>Note:</b> ${note}</p>` : ""}
 <hr>
 <p><b>Client:</b> ${clientName || "-"} ${contactPhone ? `• ${contactPhone}` : ""}</p>
 ${contactName || contactPhone ? `<p><b>Contact for master:</b> ${contactName || "-"} ${contactPhone ? `• ${contactPhone}` : ""}</p>` : ""}
 <p style="color:#666">Reply in dashboard: confirm or decline.</p>
 </div>`;
}

export function tplBookingStatus(opts:{
 toName?: string; listingTitle?: string; listingUrl?: string;
 status: "confirmed"|"declined";
 when?: string; durationMin?: number;
}) {
 const { toName="Client", listingTitle="Listing", listingUrl="#", status, when="", durationMin=60 } = opts;
 const badge = status === "confirmed" ? " Confirmed" : " Declined";
 return `
 <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
 <h2>Booking ${badge}</h2>
 <p>Hello, ${toName}!</p>
 <p>Your booking for <a href="${listingUrl}">${listingTitle}</a> is <b>${status}</b>.</p>
 <p><b>Time:</b> ${when} • ${durationMin} min</p>
 <p><a href="${listingUrl}">Open listing</a></p>
 </div>`;
}

export function tplNewMessage(opts:{ toName?: string; listingTitle?: string; listingUrl?: string; text?: string; chatUrl?: string; }) {
 const { toName="User", listingTitle="Listing", listingUrl="#", text="", chatUrl="#" } = opts;
 return `
 <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
 <h2>New message in chat</h2>
 <p>Hello, ${toName}!</p>
 <p>You have a new message regarding <a href="${listingUrl}">${listingTitle}</a>:</p>
 <blockquote style="border-left:4px solid #eee;padding-left:12px;color:#555">${text}</blockquote>
 <p><a href="${chatUrl}">Open chat</a></p>
 </div>`;
}
