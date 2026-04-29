import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiPhone, FiTruck, FiChevronDown, FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { departments } from '../config/departments';

// Scrolling announcements shown in the top marquee strip.
const announcements = [
  { text: '🛍 BULK BUYING? Get Wholesale Prices for Your Shop — Register & Save Big', href: '/wholesale' },
  { text: '🎉 FREE Shipping on all orders above ₹999 across India',                  href: '/shipping-policy' },
  { text: '🔥 Up to 70% OFF — Limited Time Mega Toy Sale',                            href: '/shop?discount=true' },
  { text: '🚚 Same-day Dispatch on orders placed before 3 PM',                        href: '/shop' },
  { text: '⭐ New Arrivals every week — fresh toys, top brands',                      href: '/shop?newArrival=true' },
  { text: '💯 100% Authentic — LEGO, Hot Wheels, Barbie, Nerf, Marvel & more',        href: '/shop' },
  { text: '🎁 Easy 7-Day Returns on every purchase',                                  href: '/refund-policy' },
  { text: '📞 Need help? Call +91 98000 00000 — we reply fast',                       href: '/contact' },
];

const ageGroups = [
  { name: '0-2 Years', emoji: '👶' },
  { name: '2-4 Years', emoji: '🧒' },
  { name: '4-6 Years', emoji: '🎈' },
  { name: '6-8 Years', emoji: '🎨' },
  { name: '8 Years+', emoji: '🚀' },
  { name: '12 Years+', emoji: '🎮' },
];

const brands = [
  { name: 'LEGO', color: 'bg-yellow-400' },
  { name: 'Hot Wheels', color: 'bg-red-500' },
  { name: 'Barbie', color: 'bg-pink-500' },
  { name: 'Nerf', color: 'bg-orange-500' },
  { name: 'Magna-Tiles', color: 'bg-purple-500' },
  { name: 'Crayola', color: 'bg-green-500' },
  { name: 'Marvel', color: 'bg-red-700' },
  { name: 'Transformers', color: 'bg-blue-600' },
  { name: 'Kinderkraft', color: 'bg-teal-500' },
  { name: 'Skillmatics', color: 'bg-indigo-500' },
  { name: 'Bburago', color: 'bg-yellow-600' },
  { name: 'Funskool', color: 'bg-rose-500' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState('');
  const [openMenu, setOpenMenu] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMobileSection, setOpenMobileSection] = useState(null); // 'categories' | 'brands' | 'ages' | null
  const [scrolled, setScrolled] = useState(false);
  const userRef = useRef();

  useEffect(() => {
    const onClick = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setOpenUser(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // When the mobile drawer closes, also collapse any open accordion section
  useEffect(() => {
    if (!openMenu) setOpenMobileSection(null);
  }, [openMenu]);

  // Auto-close mobile menu and user dropdown whenever the route changes —
  // covers every <Link> click (even ones we forget to add a handler to)
  // and even programmatic navigation.
  useEffect(() => {
    setOpenMenu(false);
    setOpenMobileSection(null);
    setOpenUser(false);
    setOpenDropdown(null);
  }, [location.pathname, location.search]);

  // Prevent the page underneath from scrolling while the mobile drawer is open.
  useEffect(() => {
    if (openMenu) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [openMenu]);

  const toggleMobileSection = (key) =>
    setOpenMobileSection((prev) => (prev === key ? null : key));

  const closeMobileMenu = () => {
    setOpenMenu(false);
    setOpenMobileSection(null);
  };

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Hysteresis: trigger only when crossing 120 going down, untrigger when crossing 40 going up.
        // The 80-unit gap prevents oscillation when the collapsing header changes layout near the threshold.
        setScrolled((prev) => (prev ? y > 40 : y > 120));
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) navigate(`/shop?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-xl' : 'shadow-sm'}`}>
      {/* Scrolling announcements strip — hides when scrolled, pauses on hover */}
      <div className={`overflow-hidden transition-all duration-300 bg-gradient-to-r from-purple-600 via-pink-600 to-primary-500 text-white text-[11px] sm:text-xs font-semibold ${scrolled ? 'max-h-0' : 'max-h-9'}`}>
        <div className="relative flex w-full overflow-hidden py-2 group">
          {/* Two identical tracks placed side-by-side; together they animate from
              translateX(0) to translateX(-50%) which lines copy #2 up exactly
              where copy #1 started — producing a seamless infinite loop. */}
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]"
            >
              {announcements.map((a, i) => (
                <li key={`${copy}-${i}`} className="flex items-center gap-8">
                  <Link
                    to={a.href}
                    className="hover:underline hover:text-yellow-200 transition"
                  >
                    {a.text}
                  </Link>
                  <span className="opacity-50" aria-hidden>•</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {/* Top bar — hides when scrolled */}
      <div className={`bg-gray-900 text-white text-xs overflow-hidden transition-all duration-300 ${scrolled ? 'max-h-0' : 'max-h-10'}`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1"><FiTruck /> Free Shipping over ₹999</span>
            <span className="hidden md:flex items-center gap-1"><FiPhone /> +91 98000 00000</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/wholesale" className="hover:text-yellow-300 font-semibold">🛍 Wholesale</Link>
            <span className="hidden sm:inline opacity-50">|</span>
            <Link to="/orders" className="hover:text-primary-500">Track Order</Link>
            <span className="hidden sm:inline opacity-50">|</span>
            <Link to="/help" className="hidden sm:inline hover:text-primary-500">Help</Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b">
        <div className={`max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-3 sm:gap-6 transition-all duration-300 ${scrolled ? 'py-2' : 'py-2.5 sm:py-3'}`}>
          <Link to="/" className="flex items-center gap-1 flex-shrink-0">
            <span className={`font-extrabold text-primary-500 transition-all ${scrolled ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>Toy</span>
            <span className={`font-extrabold text-gray-900 transition-all ${scrolled ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>Mall</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search for toys, brands and more..."
              className="w-full border-2 border-primary-500 rounded-full pl-5 pr-14 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-full transition">
              <FiSearch />
            </button>
          </form>

          <div className="flex items-center gap-3 sm:gap-5 ml-auto">
            <Link to="/wishlist" className="relative hidden sm:flex flex-col items-center text-xs hover:text-primary-500">
              <FiHeart size={22} className={wishCount > 0 ? 'fill-current text-primary-500' : ''} />
              <span>Wishlist</span>
              {wishCount > 0 && (
                <span className="absolute -top-1 right-2 bg-primary-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {wishCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={userRef}>
              <button onClick={() => setOpenUser(!openUser)} className="flex flex-col items-center text-xs hover:text-primary-500">
                <FiUser size={22} />
                <span>{user ? user.name.split(' ')[0] : 'Login'}</span>
              </button>
              {openUser && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn ring-1 ring-black/5 overflow-hidden">
                  {user ? (
                    <>
                      <div className="px-4 py-3 bg-gradient-to-br from-primary-50 to-pink-50 border-b">
                        <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        {user.accountType === 'wholesale' && (
                          <span className="inline-block mt-1 text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">WHOLESALE</span>
                        )}
                      </div>
                      <Link to="/profile" onClick={() => setOpenUser(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm transition">👤 <span>My Profile</span></Link>
                      <Link to="/orders" onClick={() => setOpenUser(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm transition">📦 <span>My Orders</span></Link>
                      <Link to="/wishlist" onClick={() => setOpenUser(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm transition">❤ <span>My Wishlist</span></Link>
                      {user.isAdmin && (
                        <>
                          <div className="my-1 border-t" />
                          <Link to="/admin" onClick={() => setOpenUser(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-primary-50 text-sm font-semibold text-primary-500 transition">⚙ <span>Admin Dashboard</span></Link>
                        </>
                      )}
                      <div className="my-1 border-t" />
                      <button onClick={() => { logout(); setOpenUser(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 transition">🚪 <span>Logout</span></button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b">
                        <p className="font-semibold text-sm text-gray-900">Welcome to Toy Mall</p>
                        <p className="text-xs text-gray-500">Sign in to continue</p>
                      </div>
                      <Link to="/login" onClick={() => setOpenUser(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm transition">🔑 <span>Login</span></Link>
                      <Link to="/register" onClick={() => setOpenUser(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm transition">✨ <span>Create Account</span></Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link to="/cart" className="relative flex flex-col items-center text-xs hover:text-primary-500">
              <FiShoppingCart size={22} />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 right-0 bg-primary-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            <button className="md:hidden" onClick={() => setOpenMenu(!openMenu)}>
              {openMenu ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search toys..."
              className="w-full border-2 border-primary-500 rounded-full pl-4 pr-12 py-2 focus:outline-none"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary-500 text-white p-2 rounded-full">
              <FiSearch size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Categories nav */}
      <nav className="hidden md:block border-b bg-gray-50 relative" onMouseLeave={() => setOpenDropdown(null)}>
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1 text-sm font-semibold">
            <NavItem to="/shop" label="All Toys" />
            <NavItem to="/action-toys" label="🎯 Action Toys" />
            <NavItem to="/shop?discount=true" label="🔥 Up to 70% Off" highlight />
            <DropdownTrigger label="Brands" active={openDropdown === 'brands'} onHover={() => setOpenDropdown('brands')} />
            <DropdownTrigger label="Category" active={openDropdown === 'category'} onHover={() => setOpenDropdown('category')} />
            <DropdownTrigger label="Age" active={openDropdown === 'age'} onHover={() => setOpenDropdown('age')} />
            <NavItem to="/shop?category=Books" label="Books" />
            <NavItem to="/shop?bestSeller=true" label="⭐ Best Sellers" />
            <NavItem to="/shop?newArrival=true" label="✨ New Arrivals" />
            <li className="ml-auto">
              <NavLink to="/wholesale" className={({ isActive }) =>
                `inline-block px-4 py-3 text-purple-700 font-bold hover:bg-purple-50 transition ${isActive ? 'bg-purple-50' : ''}`
              }>🛍 Wholesale</NavLink>
            </li>
          </ul>
        </div>

        {/* Mega menus */}
        {openDropdown === 'brands' && (
          <div className="absolute left-0 right-0 top-full bg-white shadow-xl border-t z-40 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <h3 className="font-bold mb-3 text-gray-500 uppercase text-xs">Top Brands</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {brands.map((b) => (
                  <Link
                    key={b.name}
                    to={`/shop?brand=${encodeURIComponent(b.name)}`}
                    onClick={() => setOpenDropdown(null)}
                    className="group flex flex-col items-center text-center"
                  >
                    <div className={`${b.color} w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-md group-hover:scale-110 group-hover:shadow-lg transition`}>
                      {b.name[0]}
                    </div>
                    <span className="mt-2 text-xs font-medium group-hover:text-primary-500">{b.name}</span>
                  </Link>
                ))}
              </div>
              <Link to="/shop" onClick={() => setOpenDropdown(null)} className="block text-center mt-4 text-primary-500 font-semibold hover:underline text-sm">Browse all brands →</Link>
            </div>
          </div>
        )}

        {openDropdown === 'category' && (
          <div className="absolute left-0 right-0 top-full bg-white shadow-xl border-t z-40 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Shop By Department</h3>
                <Link
                  to="/shop"
                  onClick={() => setOpenDropdown(null)}
                  className="text-primary-500 hover:underline text-sm font-medium"
                >
                  View all toys →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
                {departments.map((d) => (
                  <div key={d.slug}>
                    <Link
                      to={`/dept/${d.slug}`}
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-2 font-bold text-gray-900 hover:text-primary-500 transition mb-2"
                    >
                      <span className="text-base">{d.emoji}</span>
                      <span className="text-sm leading-tight">{d.name}</span>
                    </Link>
                    <ul className="space-y-1.5 pl-1">
                      {d.items.map((it) => (
                        <li key={it.slug}>
                          <Link
                            to={`/category/${it.slug}`}
                            onClick={() => setOpenDropdown(null)}
                            className="text-xs text-gray-600 hover:text-primary-500 hover:underline transition"
                          >
                            {it.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {openDropdown === 'age' && (
          <div className="absolute left-0 right-0 top-full bg-white shadow-xl border-t z-40 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <h3 className="font-bold mb-3 text-gray-500 uppercase text-xs">Shop by Age</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {ageGroups.map((a) => (
                  <Link
                    key={a.name}
                    to={`/shop?ageGroup=${encodeURIComponent(a.name)}`}
                    onClick={() => setOpenDropdown(null)}
                    className="border-2 border-gray-200 hover:border-primary-500 rounded-lg p-4 text-center hover:shadow-md transition group"
                  >
                    <div className="text-3xl mb-1 group-hover:scale-110 transition">{a.emoji}</div>
                    <p className="text-sm font-semibold group-hover:text-primary-500">{a.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile slide-in drawer — always mounted so open AND close animate smoothly */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${openMenu ? '' : 'pointer-events-none'}`}
        aria-hidden={!openMenu}
      >
        {/* Backdrop — tap anywhere outside the drawer to close */}
        <div
          onClick={closeMobileMenu}
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            openMenu ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Drawer panel — slides in from the right */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={`absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
            openMenu ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between p-4 border-b shrink-0 bg-gradient-to-r from-primary-50 to-pink-50">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Browse</p>
              <p className="text-lg font-extrabold text-gray-900">Toy Mall Menu</p>
            </div>
            <button
              onClick={closeMobileMenu}
              aria-label="Close menu"
              className="p-2 rounded-full hover:bg-white/80 text-gray-700 transition"
            >
              <FiX size={22} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <ul className="px-4 py-3 space-y-1">
              <li><Link to="/shop" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded font-semibold hover:bg-gray-50 transition">All Toys</Link></li>
              <li><Link to="/action-toys" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded font-semibold hover:bg-gray-50 transition">🎯 Action Toys</Link></li>
              <li><Link to="/shop?discount=true" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded text-primary-500 font-semibold hover:bg-primary-50 transition">🔥 Up to 70% Off</Link></li>
              <li><Link to="/shop?bestSeller=true" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded hover:bg-gray-50 transition">⭐ Best Sellers</Link></li>
              <li><Link to="/shop?newArrival=true" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded hover:bg-gray-50 transition">✨ New Arrivals</Link></li>
              <li><Link to="/shop?category=Books" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded hover:bg-gray-50 transition">📚 Books</Link></li>

              {/* Collapsible: Categories */}
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('categories')}
                  aria-expanded={openMobileSection === 'categories'}
                  className="w-full flex items-center justify-between py-2.5 px-2 rounded font-semibold border-t hover:bg-gray-50 transition"
                >
                  <span>Categories</span>
                  <FiChevronDown size={18} className={`transition-transform duration-300 ease-out ${openMobileSection === 'categories' ? 'rotate-180 text-primary-500' : 'text-gray-500'}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${openMobileSection === 'categories' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden pl-2 space-y-3 pt-1">
                    {departments.map((d) => (
                      <div key={d.slug}>
                        <Link
                          to={`/dept/${d.slug}`}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 py-1.5 px-2 rounded font-semibold text-sm text-gray-900 hover:bg-primary-50 hover:text-primary-600 transition"
                        >
                          <span>{d.emoji}</span>
                          <span>{d.name}</span>
                        </Link>
                        <ul className="pl-7 mt-0.5">
                          {d.items.map((it) => (
                            <li key={it.slug}>
                              <Link
                                to={`/category/${it.slug}`}
                                onClick={closeMobileMenu}
                                className="block py-1 text-xs text-gray-600 hover:text-primary-500 transition"
                              >
                                {it.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </li>

              {/* Collapsible: Brands */}
              <li>
                <button
                  type="button"
                  onClick={() => toggleMobileSection('brands')}
                  aria-expanded={openMobileSection === 'brands'}
                  className="w-full flex items-center justify-between py-2.5 px-2 rounded font-semibold border-t hover:bg-gray-50 transition"
                >
                  <span>Brands</span>
                  <FiChevronDown size={18} className={`transition-transform duration-300 ease-out ${openMobileSection === 'brands' ? 'rotate-180 text-primary-500' : 'text-gray-500'}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${openMobileSection === 'brands' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <ul className="overflow-hidden pl-2 grid grid-cols-2 gap-1">
                    {brands.map((b) => (
                      <li key={b.name}>
                        <Link
                          to={`/shop?brand=${encodeURIComponent(b.name)}`}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 py-2 px-2 rounded text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition"
                        >
                          <span className={`${b.color} w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>{b.name[0]}</span>
                          <span className="truncate">{b.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>

              {/* Collapsible: Shop by Age */}
              <li>
                <button
                  type="button"
                  onClick={() => toggleMobileSection('ages')}
                  aria-expanded={openMobileSection === 'ages'}
                  className="w-full flex items-center justify-between py-2.5 px-2 rounded font-semibold border-t hover:bg-gray-50 transition"
                >
                  <span>Shop by Age</span>
                  <FiChevronDown size={18} className={`transition-transform duration-300 ease-out ${openMobileSection === 'ages' ? 'rotate-180 text-primary-500' : 'text-gray-500'}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${openMobileSection === 'ages' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <ul className="overflow-hidden pl-2 grid grid-cols-2 gap-1">
                    {ageGroups.map((a) => (
                      <li key={a.name}>
                        <Link
                          to={`/shop?ageGroup=${encodeURIComponent(a.name)}`}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 py-2 px-2 rounded text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition"
                        >
                          <span className="text-base">{a.emoji}</span>
                          <span>{a.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>

              <li className="pt-2 border-t mt-2">
                <Link to="/wholesale" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded text-purple-700 font-bold hover:bg-purple-50 transition">🛍 Wholesale</Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </header>
  );
}

function NavItem({ to, label, highlight }) {
  return (
    <li>
      <NavLink to={to} className={({ isActive }) =>
        `inline-block px-3 py-3 hover:text-primary-500 transition ${isActive ? 'text-primary-500' : ''} ${highlight ? 'text-primary-500' : ''}`
      }>
        {label}
      </NavLink>
    </li>
  );
}

function DropdownTrigger({ label, active, onHover }) {
  return (
    <li onMouseEnter={onHover}>
      <button className={`inline-flex items-center gap-1 px-3 py-3 hover:text-primary-500 transition ${active ? 'text-primary-500' : ''}`}>
        {label} <FiChevronDown size={14} className={`transition ${active ? 'rotate-180' : ''}`} />
      </button>
    </li>
  );
}
