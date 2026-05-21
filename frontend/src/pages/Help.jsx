import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { FiSearch, FiShoppingBag, FiTruck, FiCreditCard, FiUser, FiPackage, FiMail, FiPhone, FiMessageCircle, FiChevronDown } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  PHONE_PRIMARY_DISPLAY, PHONE_PRIMARY_TEL,
  EMAIL_PRIMARY, waLink, mailtoLink,
} from '../config/contact';
import Reveal from '../components/Reveal';
import SEO from '../components/SEO';

const categories = [
  {
    icon: <FiShoppingBag />, color: 'bg-blue-100 text-blue-600',
    title: 'Orders &amp; Shopping',
    questions: [
      { q: 'How do I place an order?',
        a: 'Browse the shop, add items to your cart, click checkout, fill in your shipping address, choose a payment method, and confirm. You\'ll get an email confirmation right away.' },
      { q: 'Can I cancel my order?',
        a: 'Yes — open My Orders, find the order, and request cancellation. You can cancel any time before it ships. Once shipped, you can refuse the delivery for a refund.' },
      { q: 'How do I apply a discount code?',
        a: 'Discount codes can be entered at checkout in the "Promo code" field. Many products also have automatic discounts applied at the product page.' },
    ],
  },
  {
    icon: <FiTruck />, color: 'bg-green-100 text-green-600',
    title: 'Shipping &amp; Delivery',
    questions: [
      { q: 'When will my order arrive?',
        a: 'Metro cities: 2–4 business days. Non-metros: 4–7 days. Remote areas: up to 10 days. You\'ll get email updates at every stage and can track from My Orders.' },
      { q: 'How much is shipping?',
        a: 'FREE Mumbai delivery on orders above ₹2,999. Pan-India shipping calculated at checkout based on chair size and pincode. See the full Shipping Policy.' },
      { q: 'Can I track my package?',
        a: 'Yes — once shipped, your tracking number appears in My Orders and in the shipping email we send.' },
      { q: 'Do you ship internationally?',
        a: 'Not yet — we currently only deliver within India.' },
    ],
  },
  {
    icon: <FiCreditCard />, color: 'bg-purple-100 text-purple-600',
    title: 'Payments &amp; Pricing',
    questions: [
      { q: 'What payment methods do you accept?',
        a: 'Cash on Delivery and online payments via Razorpay — UPI (GPay, PhonePe, Paytm), Credit/Debit cards, Netbanking, and Wallets.' },
      { q: 'How do payments work for orders outside Mumbai?',
        a: 'Mumbai &amp; nearby areas: full Cash on Delivery accepted. Outside Mumbai: 70% advance payment online, 30% balance on delivery. This covers freight while you keep some leverage until the chair arrives.' },
      { q: 'Is my card information safe?',
        a: 'Absolutely. We never store your full card details — payments are securely processed by Razorpay (PCI-DSS compliant). Our site uses HTTPS and JWT authentication.' },
      { q: 'When am I charged?',
        a: 'For prepaid orders (card/UPI), at the time you place the order. For COD, you pay the delivery person in cash when your order arrives.' },
    ],
  },
  {
    icon: <FiPackage />, color: 'bg-orange-100 text-orange-600',
    title: 'Returns &amp; Refunds',
    questions: [
      { q: 'What is your return policy?',
        a: 'You have 7 days from delivery to request a return on most items. They must be unused and in original packaging. See full Refund Policy.' },
      { q: 'How long do refunds take?',
        a: 'Once we receive the returned item: 1–2 business days to process, then 5–7 business days for the refund to reach your account/card.' },
      { q: 'My order arrived damaged — what do I do?',
        a: `Email ${EMAIL_PRIMARY} the same day with photos of the damage. We'll dispatch a replacement at no extra cost.` },
    ],
  },
  {
    icon: <FiUser />, color: 'bg-pink-100 text-pink-600',
    title: 'Account &amp; Security',
    questions: [
      { q: 'How do I create an account?',
        a: 'Click the user icon in the top right, then "Create Account". You\'ll get a 6-digit verification code by email — enter it to activate.' },
      { q: 'I didn\'t get my verification email.',
        a: 'Check spam, then click "Resend OTP" on the verify page. The code is valid for 10 minutes.' },
      { q: 'I forgot my password.',
        a: 'Use "Forgot Password" on the login page (coming soon — for now contact support and we\'ll reset it).' },
      { q: 'Do you offer chair repair?',
        a: 'Yes — Talle is best known for it. Hydraulic replacement, reupholstery, wheel & base fix, full refurbishing. Doorstep pickup across Mumbai. Visit the Chair Repair page or WhatsApp for a quote.' },
    ],
  },
];

export default function Help() {
  const [search, setSearch] = useState('');
  const [openKey, setOpenKey] = useState(null);

  const matches = (q, a) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return q.toLowerCase().includes(s) || a.toLowerCase().includes(s);
  };

  const filteredCategories = categories.map((c) => ({
    ...c,
    questions: c.questions.filter(({ q, a }) => matches(q, a)),
  })).filter((c) => c.questions.length > 0);

  // FAQPage JSON-LD — every Q&A on this page surfaced to Google so the
  // Help page can earn "People also ask" + rich-result accordion
  // placements in SERPs for chair-repair / delivery / payment queries.
  // Categories' HTML-entity'd titles (&amp;) are unescaped for clean
  // schema text; HTML in answers is stripped to plain text.
  const stripHtml = (s = '') => String(s).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': categories.flatMap((c) =>
      c.questions.map((qa) => ({
        '@type': 'Question',
        'name': stripHtml(qa.q),
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': stripHtml(qa.a),
        },
      }))
    ),
  };

  return (
    <div>
      <SEO
        title="Help & FAQs — Chair Orders, Repair, Delivery, Returns | Talle Mumbai"
        description="Frequently asked questions about ordering chairs from Talle Furniture Mart Mumbai — delivery time, payment, COD, returns, warranty, office chair repair, hydraulic replacement, reupholstery cost."
        path="/help"
        keywords="chair shop FAQ Mumbai, office chair return policy India, COD chair delivery Mumbai, chair warranty India, hydraulic cylinder replacement cost, office chair repair cost Mumbai, chair reupholstery price, talle furniture mart help, chair order cancellation, free delivery threshold Mumbai chairs"
      />
      {/* Surface every FAQ to Google as a FAQPage rich result. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageHeader
        title="How Can We Help?"
        subtitle="Most questions about orders, delivery, payments, and returns are answered below. Still stuck? Tap any of the contact options at the bottom — we reply within a working day."
        breadcrumbs={[{ label: 'Help' }]}
      />

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-2 border">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-12 pr-4 py-3 rounded-xl text-base focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Quick contact cards — clean white cards with single accent
          colour per channel (WhatsApp green, Call neutral charcoal,
          Email primary-red) instead of three loud candy gradients.
          Premium pattern: colour belongs to the icon, not the
          background. */}
      <section className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Reveal direction="left" delay={0}>
          <ContactCard icon={<FaWhatsapp />} title="WhatsApp" desc="Chat with us instantly" cta="Open chat" link={waLink()} accentClass="text-emerald-600 bg-emerald-50" />
        </Reveal>
        <Reveal direction="up" delay={120}>
          <ContactCard icon={<FiPhone />} title="Call us" desc={PHONE_PRIMARY_DISPLAY} cta="Call now" link={`tel:${PHONE_PRIMARY_TEL}`} accentClass="text-gray-700 bg-gray-100" />
        </Reveal>
        <Reveal direction="right" delay={240}>
          <ContactCard icon={<FiMail />} title="Email us" desc={EMAIL_PRIMARY} cta="Send email" link={mailtoLink()} accentClass="text-primary-600 bg-primary-50" />
        </Reveal>
      </section>

      {/* FAQ categories */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No results for "{search}"</p>
            <Link to="/contact" className="btn-primary inline-block mt-4">Ask us directly</Link>
          </div>
        ) : (
          filteredCategories.map((cat, ci) => (
            <div key={cat.title} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className={`${cat.color} w-10 h-10 rounded-xl flex items-center justify-center text-lg`}>
                  {cat.icon}
                </div>
                <h2 className="text-xl font-bold" dangerouslySetInnerHTML={{ __html: cat.title }} />
              </div>
              <div className="space-y-2">
                {cat.questions.map((qa, qi) => {
                  const key = `${ci}-${qi}`;
                  const isOpen = openKey === key;
                  return (
                    <div key={key} className="border rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        className="w-full text-left px-4 py-3 flex justify-between items-center font-semibold hover:bg-gray-50"
                      >
                        <span className="pr-4">{qa.q}</span>
                        <FiChevronDown className={`flex-shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-gray-700 text-sm leading-relaxed border-t bg-gray-50 animate-fadeIn">
                          {qa.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Still need help — charcoal band with amber eyebrow, matches the
          About + ResetPassword pattern. White CTA on dark for high
          contrast without resorting to a candy gradient. */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-[10px] uppercase tracking-[3px] text-amber-300 font-bold mb-3">Talk to us</p>
          <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight">Still need help?</h2>
          <p className="mt-2 text-white/75 text-sm">Our team usually replies within one business day.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 mt-6 bg-white hover:bg-amber-300 text-gray-900 font-semibold text-sm px-6 py-3 rounded-lg transition active:scale-[0.99]">
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}

// Clean white contact card with a tinted icon disc (channel-specific
// accent colour) — the gradient backgrounds were the loudest tiles on
// the help page and reading as discount badges instead of contact
// channels. This treatment is the same pattern Apple / Pottery Barn
// support pages use.
const ContactCard = ({ icon, title, desc, cta, link, accentClass = 'text-gray-700 bg-gray-100' }) => {
  const isExternal = link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('tel:');
  const Wrapper = isExternal ? 'a' : Link;
  const props = isExternal ? { href: link, target: link.startsWith('http') ? '_blank' : undefined, rel: 'noopener noreferrer' } : { to: link };
  return (
    <Wrapper {...props} className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md rounded-2xl p-5 transition-all flex items-center gap-4 active:scale-[0.99]">
      <div className={`${accentClass} w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-600 truncate">{desc}</p>
        <p className="text-[11px] font-semibold mt-1 text-primary-500 group-hover:text-primary-600">{cta} →</p>
      </div>
    </Wrapper>
  );
};
