const { sendEmail } = require('./email');

const STATUS_TEMPLATES = {
  pending: {
    emoji: '⏰',
    color: '#ca8a04',
    subject: (o) => `Order ${o.orderNumber} received — Toy Mall`,
    headline: 'Order Received!',
    message: 'Thanks for your order! We\'ve received it and will confirm shortly.',
  },
  confirmed: {
    emoji: '✅',
    color: '#2563eb',
    subject: (o) => `Order ${o.orderNumber} confirmed — Toy Mall`,
    headline: 'Order Confirmed',
    message: 'Great news — your order has been confirmed and is now being prepared. We\'ll let you know once it\'s packed.',
  },
  packed: {
    emoji: '📦',
    color: '#7c3aed',
    subject: (o) => `Order ${o.orderNumber} is packed — Toy Mall`,
    headline: 'Your Order is Packed',
    message: 'Your items have been carefully packed and are ready for shipping. Expect a shipping update within 24 hours.',
  },
  shipped: {
    emoji: '🚚',
    color: '#0891b2',
    subject: (o) => `Order ${o.orderNumber} shipped — Toy Mall`,
    headline: 'Your Order is On The Way',
    message: 'Your order is in transit and on its way to you. Track its journey using the link below.',
  },
  out_for_delivery: {
    emoji: '🏃',
    color: '#ea580c',
    subject: (o) => `Out for delivery: Order ${o.orderNumber} arriving today!`,
    headline: 'Out for Delivery Today!',
    message: 'Exciting! Your order is out for delivery and should arrive today. Please ensure someone is available to receive it.',
  },
  delivered: {
    emoji: '🎉',
    color: '#16a34a',
    subject: (o) => `Order ${o.orderNumber} delivered — Enjoy!`,
    headline: 'Delivered Successfully!',
    message: 'Your order has been delivered. We hope you love your new toys! Don\'t forget to leave a review.',
  },
  cancelled: {
    emoji: '❌',
    color: '#dc2626',
    subject: (o) => `Order ${o.orderNumber} cancelled — Toy Mall`,
    headline: 'Order Cancelled',
    message: 'Your order has been cancelled. If you paid online, the refund will be processed within 5-7 business days.',
  },
};

// Email clients can't follow relative paths, so /uploads/foo.jpg must be made absolute.
// Falls back to a reliable hosted placeholder if there's no image — note this
// MUST be a remote URL (Gmail and others strip data: URIs from <img>).
const PLACEHOLDER_IMG = 'https://placehold.co/64x64/f3f4f6/9ca3af?text=Toy';
function absoluteImage(image, apiBase) {
  if (!image) return PLACEHOLDER_IMG;
  if (/^https?:\/\//i.test(image)) return image;
  if (!apiBase) return PLACEHOLDER_IMG;
  return apiBase.replace(/\/$/, '') + (image.startsWith('/') ? image : '/' + image);
}

function buildHtml(order, template, customerName, adminNote, clientUrl) {
  const orderUrl = `${clientUrl}/order/${order._id}`;
  const apiBase = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  // Tracking + carrier — shown on every status email once they're set.
  const hasTracking = !!order.trackingNumber;
  const hasCarrier  = !!order.carrier;
  const trackingBlock = (hasTracking || hasCarrier)
    ? `
      <div style="background:#f3f4f6;border-radius:8px;padding:14px;margin:16px 0;">
        <p style="margin:0;font-size:11px;color:#6b7280;font-weight:600;letter-spacing:0.5px;">📦 SHIPMENT DETAILS</p>
        ${hasCarrier ? `
          <p style="margin:8px 0 0 0;font-size:13px;color:#374151;">
            <span style="color:#6b7280;">Delivery via</span>
            <strong style="color:#111827;">${order.carrier}</strong>
          </p>
        ` : ''}
        ${hasTracking ? `
          <p style="margin:6px 0 0 0;font-size:13px;color:#6b7280;">Tracking #</p>
          <p style="margin:2px 0 0 0;font-family:monospace;font-size:18px;font-weight:bold;color:#111827;letter-spacing:1px;">${order.trackingNumber}</p>
        ` : ''}
      </div>
    ` : '';

  const noteBlock = adminNote ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;padding:12px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#92400e;font-weight:600;">📝 NOTE FROM TOY MALL</p>
      <p style="margin:4px 0 0 0;color:#78350f;font-size:14px;">${adminNote}</p>
    </div>
  ` : '';

  const itemsList = order.items.slice(0, 4).map((it) => {
    const img = absoluteImage(it.image, apiBase);
    const lineTotal = (Number(it.price) || 0) * (Number(it.qty) || 0);
    return `
    <tr>
      <td style="padding:8px 0;width:64px;vertical-align:middle;">
        <img src="${img}" width="56" height="56" alt="${it.name || 'Product'}" style="display:block;width:56px;height:56px;border-radius:6px;border:1px solid #e5e7eb;background:#f9fafb;object-fit:contain;" />
      </td>
      <td style="padding:8px 12px;vertical-align:middle;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#111827;line-height:1.4;">${it.name || 'Product'}</p>
        <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;">Qty ${it.qty} × ₹${(Number(it.price) || 0).toFixed(2)}</p>
      </td>
      <td style="padding:8px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;vertical-align:middle;white-space:nowrap;">₹${lineTotal.toFixed(2)}</td>
    </tr>
  `;
  }).join('');
  const moreItems = order.items.length > 4 ? `<p style="text-align:center;color:#6b7280;font-size:12px;margin:8px 0 0 0;">+${order.items.length - 4} more item(s) — see full order online</p>` : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:#111827;padding:20px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">
        <span style="color:#e53935;">Toy</span>Mall
      </h1>
    </div>

    <!-- Status banner -->
    <div style="background:${template.color};padding:32px 20px;text-align:center;color:#ffffff;">
      <div style="font-size:48px;margin-bottom:8px;">${template.emoji}</div>
      <h2 style="margin:0;font-size:24px;font-weight:bold;">${template.headline}</h2>
      <p style="margin:8px 0 0 0;opacity:0.95;font-size:14px;">Order ${order.orderNumber}</p>
    </div>

    <!-- Body -->
    <div style="padding:24px 20px;">
      <p style="margin:0 0 16px 0;font-size:15px;color:#111827;">Hi <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#374151;line-height:1.6;">${template.message}</p>

      ${trackingBlock}
      ${noteBlock}

      <!-- Items summary -->
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280;font-weight:600;">YOUR ITEMS</p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsList}
        </table>
        ${moreItems}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;">
        <p style="margin:0;text-align:right;font-weight:bold;font-size:16px;color:#e53935;">Total: ₹${order.totalPrice.toFixed(2)}</p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${orderUrl}" style="display:inline-block;background:#e53935;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">View Order Details →</a>
      </div>

      <p style="color:#6b7280;font-size:13px;line-height:1.6;text-align:center;margin:16px 0 0 0;">
        Questions? Reply to this email or call <a href="tel:+918655787075" style="color:#e53935;">+91 86557 87075</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#6b7280;">Toy Mall</p>
      <p style="margin:4px 0 0 0;font-size:11px;color:#9ca3af;">Toy Mall · Mobin Apartment A Wing, Shop No. 4, Amrut Nagar, Near Dargah Road, Mumbra, Thane — 400612</p>
      <p style="margin:2px 0 0 0;font-size:11px;color:#9ca3af;">📞 +91 86557 87075 · ✉ Huraira735@gmail.com</p>
      <p style="margin:8px 0 0 0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Toy Mall. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function buildText(order, template, customerName, adminNote) {
  let text = `Hi ${customerName},\n\n${template.headline}\n\n${template.message}\n\nOrder Number: ${order.orderNumber}\n`;
  if (order.carrier) {
    text += `Delivery via: ${order.carrier}\n`;
  }
  if (order.trackingNumber) {
    text += `Tracking Number: ${order.trackingNumber}\n`;
  }
  if (adminNote) text += `\nNote: ${adminNote}\n`;
  text += `\nTotal: ₹${order.totalPrice.toFixed(2)}\n\nView your order: ${process.env.CLIENT_URL || 'http://localhost:5173'}/order/${order._id}\n\n— Team Toy Mall\nMobin Apartment A Wing, Shop No. 4, Amrut Nagar, Near Dargah Road, Mumbra, Thane — 400612\nHuraira735@gmail.com`;
  return text;
}

async function sendStatusEmail(order, customerEmail, customerName, adminNote = '') {
  const template = STATUS_TEMPLATES[order.status];
  if (!template) return { sent: false, reason: 'No template for status' };
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return sendEmail({
    to: customerEmail,
    subject: template.subject(order),
    html: buildHtml(order, template, customerName || 'Customer', adminNote, clientUrl),
    text: buildText(order, template, customerName || 'Customer', adminNote),
  });
}

module.exports = { sendStatusEmail, STATUS_TEMPLATES };
