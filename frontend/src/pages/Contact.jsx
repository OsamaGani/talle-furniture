import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend, FiMessageCircle, FiCheckCircle, FiNavigation, FiExternalLink } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import SEO from '../components/SEO';
import {
  PHONE_PRIMARY_DISPLAY, PHONE_PRIMARY_TEL,
  PHONE_SECONDARY_DISPLAY, PHONE_SECONDARY_TEL,
  EMAIL_PRIMARY, EMAIL_GMAIL, waLink,
  STORE_NAME, STORE_ADDRESS_FULL,
} from '../config/contact';

// Exact Google Maps embed for the Toy Mall storefront, pulled from
// Google's "Share → Embed a map" tool — uses the verified Business
// Profile place ID so the pin lands precisely on the shop with the
// storefront photo + reviews, not on a generic address match.
const MAP_LAT = '19.175107';
const MAP_LNG = '73.020168';
const MAP_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.4598442616034!2d73.02016807425437!3d19.175107548855628!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7bf103c1fd643%3A0xb2773c43eccde054!2sToy%20Mall!5e0!3m2!1sen!2sin!4v1777716002974!5m2!1sen!2sin';
// Directions deep-link uses lat/lng so it works whether the user has
// the Maps app installed (mobile) or opens it in a browser (desktop).
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_LAT},${MAP_LNG}`;
const MAP_VIEW_URL = `https://www.google.com/maps/search/?api=1&query=Toy+Mall+Mumbra+Thane`;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await API.post('/contact', form);
      toast.success(data.message || 'Message sent — we\'ll be in touch soon.');
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <SEO
        title={`Contact Toy Mall — Mumbra, Thane | ${PHONE_PRIMARY_DISPLAY}`}
        description={`Get in touch with Toy Mall for orders, bulk wholesale enquiries, or product questions. Visit our store in Mumbra, Thane or call ${PHONE_PRIMARY_DISPLAY}.`}
        path="/contact"
      />
      <PageHeader
        title="Contact Us"
        subtitle="Questions, bulk enquiries, partnership ideas — we'd love to hear from you."
        breadcrumbs={[{ label: 'Contact' }]}
      />

      <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_1.2fr] gap-8">
        {/* Info */}
        <div className="space-y-4">
          <InfoCard
            icon={<FiMapPin />}
            title="Visit Us"
            lines={[
              'Toy Mall',
              'Mobin Apartment, A Wing, Shop No. 4',
              'Amrut Nagar, Near Dargah Road',
              'Mumbra, Thane — 400612, Maharashtra',
            ]}
            color="text-red-500 bg-red-50"
          />
          <InfoCard
            icon={<FiMail />}
            title="Owner"
            lines={['Abu Huraira Khan', <span className="text-sm text-gray-600">Founder, Toy Mall</span>]}
            color="text-amber-500 bg-amber-50"
          />
          <InfoCard
            icon={<FiPhone />}
            title="Call Us"
            lines={[
              <a href={`tel:${PHONE_PRIMARY_TEL}`} className="hover:text-primary-500">{PHONE_PRIMARY_DISPLAY}</a>,
              <a href={`tel:${PHONE_SECONDARY_TEL}`} className="hover:text-primary-500 text-sm text-gray-600">{PHONE_SECONDARY_DISPLAY}</a>,
            ]}
            color="text-blue-500 bg-blue-50"
          />
          <InfoCard
            icon={<FiMail />}
            title="Email Us"
            lines={[
              <a href={`mailto:${EMAIL_PRIMARY}`} className="hover:text-primary-500">{EMAIL_PRIMARY}</a>,
              <a href={`mailto:${EMAIL_GMAIL}`} className="hover:text-primary-500 text-sm text-gray-600">{EMAIL_GMAIL}</a>,
            ]}
            color="text-purple-500 bg-purple-50"
          />
          <InfoCard
            icon={<FiClock />}
            title="Store Hours"
            lines={['Monday – Saturday: 10:00 AM – 9:00 PM', 'Sunday: 11:00 AM – 8:00 PM']}
            color="text-green-500 bg-green-50"
          />

          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold flex items-center gap-2"><FaWhatsapp /> WhatsApp us</p>
              <p className="text-sm opacity-90 mt-1">Quickest way to reach us</p>
            </div>
            <a href={waLink()} target="_blank" rel="noopener noreferrer" className="bg-white text-green-600 font-bold px-4 py-2 rounded-md hover:bg-gray-100">Chat now</a>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-1"><FiMessageCircle /> Send us a message</h2>
          <p className="text-sm text-gray-600 mb-5">We typically reply within one working day.</p>

          {sent && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
              <FiCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="font-bold text-sm">Message sent!</p>
                <p className="text-xs mt-0.5">Thanks for reaching out — Abu Huraira will get back to you soon at the email you provided.</p>
              </div>
              <button type="button" onClick={() => setSent(false)} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold underline">
                Send another
              </button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Your Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91" />
              </div>
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Bulk order enquiry" />
            </div>
            <div>
              <label className="label">Message *</label>
              <textarea className="input" rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <FiSend /> {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      {/* Map — embedded Google Maps centered on the Toy Mall pin, with
          quick-action buttons for directions and full Maps view. */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FiMapPin className="text-primary-500" /> Find us on the map
            </h2>
            <p className="text-sm text-gray-600 mt-1">{STORE_NAME} · {STORE_ADDRESS_FULL}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={MAP_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-md transition shadow-sm"
            >
              <FiNavigation size={14} /> Get Directions
            </a>
            <a
              href={MAP_VIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-gray-300 hover:border-primary-400 hover:text-primary-500 text-sm font-semibold px-3 sm:px-4 py-2 rounded-md transition"
            >
              <FiExternalLink size={14} /> View larger
            </a>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border shadow-md bg-gray-100">
          <iframe
            title="Toy Mall — Mumbra, Thane location"
            src={MAP_EMBED_URL}
            width="100%"
            height="420"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>
    </div>
  );
}

const InfoCard = ({ icon, title, lines, color }) => (
  <div className="bg-white border rounded-xl p-5 hover:shadow-md transition">
    <div className="flex items-start gap-3">
      <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold mb-1">{title}</h3>
        {lines.map((l, i) => <p key={i} className="text-gray-700 text-sm">{l}</p>)}
      </div>
    </div>
  </div>
);
