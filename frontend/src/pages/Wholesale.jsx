import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiCheck, FiPackage, FiTrendingDown, FiTruck, FiAward, FiShield, FiPhone, FiMail, FiArrowRight, FiBriefcase } from 'react-icons/fi';
import { PLACEHOLDER } from '../utils/imageUrl';
import SEO from '../components/SEO';
import Reveal from '../components/Reveal';

const benefits = [
  { icon: <FiTrendingDown />, title: 'Best Bulk Rates',          desc: 'Tier-based wholesale pricing on volume orders — the more chairs, the lower the per-unit cost.' },
  { icon: <FiTruck />,         title: 'Free Mumbai Delivery',      desc: 'Free white-glove delivery on every wholesale order above ₹2,999 inside Mumbai. Pan-India freight at cost.' },
  { icon: <FiPackage />,       title: 'Own Manufacturing',         desc: 'Every chair is made in our Saki Naka workshop under the Talle brand — no resold stock, no middleman markup, full quality control end-to-end.' },
  { icon: <FiAward />,         title: 'BIFMA-Grade Stock',         desc: 'Class-4 hydraulics, certified mesh, heavy-duty bases. Every chair tested before it leaves the workshop.' },
  { icon: <FiShield />,        title: 'GST Invoices, Always',      desc: 'Proper tax invoices with your business GSTIN for full input credit. Bookkeeping stays clean.' },
  { icon: <FiBriefcase />,     title: 'Direct Owner Contact',      desc: 'No call centre. WhatsApp the founder for stock checks, custom branding, or delivery updates.' },
];

// Fallback used only if the API call fails (offline / first load)
const fallbackPopularCategories = [
  { _id: 'fb1', name: 'Office Chairs',  image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400', link: '/shop?category=Executive%20Chairs' },
  { _id: 'fb2', name: 'Gaming Chairs',  image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400', link: '/shop?category=Pro%20Gaming%20Chairs' },
  { _id: 'fb3', name: 'Banquet Chairs', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400', link: '/shop?category=Banquet%20Chairs' },
  { _id: 'fb4', name: 'Recliners',      image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400', link: '/shop?category=Recliners' },
];

const testimonials = [
  { name: 'BlueChip Offices',     city: 'Bandra Kurla Complex', text: 'Outfitted 80 workstations with Talle ergonomic chairs. Zero complaints from staff, repair team on speed-dial.', rating: 5 },
  { name: 'Royal Banquet Halls',  city: 'Andheri',              text: 'Tiffany chairs in gold finish — rock-solid build, stack neatly, withstand 200+ events. Best supplier we\'ve used.', rating: 5 },
  { name: 'CafeBros Restaurants', city: 'Powai',                text: 'Switched our entire chain to Talle cafe chairs. Looks great, lasts longer, and they fix anything fast.', rating: 5 },
];

export default function Wholesale() {
  const { user } = useAuth();
  const isWholesaleUser = user?.accountType === 'wholesale';
  const [popularCategories, setPopularCategories] = useState(fallbackPopularCategories);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await API.get('/wholesale-categories');
        if (!cancelled && Array.isArray(data) && data.length > 0) setPopularCategories(data);
      } catch { /* keep fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <SEO
        title="Wholesale Office, Banquet & Restaurant Chairs — Talle Mumbai"
        description="Bulk chair supplier for Mumbai offices, banquet halls and restaurants. Own-manufactured Talle seating — trusted by WeWork, Roller Bearing & 300+ businesses. GST invoices, white-glove delivery, direct line to the founder."
        path="/wholesale"
        keywords="wholesale chairs mumbai, bulk office chairs supplier, banquet chair manufacturer, restaurant chair wholesaler mumbai, b2b chair supplier mumbai, gst invoice wholesale chairs, office chair distributor sakinaka, hotel chair manufacturer, coworking chair supplier, tandem seating bulk, conference table supplier, training room chair bulk, customised office chair manufacturer"
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 via-pink-600 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block bg-yellow-400 text-gray-900 text-xs font-extrabold px-3 py-1 rounded-full mb-4">FOR OFFICES, HALLS &amp; RESELLERS</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Talle <br />
              <span className="text-yellow-300">Wholesale</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl opacity-95">
              Own-manufactured executive, ergonomic, banquet, restaurant and
              wooden dining seating — at rates that work for outfitting whole
              offices or banquet halls.<br />
              <span className="font-bold">Best bulk pricing</span> · Free Mumbai delivery on ₹2,999+ · GST invoices
            </p>
            {isWholesaleUser ? (
              <div className="mt-6 bg-white/20 backdrop-blur border border-white/30 rounded-lg p-4 inline-block">
                <p className="font-semibold flex items-center gap-2"><FiCheck /> You're already a wholesale customer!</p>
                <Link to="/shop" className="inline-flex items-center gap-2 mt-2 text-yellow-300 font-bold hover:underline">Browse wholesale products <FiArrowRight /></Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 mt-6">
                <Link to="/register" className="inline-flex items-center gap-2 bg-white text-purple-700 hover:bg-yellow-300 hover:text-gray-900 font-bold px-6 py-3 rounded-lg shadow-lg transition">
                  Register as Wholesaler <FiArrowRight />
                </Link>
                <Link to="/shop" className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white hover:text-purple-700 font-bold px-6 py-3 rounded-lg transition">
                  Browse Catalog
                </Link>
              </div>
            )}
            <div className="flex gap-6 mt-8 text-sm">
              <Stat number="300+" label="Business Buyers" />
              <Stat number="15+"  label="Top Chair Brands" />
              <Stat number="6-Mo" label="Repair Warranty" />
            </div>
          </div>
          <div className="hidden md:block">
            <img src="https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=900" alt="Wholesale chairs" className="rounded-2xl shadow-2xl w-full max-h-96 object-cover" />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">Why Businesses Choose Talle Wholesale</h2>
          <p className="text-gray-600 mt-2">Built for offices, banquet halls, restaurants and resellers who want quality seating, the best rates, and a workshop that backs every order.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <Reveal key={b.title} direction="up" delay={i * 100}>
              <div className="bg-white border-2 border-gray-100 hover:border-purple-500 rounded-xl p-6 transition hover:shadow-lg group h-full">
                <div className="bg-purple-100 group-hover:bg-purple-500 group-hover:text-white text-purple-600 w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 transition">
                  {b.icon}
                </div>
                <h3 className="font-bold text-lg">{b.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Register Your Business', desc: 'Sign up as a wholesale customer with your business name &amp; GST' },
              { step: 2, title: 'Browse Catalog', desc: 'See special wholesale prices on bulk-quantity orders' },
              { step: 3, title: 'Place Bulk Order', desc: 'Add to cart — wholesale price applies automatically' },
              { step: 4, title: 'White-Glove Delivery', desc: 'Free delivery + assembly + GST invoice across Mumbai' },
            ].map((s, i) => (
              <Reveal key={s.step} direction="up" delay={i * 120}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-extrabold shadow-lg mb-3">{s.step}</div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Popular wholesale categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">Hot Wholesale Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularCategories.map((c, i) => {
            const href = c.link?.trim() || `/shop?category=${encodeURIComponent(c.name)}`;
            return (
              <Reveal key={c._id || c.name} direction="scale" delay={i * 80}>
              <Link
                to={href}
                className="group relative aspect-square rounded-xl overflow-hidden shadow hover:shadow-xl transition bg-gray-100 block"
              >
                <img
                  src={c.image || c.img || PLACEHOLDER}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg drop-shadow">{c.name}</h3>
                </div>
              </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-r from-purple-600 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">Trusted by 300+ Mumbai Businesses</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} direction={i === 0 ? 'left' : i === 2 ? 'right' : 'up'} delay={i * 100}>
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 h-full">
                  <div className="text-yellow-300 mb-2">{'★'.repeat(t.rating)}</div>
                  <p className="text-white/95">"{t.text}"</p>
                  <p className="mt-3 font-bold">{t.name}</p>
                  <p className="text-sm opacity-80">{t.city}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Seat Smarter. Save More.</h2>
          <p className="mt-3 text-lg text-gray-300">Join 300+ Mumbai offices, banquet halls and restaurants who source seating from Talle. Free to register, no minimum order to start.</p>
          {!isWholesaleUser && (
            <Link to="/register" className="inline-flex items-center gap-2 mt-6 bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-4 rounded-lg shadow-lg text-lg transition">
              Open Free Wholesale Account <FiArrowRight />
            </Link>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <span className="flex items-center gap-2"><FiPhone /> +91 93261 66875</span>
            <span className="flex items-center gap-2"><FiMail /> abdulrab2411@gmail.com</span>
          </div>
        </div>
      </section>
    </div>
  );
}

const Stat = ({ number, label }) => (
  <div>
    <p className="text-2xl md:text-3xl font-extrabold text-yellow-300">{number}</p>
    <p className="opacity-90">{label}</p>
  </div>
);
