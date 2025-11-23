export type EmailLayoutOptions = {
  title: string; // main title in the email body
  preheader?: string;
  contentHtml: string; // inner HTML of the main card
  ctaLabel?: string;
  ctaUrl?: string;
  logoUrlOverride?: string; // optional explicit logo URL if needed later
};

const BRAND_PINK = "#ff4fa3"; // main brand button color
const BACKGROUND_PINK = "#ffe6f2"; // soft background

export function renderBeautyReviewtyEmailLayout(
  options: EmailLayoutOptions
): string {
  const { title, preheader, contentHtml, ctaLabel, ctaUrl } = options;

  // We use simple HTML + inline CSS for maximum compatibility.
  // Mobile-friendly single-column layout.
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    ${preheader ? `<meta name="description" content="${escapeHtml(preheader)}" />` : ""}
  </head>
  <body style="margin:0;padding:0;background:${BACKGROUND_PINK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="padding:24px 12px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:520px;margin:0 auto;">
        <tr>
          <td style="text-align:center;padding-bottom:16px;">
            <div style="
              width:48px;
              height:48px;
              border-radius:50%;
              background:#ff4fa3;
              color:#ffffff;
              font-size:18px;
              font-weight:700;
              display:flex;
              align-items:center;
              justify-content:center;
              margin:0 auto 8px auto;
            ">
              BR
            </div>
            <div style="font-size:16px;font-weight:600;color:#ff4fa3;letter-spacing:0.03em;">
              BeautyReviewty
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border-radius:16px;padding:24px;box-sizing:border-box;">
              <tr>
                <td style="font-size:20px;font-weight:600;color:#111827;padding-bottom:12px;">
                  ${escapeHtml(title)}
                </td>
              </tr>
              <tr>
                <td style="font-size:14px;line-height:1.6;color:#4b5563;">
                  ${contentHtml}
                </td>
              </tr>
              ${
                ctaLabel && ctaUrl
                  ? `
              <tr>
                <td style="padding-top:20px;padding-bottom:4px;">
                  <a href="${ctaUrl}" style="display:inline-block;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;background:${BRAND_PINK};color:#ffffff;">
                    ${escapeHtml(ctaLabel)}
                  </a>
                </td>
              </tr>
              `
                  : ""
              }
            </table>
          </td>
        </tr>
        <tr>
          <td style="text-align:center;padding-top:16px;font-size:11px;color:#6b7280;">
            © ${new Date().getFullYear()} BeautyReviewty. All rights reserved.
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
}

// Very small helper to avoid raw HTML injection in text parts.
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

