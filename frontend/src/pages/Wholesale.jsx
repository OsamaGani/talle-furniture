import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiCheck, FiPackage, FiTrendingDown, FiTruck, FiAward, FiShield, FiPhone, FiMail, FiArrowRight, FiBriefcase } from 'react-icons/fi';
import { PLACEHOLDER } from '../utils/imageUrl';

const benefits = [
  { icon: <FiTrendingDown />, title: 'Save up to 40%', desc: 'Special wholesale pricing on bulk orders' },
  { icon: <FiTruck />, title: 'Free Bulk Shipping', desc: 'Free delivery across India on orders over ₹999' },
  { icon: <FiPackage />, title: 'Stock for Your Shop', desc: 'Re-stock your store with top toy brands' },
  { icon: <FiAward />, title: 'Authentic Brands', desc: 'Direct from manufacturers — 100% genuine' },
  { icon: <FiShield />, title: 'Easy GST Invoice', desc: 'Proper GST invoices for input credit' },
  { icon: <FiBriefcase />, title: 'Dedicated Support', desc: 'Account manager for wholesale buyers' },
];

// Fallback used only if the API call fails (offline / first load)
const fallbackPopularCategories = [
  { _id: 'fb1', name: 'LEGO Sets',  image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400', link: '/shop?brand=LEGO' },
  { _id: 'fb2', name: 'Hot Wheels', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400', link: '/shop?brand=Hot%20Wheels' },
  { _id: 'fb3', name: 'Soft Toys',  image: 'https://images.unsplash.com/photo-1606503153255-59d8b8b6a9ec?w=400', link: '/shop?category=Dolls' },
  { _id: 'fb4', name: 'Educational',image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', link: '/shop?category=Learning%20%26%20Education' },
];

const testimonials = [
  { name: 'Rajesh Toys', city: 'Mumbai', text: 'Best wholesale rates I\'ve found in years. Fast shipping to my shop in Dadar.', rating: 5 },
  { name: 'Kids World Store', city: 'Pune', text: 'Authentic brands, on-time delivery, GST invoices — exactly what my business needs.', rating: 5 },
  { name: 'Happy Toys', city: 'Nashik', text: 'My margins improved 30% after switching to Toy Mall wholesale.', rating: 5 },
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
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 via-pink-600 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block bg-yellow-400 text-gray-900 text-xs font-extrabold px-3 py-1 rounded-full mb-4">FOR SHOP OWNERS &amp; RESELLERS</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Toy Mall <br />
              <span className="text-yellow-300">Wholesale</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl opacity-95">
              Stock your shop with India's biggest toy collection.<br />
              <span className="font-bold">Save up to 40%</span> on bulk orders. Free shipping over ₹999.
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
              <Stat number="500+" label="Shop Owners" />
              <Stat number="20+" label="Top Brands" />
              <Stat number="40%" label="Avg. Savings" />
            </div>
          </div>
          <div className="hidden md:block">
            <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900" alt="Wholesale toys" className="rounded-2xl shadow-2xl w-full max-h-96 object-cover" />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">Why Buy Wholesale from Toy Mall?</h2>
          <p className="text-gray-600 mt-2">Everything your toy shop needs in one place</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b) => (
            <div key={b.title} className="bg-white border-2 border-gray-100 hover:border-purple-500 rounded-xl p-6 transition hover:shadow-lg group">
              <div className="bg-purple-100 group-hover:bg-purple-500 group-hover:text-white text-purple-600 w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 transition">
                {b.icon}
              </div>
              <h3 className="font-bold text-lg">{b.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Register Your Business', desc: 'Sign up as a wholesale customer with your shop name &amp; GST' },
              { step: 2, title: 'Browse Catalog', desc: 'See special wholesale prices on minimum-quantity packs' },
              { step: 3, title: 'Place Bulk Order', desc: 'Add to cart — wholesale price applies automatically' },
              { step: 4, title: 'Get Delivered', desc: 'Free delivery + GST invoice — restock your shop' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-extrabold shadow-lg mb-3">{s.step}</div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular wholesale categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">Hot Wholesale Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularCategories.map((c) => {
            const href = c.link?.trim() || `/shop?category=${encodeURIComponent(c.name)}`;
            return (
              <Link
                key={c._id || c.name}
                to={href}
                className="group relative aspect-square rounded-xl overflow-hidden shadow hover:shadow-xl transition bg-gray-100"
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
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-r from-purple-600 to-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">Trusted by 500+ Shop Owners</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <div className="text-yellow-300 mb-2">{'★'.repeat(t.rating)}</div>
                <p className="text-white/95">"{t.text}"</p>
                <p className="mt-3 font-bold">{t.name}</p>
                <p className="text-sm opacity-80">{t.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Ready to Save Big on Toy Inventory?</h2>
          <p className="mt-3 text-lg text-gray-300">Join hundreds of shop owners across India sourcing from Toy Mall.</p>
          {!isWholesaleUser && (
            <Link to="/register" className="inline-flex items-center gap-2 mt-6 bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-4 rounded-lg shadow-lg text-lg transition">
              Open Free Wholesale Account <FiArrowRight />
            </Link>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <span className="flex items-center gap-2"><FiPhone /> +91 77380 28750</span>
            <span className="flex items-center gap-2"><FiMail /> support@toymall.in</span>
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
