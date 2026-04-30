import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend, FiMessageCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    // No backend route for contact yet — this opens a mailto fallback
    setTimeout(() => {
      const body = encodeURIComponent(`Name: ${form.name}\nPhone: ${form.phone}\n\n${form.message}`);
      window.location.href = `mailto:Huraira735@gmail.com?subject=${encodeURIComponent(form.subject || 'Toy Mall enquiry')}&body=${body}`;
      toast.success('Opening your email client...');
      setSending(false);
    }, 400);
  };

  return (
    <div>
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
            lines={[<a href="tel:+919800000000" className="hover:text-primary-500">+91 98000 00000</a>]}
            color="text-blue-500 bg-blue-50"
          />
          <InfoCard
            icon={<FiMail />}
            title="Email Us"
            lines={[
              <a href="mailto:Huraira735@gmail.com" className="hover:text-primary-500">Huraira735@gmail.com</a>,
              <a href="mailto:Huraira735@gmail.com?subject=Bulk%20order%20enquiry" className="hover:text-primary-500 text-sm text-gray-600">Same address for bulk / wholesale</a>,
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
            <a href="https://wa.me/919800000000" target="_blank" rel="noopener noreferrer" className="bg-white text-green-600 font-bold px-4 py-2 rounded-md hover:bg-gray-100">Chat now</a>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-1"><FiMessageCircle /> Send us a message</h2>
          <p className="text-sm text-gray-600 mb-5">We typically reply within one working day.</p>

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

      {/* Map (Google Maps embed) */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><FiMapPin /> Find us on the map</h2>
        <div className="rounded-xl overflow-hidden border shadow-md">
          <iframe
            title="Toy Mall location"
            src="https://maps.google.com/maps?q=Mumbra%20Dargah%2C%20Mumbra%2C%20Thane%2C%20Maharashtra&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="380"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
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
