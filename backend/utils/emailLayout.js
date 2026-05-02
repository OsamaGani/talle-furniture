// Shared email layout used by every transactional email Toy Mall sends —
// OTP verification, password reset, order status, newsletter, contact-form
// forwarding, etc.
//
// Why a shared layout matters:
//   * Consistent brand presence across every inbox the customer touches
//   * Single place to fix the address / phone / footer when business
//     details change (just edit this file, not eight different templates)
//   * All emails inherit the same mobile-friendly width (560px), table-based
//     structure (renders correctly in Outlook + Gmail), and inline CSS
//     (the only thing email clients reliably honour)

const STORE = {
  name: 'Toy Mall',
  url: process.env.CLIENT_URL?.split(',')[0] || 'https://toy-mall.pages.dev',
  phone: '+91 77380 28750',
  phoneTel: '+917738028750',
  email: 'support@toymall.in',
  addressLine: 'Mobin Apartment A Wing, Shop No. 4, Amrut Nagar, Near Dargah Road, Mumbra, Thane — 400612',
};

const escape = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/**
 * Render a complete HTML email document.
 *
 * @param {object} opts
 * @param {string} opts.preheader - Hidden preview snippet shown in inbox lists (50–100 chars)
 * @param {string} opts.heroEmoji - Big icon at the top of the hero band
 * @param {string} opts.heroColor - Hex colour for the hero band background (default brand red)
 * @param {string} opts.heroTitle - Big white headline inside the hero band
 * @param {string} opts.heroSubtitle - Smaller line under the title (optional)
 * @param {string} opts.bodyHtml - The main body content as HTML (already escaped by caller)
 * @param {object} [opts.cta] - Primary call-to-action button { text, url, color? }
 * @param {string} [opts.footerNote] - Small extra line above the standard footer (e.g. unsubscribe)
 * @returns {string} Full HTML document
 */
function renderEmail({
  preheader = '',
  heroEmoji = '',
  heroColor = '#e53935',
  heroTitle,
  heroSubtitle = '',
  bodyHtml,
  cta = null,
  footerNote = '',
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escape(heroTitle || STORE.name)}</title>
  <style>
    /* Mobile tweaks — most clients support a basic media query */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .px-mobile { padding-left: 16px !important; padding-right: 16px !important; }
      .stack-block { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(preheader)}</div>` : ''}

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="container" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

          <!-- Brand header -->
          <tr>
            <td align="center" style="background:#111827;padding:22px 20px;">
              <a href="${STORE.url}" style="text-decoration:none;font-size:26px;font-weight:800;letter-spacing:-0.3px;color:#ffffff;">
                <span style="color:#e53935;">Toy</span>Mall
              </a>
            </td>
          </tr>

          ${heroTitle ? `
          <!-- Hero band -->
          <tr>
            <td align="center" style="background:${heroColor};padding:28px 20px;color:#ffffff;">
              ${heroEmoji ? `<div style="font-size:44px;line-height:1;margin-bottom:6px;">${heroEmoji}</div>` : ''}
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${escape(heroTitle)}</h1>
              ${heroSubtitle ? `<p style="margin:8px 0 0 0;font-size:13px;opacity:0.92;color:#ffffff;">${escape(heroSubtitle)}</p>` : ''}
            </td>
          </tr>
          ` : ''}

          <!-- Body -->
          <tr>
            <td class="px-mobile" style="padding:28px 32px;color:#374151;line-height:1.6;font-size:15px;">
              ${bodyHtml}

              ${cta ? `
              <div style="text-align:center;margin:24px 0 4px 0;">
                <a href="${cta.url}" style="display:inline-block;background:${cta.color || '#e53935'};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:14px 32px;border-radius:8px;">
                  ${escape(cta.text)}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Sub-footer help line -->
          <tr>
            <td class="px-mobile" align="center" style="padding:0 32px 22px 32px;">
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                Questions? Reply to this email or call
                <a href="tel:${STORE.phoneTel}" style="color:#e53935;text-decoration:none;font-weight:600;">${STORE.phone}</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 24px;">
              <p style="margin:0;font-size:12px;color:#374151;font-weight:600;">${STORE.name}</p>
              <p style="margin:6px 0 0 0;font-size:11px;color:#9ca3af;line-height:1.5;">${STORE.addressLine}</p>
              <p style="margin:6px 0 0 0;font-size:11px;color:#9ca3af;">
                <a href="tel:${STORE.phoneTel}" style="color:#9ca3af;text-decoration:none;">📞 ${STORE.phone}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${STORE.email}" style="color:#9ca3af;text-decoration:none;">✉ ${STORE.email}</a>
              </p>
              ${footerNote ? `<p style="margin:10px 0 0 0;font-size:10px;color:#9ca3af;">${footerNote}</p>` : ''}
              <p style="margin:10px 0 0 0;font-size:10px;color:#d1d5db;">© ${new Date().getFullYear()} ${STORE.name}. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { renderEmail, STORE, escape };
