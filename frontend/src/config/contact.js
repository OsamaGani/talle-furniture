// Single source of truth for every contact detail shown on the site.
// Update these once and they propagate everywhere — footer, navbar,
// checkout, contact page, schema.org JSON-LD, etc.
//
// Why the duplication of phones/emails: Google Business Profile (and
// most local SEO citations) lists 077380 28750 as the primary number,
// so customers searching "Toy Mall Mumbra" already see it. Keeping the
// older Gmail / mobile as secondaries gives customers a fallback path
// without breaking name/address/phone consistency on Google.

// === Phones ===
// Primary — must match Google Business Profile + Justdial + Instagram bio.
// Display variant uses a thin space for readability; tel/wa links must be
// digits-only with the country code, no spaces or punctuation.
export const PHONE_PRIMARY_DISPLAY = '+91 77380 28750';
export const PHONE_PRIMARY_TEL     = '+917738028750';
export const PHONE_PRIMARY_WHATSAPP = '917738028750'; // wa.me path

// Secondary / mobile — older number that appeared in earlier marketing.
// Kept as a fallback contact; not used for canonical NAP signals.
export const PHONE_SECONDARY_DISPLAY = '+91 86557 87075';
export const PHONE_SECONDARY_TEL     = '+918655787075';

// === Emails ===
// Primary — once the custom domain is live, create this mailbox at the
// domain registrar / mail provider. Until then, mail to it bounces — keep
// the Gmail as the actually-monitored fallback.
// TODO: change `toymall.in` to your real domain after purchase if different.
export const EMAIL_PRIMARY = 'support@toymall.in';

// Personal Gmail used during launch. Phase out once the branded inbox is live.
export const EMAIL_GMAIL = 'Huraira735@gmail.com';

// === Address ===
export const STORE_NAME = 'Toy Mall';
export const STORE_ADDRESS_STREET = 'Shop No. 4, Mobin Apartment A Wing, Amrut Nagar, Near Dargah Road';
export const STORE_ADDRESS_CITY = 'Mumbra';
export const STORE_ADDRESS_REGION = 'Thane, Maharashtra';
export const STORE_ADDRESS_PIN = '400612';
export const STORE_ADDRESS_FULL = `${STORE_ADDRESS_STREET}, ${STORE_ADDRESS_CITY}, ${STORE_ADDRESS_REGION} — ${STORE_ADDRESS_PIN}`;

// === Hours ===
export const STORE_HOURS = 'Mon–Sun · 10:00 AM – 11:30 PM';

// === Helper builders ===
export const telLink      = (display, tel) => ({ href: `tel:${tel}`, text: display });
export const waLink       = (msg = 'Hi Toy Mall! I have a question.') =>
  `https://wa.me/${PHONE_PRIMARY_WHATSAPP}?text=${encodeURIComponent(msg)}`;
export const mailtoLink   = (email = EMAIL_PRIMARY, subject = '') =>
  `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
