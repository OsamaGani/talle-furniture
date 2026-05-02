const { sendEmail } = require('./email');
const { renderEmail, escape } = require('./emailLayout');

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
    // Subject and body are computed dynamically below so the email reflects
    // who actually cancelled and what happens to the customer's money.
    subject: (o) => o.cancelledBy === 'customer'
      ? `Order ${o.orderNumber} cancelled — refund details inside`
      : `Order ${o.orderNumber} cancelled — Toy Mall`,
    headline: 'Order Cancelled',
    message: '', // populated per-order in cancelledMessage()
  },
};

// Builds the cancellation email body — splits into:
//   1. intro paragraph (changes based on who cancelled)
//   2. a visually prominent refund callout box (when applicable)
//   3. "what happens next" timeline (when applicable)
//   4. recorded reason line
function cancelledMessage(order) {
  const who = order.cancelledBy;
  const reason = (order.cancelledReason || '').trim();
  const r = order.refund || {};
  const total = order.totalPrice.toFixed(2);

  let intro;
  if (who === 'customer') {
    intro = 'You\'ve cancelled this order successfully. We\'re sorry to see it go — if there\'s anything we can do better next time, just reply to this email and let us know.';
  } else if (who === 'admin') {
    intro = 'Your order has been cancelled. We\'re sorry for the inconvenience and appreciate your patience.';
  } else {
    intro = 'Your order has been cancelled.';
  }

  // ----- Refund callout box -----
  // Visually-prominent green/amber/blue panel that spells out exactly what
  // the customer should expect to see in their account, when, and where to
  // look for it. This is what the merchant asked us to make crystal clear.
  let refundCallout = '';
  let timeline = '';

  if (r.status === 'initiated' || r.status === 'completed') {
    const isDone = r.status === 'completed';
    const amount = r.amount > 0 ? (r.amount / 100).toFixed(2) : total;
    const accentColor = isDone ? '#059669' : '#10b981';      // emerald
    const bgColor = isDone ? '#ecfdf5' : '#f0fdf4';
    const borderColor = isDone ? '#a7f3d0' : '#86efac';

    refundCallout = `
      <div style="background:${bgColor};border:2px solid ${borderColor};border-radius:12px;padding:18px 20px;margin:20px 0;">
        <p style="margin:0;font-size:11px;color:${accentColor};font-weight:700;letter-spacing:1px;">
          ${isDone ? '✓ REFUND COMPLETED' : '💰 REFUND INITIATED'}
        </p>
        <p style="margin:8px 0 0 0;font-size:30px;font-weight:800;color:#065f46;line-height:1;">
          ₹${amount}
        </p>
        <p style="margin:6px 0 0 0;font-size:13px;color:#047857;font-weight:600;">
          ${isDone
            ? 'Successfully credited to your account'
            : 'Returning to your original payment method'}
        </p>
        ${!isDone ? `
          <hr style="border:none;border-top:1px dashed ${borderColor};margin:14px 0;">
          <p style="margin:0;font-size:12px;color:${accentColor};font-weight:600;letter-spacing:0.5px;">⏱ EXPECTED IN YOUR ACCOUNT</p>
          <p style="margin:4px 0 0 0;font-size:18px;font-weight:700;color:#065f46;">5 to 7 business days</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:#047857;">Most banks credit within 5 working days, occasionally up to 7.</p>
        ` : ''}
        ${r.id ? `
          <hr style="border:none;border-top:1px dashed ${borderColor};margin:14px 0;">
          <p style="margin:0;font-size:11px;color:${accentColor};font-weight:600;letter-spacing:0.5px;">REFUND REFERENCE</p>
          <p style="margin:3px 0 0 0;font-family:'Courier New',monospace;font-size:13px;color:#065f46;font-weight:700;">${r.id}</p>
          <p style="margin:3px 0 0 0;font-size:11px;color:#047857;">Quote this if you need to ask your bank or our support about the refund.</p>
        ` : ''}
      </div>
    `;

    if (!isDone) {
      timeline = `
        <div style="background:#f9fafb;border-radius:10px;padding:16px 18px;margin:16px 0;">
          <p style="margin:0;font-size:11px;color:#6b7280;font-weight:600;letter-spacing:0.5px;">📋 WHAT HAPPENS NEXT</p>
          <table role="presentation" style="width:100%;margin-top:10px;font-size:13px;">
            <tr>
              <td style="padding:6px 0;width:36px;vertical-align:top;font-size:18px;line-height:1;">✅</td>
              <td style="padding:6px 0;color:#374151;line-height:1.5;"><strong>Today:</strong> Refund request sent to your bank/UPI.</td>
            </tr>
            <tr>
              <td style="padding:6px 0;width:36px;vertical-align:top;font-size:18px;line-height:1;">⏳</td>
              <td style="padding:6px 0;color:#374151;line-height:1.5;"><strong>1–2 days:</strong> Razorpay processes the refund.</td>
            </tr>
            <tr>
              <td style="padding:6px 0;width:36px;vertical-align:top;font-size:18px;line-height:1;">🏦</td>
              <td style="padding:6px 0;color:#374151;line-height:1.5;"><strong>5–7 days:</strong> Money credited to your account. You'll get an SMS from your bank.</td>
            </tr>
          </table>
          <p style="margin:14px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">
            <strong>Don't see it after 7 days?</strong> Reply to this email or call us at +91 77380 28750 with the refund reference above — we'll trace it for you.
          </p>
        </div>
      `;
    }
  } else if (r.status === 'pending_manual') {
    refundCallout = `
      <div style="background:#fffbeb;border:2px solid #fde68a;border-radius:12px;padding:18px 20px;margin:20px 0;">
        <p style="margin:0;font-size:11px;color:#b45309;font-weight:700;letter-spacing:1px;">⏱ REFUND BEING PROCESSED MANUALLY</p>
        <p style="margin:8px 0 0 0;font-size:30px;font-weight:800;color:#78350f;line-height:1;">₹${total}</p>
        <p style="margin:8px 0 0 0;font-size:13px;color:#92400e;line-height:1.5;">
          Our team will reach out within <strong>1–2 business days</strong> to confirm your refund details. Once initiated, the amount will reach your account in 5–7 business days from then.
        </p>
        <p style="margin:8px 0 0 0;font-size:12px;color:#92400e;">Apologies for the small delay — we're on it.</p>
      </div>
    `;
  } else if (r.status === 'not_applicable' && order.paymentMethod === 'COD') {
    refundCallout = `
      <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:18px 20px;margin:20px 0;">
        <p style="margin:0;font-size:11px;color:#1d4ed8;font-weight:700;letter-spacing:1px;">💵 NO REFUND NEEDED</p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#1e3a8a;font-weight:600;line-height:1.5;">
          This was a Cash on Delivery order — you weren't charged, so there's nothing to refund.
        </p>
      </div>
    `;
  }

  const reasonLine = reason ? `<p style="margin:14px 0 0 0;font-size:13px;color:#6b7280;">Reason on record: <em>${reason}</em>.</p>` : '';

  return `<p style="margin:0 0 12px 0;">${intro}</p>${refundCallout}${timeline}${reasonLine}`;
}

// Plaintext mirror of cancelledMessage() — same content, formatted for
// clients that don't (or won't) render HTML.
function cancelledTextBody(order) {
  const who = order.cancelledBy;
  const reason = (order.cancelledReason || '').trim();
  const r = order.refund || {};
  const total = order.totalPrice.toFixed(2);

  let intro;
  if (who === 'customer') {
    intro = "You've cancelled this order successfully. We're sorry to see it go — if there's anything we can do better next time, just reply to this email and let us know.";
  } else if (who === 'admin') {
    intro = "Your order has been cancelled. We're sorry for the inconvenience and appreciate your patience.";
  } else {
    intro = 'Your order has been cancelled.';
  }

  let block = '';
  if (r.status === 'initiated' || r.status === 'completed') {
    const isDone = r.status === 'completed';
    const amount = r.amount > 0 ? (r.amount / 100).toFixed(2) : total;
    block = isDone
      ? `\n\n✓ REFUND COMPLETED\nAmount: ₹${amount}\nSuccessfully credited to your account.${r.id ? `\nReference: ${r.id}` : ''}`
      : `\n\n💰 REFUND INITIATED\nAmount: ₹${amount}\nExpected in your account: 5 to 7 business days\n` +
        `${r.id ? `Refund reference: ${r.id}\n` : ''}` +
        `\nWhat happens next:\n` +
        `  ✅ Today: Refund request sent to your bank/UPI.\n` +
        `  ⏳ 1–2 days: Razorpay processes the refund.\n` +
        `  🏦 5–7 days: Money credited to your account (your bank will SMS you).\n` +
        `\nDon't see it after 7 days? Reply to this email or call +91 77380 28750 — we'll trace it for you.`;
  } else if (r.status === 'pending_manual') {
    block = `\n\n⏱ REFUND BEING PROCESSED MANUALLY\nAmount: ₹${total}\n` +
            `Our team will reach out within 1–2 business days. Once initiated, the amount will reach your account in 5–7 business days from then. Apologies for the small delay.`;
  } else if (r.status === 'not_applicable' && order.paymentMethod === 'COD') {
    block = `\n\n💵 NO REFUND NEEDED\nThis was a Cash on Delivery order — you weren't charged, so there's nothing to refund.`;
  }

  const reasonLine = reason ? `\n\nReason on record: ${reason}` : '';
  return `${intro}${block}${reasonLine}`;
}

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
  const hasTracking = !!order.trackingNumber;
  const hasCarrier  = !!order.carrier;

  const trackingBlock = (hasTracking || hasCarrier)
    ? `
      <div style="background:#f3f4f6;border-radius:8px;padding:14px 16px;margin:18px 0;">
        <p style="margin:0;font-size:11px;color:#6b7280;font-weight:600;letter-spacing:0.5px;">📦 SHIPMENT DETAILS</p>
        ${hasCarrier ? `
          <p style="margin:8px 0 0 0;font-size:13px;color:#374151;">
            <span style="color:#6b7280;">Delivery via</span>
            <strong style="color:#111827;">${escape(order.carrier)}</strong>
          </p>
        ` : ''}
        ${hasTracking ? `
          <p style="margin:6px 0 0 0;font-size:11px;color:#6b7280;font-weight:600;letter-spacing:0.5px;">TRACKING NUMBER</p>
          <p style="margin:2px 0 0 0;font-family:'Courier New',monospace;font-size:18px;font-weight:bold;color:#111827;letter-spacing:1px;">${escape(order.trackingNumber)}</p>
        ` : ''}
      </div>
    ` : '';

  const noteBlock = adminNote ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;padding:12px 14px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;font-size:11px;color:#92400e;font-weight:600;letter-spacing:0.5px;">📝 NOTE FROM TOY MALL</p>
      <p style="margin:4px 0 0 0;color:#78350f;font-size:14px;line-height:1.5;">${escape(adminNote)}</p>
    </div>
  ` : '';

  const itemsList = order.items.slice(0, 4).map((it) => {
    const img = absoluteImage(it.image, apiBase);
    const lineTotal = (Number(it.price) || 0) * (Number(it.qty) || 0);
    return `
    <tr>
      <td style="padding:10px 0;width:64px;vertical-align:middle;">
        <img src="${img}" width="56" height="56" alt="${escape(it.name || 'Product')}" style="display:block;width:56px;height:56px;border-radius:6px;border:1px solid #e5e7eb;background:#f9fafb;object-fit:contain;" />
      </td>
      <td style="padding:10px 12px;vertical-align:middle;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#111827;line-height:1.4;">${escape(it.name || 'Product')}</p>
        <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;">Qty ${it.qty} × ₹${(Number(it.price) || 0).toFixed(2)}</p>
      </td>
      <td style="padding:10px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;vertical-align:middle;white-space:nowrap;">₹${lineTotal.toFixed(2)}</td>
    </tr>
  `;
  }).join('');
  const moreItems = order.items.length > 4
    ? `<p style="text-align:center;color:#6b7280;font-size:12px;margin:8px 0 0 0;">+${order.items.length - 4} more item(s) — see full order online</p>`
    : '';

  // Body that goes inside the shared layout's content slot.
  // For cancellations, cancelledMessage() returns block-level HTML
  // (callout boxes + timeline) so don't wrap it in a <p> — that produces
  // invalid HTML and some email clients render it badly.
  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;">Hi <strong>${escape(customerName)}</strong>,</p>
    ${order.status === 'cancelled'
      ? cancelledMessage(order)
      : `<p style="margin:0 0 16px 0;color:#374151;line-height:1.6;">${template.message}</p>`}

    ${trackingBlock}
    ${noteBlock}

    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:18px 0;">
      <p style="margin:0 0 10px 0;font-size:11px;color:#6b7280;font-weight:600;letter-spacing:0.5px;">YOUR ITEMS</p>
      <table style="width:100%;border-collapse:collapse;">
        ${itemsList}
      </table>
      ${moreItems}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;">
      <p style="margin:0;text-align:right;font-weight:bold;font-size:16px;color:#e53935;">Total: ₹${order.totalPrice.toFixed(2)}</p>
    </div>
  `;

  return renderEmail({
    preheader: `${template.headline} · Order ${order.orderNumber}`,
    heroEmoji: template.emoji,
    heroColor: template.color,
    heroTitle: template.headline,
    heroSubtitle: `Order ${order.orderNumber}`,
    bodyHtml,
    cta: { text: 'View order details', url: orderUrl, color: '#e53935' },
  });
}

function buildText(order, template, customerName, adminNote) {
  // Cancellation emails get a tailored plaintext block since the HTML
  // version uses block-level callouts that don't translate well via
  // tag-stripping. Build a clean parallel string here.
  const bodyMessage = order.status === 'cancelled'
    ? cancelledTextBody(order)
    : template.message;
  let text = `Hi ${customerName},\n\n${template.headline}\n\n${bodyMessage}\n\nOrder Number: ${order.orderNumber}\n`;
  if (order.carrier) {
    text += `Delivery via: ${order.carrier}\n`;
  }
  if (order.trackingNumber) {
    text += `Tracking Number: ${order.trackingNumber}\n`;
  }
  if (adminNote) text += `\nNote: ${adminNote}\n`;
  text += `\nTotal: ₹${order.totalPrice.toFixed(2)}\n\nView your order: ${process.env.CLIENT_URL || 'http://localhost:5173'}/order/${order._id}\n\n— Team Toy Mall\nMobin Apartment A Wing, Shop No. 4, Amrut Nagar, Near Dargah Road, Mumbra, Thane — 400612\nsupport@toymall.in`;
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
