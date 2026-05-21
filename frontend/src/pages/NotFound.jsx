import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiHeart,
  FiHelpCircle,
  FiArrowLeft,
  FiSearch,
  FiPhone,
  FiMail,
} from 'react-icons/fi';

const popularDestinations = [
  { to: '/',         icon: <FiHome />,        label: 'Home',     desc: 'Talle home',              color: 'from-pink-500 to-rose-500' },
  { to: '/shop',     icon: <FiShoppingBag />, label: 'Shop',     desc: 'All chairs',              color: 'from-blue-500 to-indigo-500' },
  { to: '/wishlist', icon: <FiHeart />,       label: 'Wishlist', desc: 'Saved favourites',        color: 'from-purple-500 to-fuchsia-500' },
  { to: '/help',     icon: <FiHelpCircle />,  label: 'Help',     desc: 'FAQs & support',          color: 'from-emerald-500 to-green-500' },
];

const popularCategories = [
  { name: 'Executive',                    emoji: '💼' },
  { name: 'Ergonomic',                    emoji: '🪑' },
  { name: 'Premium',                      emoji: '✨' },
  { name: 'Designer',                     emoji: '🎨' },
  { name: 'Gaming',                       emoji: '🎮' },
  { name: 'Study Chair',                  emoji: '📚' },
  { name: 'Tandem',                       emoji: '🪟' },
  { name: 'Cafeteria',                    emoji: '🍽' },
];

export default function NotFound() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = '404 — Page Not Found · Talle Furniture Mart';
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/shop?keyword=${encodeURIComponent(q)}`);
  };

  return (
    <div className="relative overflow-hidden bg-gray-50">
      {/* === HERO === */}
      <section className="max-w-5xl mx-auto px-4 pt-12 sm:pt-20 pb-6 sm:pb-10 text-center">
        {/* Quiet eyebrow — no bouncing chair emojis. */}
        <p className="text-[10px] sm:text-xs uppercase tracking-[3px] text-primary-500 font-bold mb-4 sm:mb-5">
          Error · 404
        </p>

        {/* Big charcoal "404" — solid colour, no rainbow gradient text. */}
        <h1 className="font-display font-medium text-[100px] sm:text-[140px] md:text-[180px] leading-none tracking-tighter text-gray-900">
          404
        </h1>
        <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mt-3 px-2">
          This chair rolled away.
        </p>
        <p className="text-sm sm:text-base text-gray-600 mt-2 sm:mt-3 max-w-md sm:max-w-xl mx-auto px-4">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        {pathname && (
          <p className="mt-2 inline-block text-[10px] sm:text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-full break-all max-w-full">
            {pathname}
          </p>
        )}

        {/* Search bar */}
        <form
          onSubmit={onSearch}
          className="max-w-md sm:max-w-xl mx-auto mt-6 sm:mt-8 bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-1.5 sm:p-2 flex items-center"
        >
          <FiSearch className="text-gray-400 ml-2 sm:ml-3 flex-shrink-0" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chairs, brands…"
            className="flex-1 px-2 sm:px-3 py-2.5 sm:py-3 outline-none text-sm md:text-base bg-transparent min-w-0"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-3 sm:px-5 py-2 sm:py-3 rounded-xl text-sm transition whitespace-nowrap"
          >
            Search
          </button>
        </form>

        {/* Primary action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-5 sm:mt-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-sm transition text-sm sm:text-base"
          >
            <FiArrowLeft size={16} /> Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-sm transition text-sm sm:text-base"
          >
            <FiHome size={16} /> Home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gray-900 hover:bg-black text-white font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-sm transition text-sm sm:text-base"
          >
            <FiShoppingBag size={16} /> Shop
          </Link>
        </div>
      </section>

      {/* === POPULAR DESTINATIONS === */}
      <section className="max-w-5xl mx-auto px-4 pb-6 sm:pb-10">
        <h2 className="text-center text-[11px] sm:text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3 sm:mb-4">
          Popular destinations
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {popularDestinations.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all group active:scale-[0.98]"
            >
              <div className="bg-gray-100 group-hover:bg-primary-50 group-hover:text-primary-500 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-xl mb-2 sm:mb-3 text-gray-700 transition">
                {d.icon}
              </div>
              <p className="font-bold text-sm sm:text-base">{d.label}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-snug">{d.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* === BROWSE BY CATEGORY === */}
      <section className="max-w-5xl mx-auto px-4 pb-8 sm:pb-12">
        <h2 className="text-center text-[11px] sm:text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3 sm:mb-4">
          Or pick a category
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {popularCategories.map((c) => (
            <Link
              key={c.name}
              to={`/shop?category=${encodeURIComponent(c.name)}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-primary-50 border border-gray-200 hover:border-primary-300 text-gray-800 font-medium text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition"
            >
              <span>{c.emoji}</span> {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* === HELP STRIP === */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10 text-center">
          <p className="text-[10px] uppercase tracking-[3px] text-amber-300 font-bold mb-2">Need a hand?</p>
          <p className="text-base sm:text-xl font-bold">Still can't find what you need?</p>
          <p className="text-white/75 text-xs sm:text-sm mt-1 px-4">
            Our support team is happy to help you find the perfect chair.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-5">
            <a
              href="tel:+919326166875"
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white text-gray-900 hover:bg-amber-300 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition text-sm active:scale-[0.99]"
            >
              <FiPhone size={14} /> Call us
            </a>
            <a
              href="mailto:abdulrab2411@gmail.com"
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition text-sm"
            >
              <FiMail size={14} /> Email
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition text-sm"
            >
              <FiHelpCircle size={14} /> Help
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
