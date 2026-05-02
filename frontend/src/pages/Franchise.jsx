import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import toast from 'react-hot-toast';
import { FiTrendingUp, FiUsers, FiBookOpen, FiTruck, FiAward, FiHelpCircle, FiArrowRight } from 'react-icons/fi';

const benefits = [
  { icon: <FiTrendingUp />, title: 'Proven Business Model', desc: 'Built on years of running our own toy store — fewer surprises, better margins.' },
  { icon: <FiAward />,      title: 'Established Brand',     desc: 'Open under the Toy Mall name with ready customer trust.' },
  { icon: <FiTruck />,      title: 'Wholesale Stock',        desc: 'Direct access to our wholesale catalogue at preferred franchise rates.' },
  { icon: <FiBookOpen />,   title: 'Training & Setup',       desc: 'We help with store layout, product mix, staff training and launch.' },
  { icon: <FiUsers />,      title: 'Marketing Support',      desc: 'Co-branded campaigns, social media kits and seasonal promo material.' },
  { icon: <FiHelpCircle />, title: 'Ongoing Support',        desc: 'A dedicated franchise manager to help you grow month after month.' },
];

const steps = [
  { n: 1, t: 'Submit Enquiry',     d: 'Fill the form below with your city, budget and timeline.' },
  { n: 2, t: 'Discovery Call',     d: 'We hop on a call to understand your goals and answer your questions.' },
  { n: 3, t: 'Location Review',    d: 'Together we evaluate the proposed location and footfall potential.' },
  { n: 4, t: 'Agreement & Setup',  d: 'Sign the franchise agreement, set up the store, and get trained.' },
  { n: 5, t: 'Grand Opening',      d: 'Launch with marketing support and your starting inventory ready.' },
];

const faqs = [
  { q: 'What investment is typically required?', a: 'It depends on city, store size and inventory. We share an indicative breakdown on the discovery call.' },
  { q: 'How long until I break even?',           a: 'Most franchise partners report break-even within 12–18 months when the location and execution are strong.' },
  { q: 'Do I need retail experience?',           a: 'It helps but isn\'t required. We provide training, SOPs and ongoing support to first-time owners too.' },
  { q: 'Which cities are you expanding in?',     a: 'We\'re actively looking for partners across Maharashtra and tier-2/3 cities pan-India.' },
];

export default function Franchise() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', message: '' });
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(0);

  const submit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      const body = encodeURIComponent(`Name: ${form.name}\nPhone: ${form.phone}\nCity: ${form.city}\n\n${form.message}`);
      window.location.href = `mailto:support@toymall.in?subject=Franchise%20enquiry%20from%20${encodeURIComponent(form.city)}&body=${body}`;
      toast.success('Opening your email client...');
      setSending(false);
    }, 400);
  };

  return (
    <div>
      <PageHeader
        title="Open a Toy Mall Franchise"
        subtitle="Bring the joy of toys to your city. Join a brand families already trust."
        breadcrumbs={[{ label: 'Franchise' }]}
      />

      {/* Why */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <Reveal>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold">Why partner with Toy Mall?</h2>
            <p className="text-gray-600 mt-2">Six reasons our franchise partners stay with us.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 80}>
              <div className="bg-white border-2 border-gray-100 hover:border-primary-500 rounded-xl p-6 transition hover:shadow-lg group h-full">
                <div className="bg-primary-100 group-hover:bg-primary-500 group-hover:text-white text-primary-500 w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 transition">
                  {b.icon}
                </div>
                <h3 className="font-bold text-lg">{b.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">From enquiry to opening</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary-500 to-pink-500 text-white rounded-full flex items-center justify-center font-extrabold shadow-md mb-2">{s.n}</div>
                <p className="font-bold text-sm">{s.t}</p>
                <p className="text-xs text-gray-600 mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_1fr] gap-8">
        {/* Form */}
        <div className="bg-white border rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-2">Apply for a franchise</h2>
          <p className="text-sm text-gray-600 mb-5">Tell us about yourself and your city — we'll get back within two working days.</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+91" /></div>
            </div>
            <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><label className="label">City of Interest *</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Pune" required /></div>
            <div><label className="label">Tell us about yourself</label><textarea className="input" rows="4" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Background, retail experience, budget range, timeline..." /></div>
            <button type="submit" disabled={sending} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {sending ? 'Sending...' : 'Submit Enquiry'} <FiArrowRight />
            </button>
          </form>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Frequently asked</h2>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="w-full text-left px-4 py-3 flex justify-between items-center font-semibold hover:bg-gray-50"
                >
                  <span>{f.q}</span>
                  <span className={`transition ${open === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {open === i && (
                  <div className="px-4 pb-3 text-sm text-gray-700 animate-fadeIn">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
