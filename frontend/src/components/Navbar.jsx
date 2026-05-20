import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiPhone, FiTruck, FiChevronDown, FiHeart, FiHome } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { departments } from '../config/departments';

// Scrolling announcements shown in the top marquee strip.
const announcements = [
  { text: '🚚 FREE Delivery on all orders above ₹2,999 across Mumbai',                          href: '/shipping-policy' },
  { text: '🔥 Up to 50% OFF — Mega Chair Sale',                                                 href: '/shop?discount=true' },
  { text: '🔧 Expert Chair Repair & Reupholstery — Doorstep Service in Mumbai',                 href: '/contact' },
  { text: '⭐ New Models every week — Executive, Ergonomic, Premium, Gaming',                  href: '/shop?newArrival=true' },
  { text: '💯 Own Manufacturing — Trusted by WeWork, Roller Bearing, Upstep Academy & more',     href: '/about' },
  { text: '🛡 5-Year Warranty on Talle-branded chairs',                                          href: '/refund-policy' },
  { text: '📞 Need help? Call +91 93261 66875 — we reply fast',                                  href: '/contact' },
];

// Material filter — replaces the legacy "age group" facet for the chair
// business. Grouped into 3 sections so the mega-menu mirrors the Category
// dropdown's department-grouped layout (Soft / Premium Upholstery / Solid).
const materialGroups = [
  {
    name: 'Soft & Breathable',
    emoji: '🕸',
    items: [
      { name: 'Mesh',         emoji: '🕸' },
      { name: 'Fabric',       emoji: '🧵' },
    ],
  },
  {
    name: 'Premium Upholstery',
    emoji: '🟫',
    items: [
      { name: 'Leather',      emoji: '🟫' },
      { name: 'Faux Leather', emoji: '🪑' },
      { name: 'Cushion',      emoji: '🛋' },
    ],
  },
  {
    name: 'Solid Frame',
    emoji: '🪵',
    items: [
      { name: 'Wood',         emoji: '🪵' },
      { name: 'Metal',        emoji: '⚙' },
      { name: 'Plastic',      emoji: '🧴' },
    ],
  },
];
// Flat list — kept for the mobile drawer accordion which doesn't have room
// for the department-style section headers.
const materialList = materialGroups.flatMap((g) => g.items);

// Clients — real B2B customers we manufacture chairs for. Grouped by
// industry so the mega-menu mirrors the Category dropdown's department-
// grouped layout (Coworking / Education / Finance / F&B & Events).
const clientGroups = [
  {
    name: 'Coworking & Offices',
    emoji: '🏢',
    items: [
      { name: 'WeWork',           color: 'bg-slate-900' },
      { name: 'Coworking Spaces', color: 'bg-purple-600' },
      { name: 'Mumbai Offices',   color: 'bg-cyan-700' },
    ],
  },
  {
    name: 'Education',
    emoji: '🎓',
    items: [
      { name: 'Upstep Academy',   color: 'bg-blue-700' },
      { name: 'Coaching Hubs',    color: 'bg-rose-600' },
    ],
  },
  {
    name: 'Finance & Industrial',
    emoji: '💼',
    items: [
      { name: 'Respo Financial',  color: 'bg-emerald-700' },
      { name: 'Roller Bearing',   color: 'bg-amber-700' },
    ],
  },
  {
    name: 'F&B & Events',
    emoji: '🍽',
    items: [
      { name: 'Restaurants',      color: 'bg-orange-600' },
      { name: 'Banquet Halls',    color: 'bg-fuchsia-700' },
    ],
  },
];
const clients = clientGroups.flatMap((g) => g.items);

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

  // Close the user dropdown the moment the user starts scrolling — feels right
  // on mobile where the menu floats below the navbar and isn't position:fixed.
  useEffect(() => {
    if (!openUser) return;
    const onScrollClose = () => setOpenUser(false);
    window.addEventListener('scroll', onScrollClose, { passive: true });
    return () => window.removeEventListener('scroll', onScrollClose);
  }, [openUser]);

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
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1"><FiTruck /> Free Delivery over ₹2,999</span>
            <span className="hidden md:flex items-center gap-1"><FiPhone /> +91 93261 66875</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/orders" className="hover:text-primary-500">Track Order</Link>
            <span className="hidden sm:inline opacity-50">|</span>
            <Link to="/help" className="hidden sm:inline hover:text-primary-500">Help</Link>
          </div>
        </div>
      </div>

      {/* Main bar — 3-column grid (logo | search | actions). The grid lets
          the search bar sit truly centred inside the middle column while
          logo and actions hug their own sides. Full screen width with
          generous side padding so it doesn't kiss the screen edges on
          wide displays. */}
      <div className="border-b">
        <div className={`w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6 transition-all duration-300 ${scrolled ? 'py-2' : 'py-2.5 sm:py-3'}`}>
          {/* Brand logo — SVG wordmark + architectural chair mark. Height
              steps up on tablet/desktop because the navbar has plenty of
              horizontal space to fill. Shrinks slightly when the page is
              scrolled so the sticky nav stays compact. The SVG keeps its
              280:88 (~3.18:1) aspect ratio so width follows the height.

              Sizing ladder (height in px, only Tailwind defaults):
                 mobile  <640  →  scrolled 36 / default 40
                 sm      640+  →  scrolled 40 / default 48
                 md      768+  →  scrolled 48 / default 56
                 lg     1024+  →  scrolled 56 / default 64
              At lg+ the logo renders ~204 px wide — visually substantial
              without crowding the search bar. */}
          <Link to="/" className="flex items-center flex-shrink-0" aria-label="Talle Furniture Mart — home">
            <img
              src="/logo.svg"
              alt="Talle Furniture Mart"
              className={`w-auto transition-all ${scrolled ? 'h-9 sm:h-10 md:h-12 lg:h-14' : 'h-10 sm:h-12 md:h-14 lg:h-16'}`}
            />
          </Link>

          {/* Search bar — capped width so it doesn't stretch awkwardly
              across full-screen-width navbars. mx-auto centres it inside
              the 1fr grid column, so on ultra-wide displays it sits in
              the middle with equal space on either side instead of
              ballooning into a 1000+ px wide input. */}
          <form onSubmit={handleSearch} className="hidden md:flex w-full max-w-2xl mx-auto relative">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search chairs, brands, materials..."
              className="w-full border-2 border-primary-500 rounded-full pl-5 pr-14 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-full transition">
              <FiSearch />
            </button>
          </form>

          <div className="flex items-center gap-3 sm:gap-5 justify-self-end">
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
                <>
                  {/* Mobile-only backdrop so tapping outside closes the menu */}
                  <div
                    className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setOpenUser(false)}
                  />
                  <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] sm:w-72 max-w-sm bg-white rounded-2xl shadow-2xl z-50 animate-fadeIn ring-1 ring-black/5 overflow-hidden">
                  {user ? (
                    <>
                      {/* Logged-in header with avatar circle */}
                      <div className="px-5 py-4 bg-gradient-to-br from-primary-500 via-pink-500 to-fuchsia-600 text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur ring-2 ring-white/40 flex items-center justify-center text-xl font-extrabold flex-shrink-0">
                            {user.name?.[0]?.toUpperCase() || '👤'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm truncate">{user.name}</p>
                            <p className="text-xs text-white/85 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <DropdownLink to="/profile" onClick={() => setOpenUser(false)} icon="👤" label="My Profile" />
                        <DropdownLink to="/orders"  onClick={() => setOpenUser(false)} icon="📦" label="My Orders" />
                        <DropdownLink to="/wishlist" onClick={() => setOpenUser(false)} icon="❤" label="My Wishlist" />
                        {user.isAdmin && (
                          <>
                            <div className="my-1.5 border-t border-gray-100" />
                            <DropdownLink
                              to="/admin"
                              onClick={() => setOpenUser(false)}
                              icon="⚙"
                              label="Admin Dashboard"
                              accent
                            />
                          </>
                        )}
                        <div className="my-1.5 border-t border-gray-100" />
                        <button
                          onClick={() => { logout(); setOpenUser(false); }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600 transition active:scale-[0.98]"
                        >
                          <span className="text-lg">🚪</span>
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Logged-out header */}
                      <div className="px-5 py-5 bg-gradient-to-br from-primary-500 via-pink-500 to-fuchsia-600 text-white text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-white/25 backdrop-blur ring-2 ring-white/40 flex items-center justify-center text-2xl mb-2">
                          👋
                        </div>
                        <p className="font-bold text-base">Welcome to Talle Furniture Mart</p>
                        <p className="text-xs text-white/85 mt-0.5">Sign in for orders, wishlist & deals</p>
                      </div>
                      <div className="p-3 space-y-2">
                        <Link
                          to="/login"
                          onClick={() => setOpenUser(false)}
                          className="block w-full text-center bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-lg transition active:scale-[0.98]"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setOpenUser(false)}
                          className="block w-full text-center border-2 border-gray-200 hover:border-primary-500 hover:text-primary-500 font-semibold py-2.5 rounded-lg transition active:scale-[0.98]"
                        >
                          Create Account
                        </Link>
                      </div>
                    </>
                  )}
                  </div>
                </>
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
        <div className="md:hidden px-4 pb-2.5">
          <form onSubmit={handleSearch} className="relative">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search chairs..."
              className="w-full border-2 border-primary-500 rounded-full pl-4 pr-12 py-2 focus:outline-none"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary-500 text-white p-2 rounded-full">
              <FiSearch size={14} />
            </button>
          </form>
        </div>

        {/* Mobile-only horizontal category strip — quick shortcuts under
            the search bar so phone users don't have to open the hamburger
            for the most common destinations. Mirrors the Flipkart /
            Myntra / Meesho mobile pattern. Hidden on md+ where the full
            categories nav is visible. */}
        <nav className="md:hidden border-t bg-gradient-to-r from-primary-50 via-pink-50 to-amber-50">
          <div
            className="flex items-center gap-1 overflow-x-auto px-3 py-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
            aria-label="Quick categories"
          >
            <MobileChip to="/shop?discount=true" highlight>🔥 50% Off</MobileChip>
            <MobileChip to="/shop?bestSeller=true">⭐ Best Sellers</MobileChip>
            <MobileChip to="/shop?newArrival=true">✨ New</MobileChip>
            <MobileChip to="/chair-repair">🔧 Repair</MobileChip>
            <MobileChip to="/shop?category=Executive">💼 Executive</MobileChip>
            <MobileChip to="/shop?category=Ergonomic">🪑 Ergonomic</MobileChip>
            <MobileChip to="/shop?category=Premium">✨ Premium</MobileChip>
            <MobileChip to="/shop?category=Gaming">🎮 Gaming</MobileChip>
          </div>
        </nav>
      </div>

      {/* Categories nav — simple centred flex row. */}
      <nav className="hidden md:block border-b bg-gray-50 relative" onMouseLeave={() => setOpenDropdown(null)}>
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
          <ul className="flex items-center gap-1 text-sm font-semibold flex-nowrap justify-center">
            <NavItem to="/" label={<span className="inline-flex items-center gap-1"><FiHome size={14} /> Home</span>} end />
            <NavItem to="/shop" label="All Chairs" />
            <NavItem to="/chair-repair" label="🔧 Repair" />
            <NavItem to="/shop?discount=true" label="🔥 50% Off" highlight />
            <DropdownTrigger label="Clients" active={openDropdown === 'clients'} onHover={() => setOpenDropdown('clients')} />
            <DropdownTrigger label="Category" active={openDropdown === 'category'} onHover={() => setOpenDropdown('category')} />
            <DropdownTrigger label="Material" active={openDropdown === 'material'} onHover={() => setOpenDropdown('material')} />
            <NavItem to="/shop?category=Premium" label="Premium" />
            <NavItem to="/shop?bestSeller=true" label="⭐ Best Sellers" />
            <NavItem to="/shop?newArrival=true" label="✨ New Arrivals" />
          </ul>
        </div>

        {/* Mega menus */}
        {openDropdown === 'clients' && (
          <div className="absolute left-0 right-0 top-full bg-white shadow-xl border-t z-40 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {/* Header — matches the Category dropdown's "Shop By Department"
                  treatment: bold large title on the left, primary-coloured
                  "view all" link on the right. */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Companies We Manufacture For</h3>
                <Link
                  to="/about"
                  onClick={() => setOpenDropdown(null)}
                  className="text-primary-500 hover:underline text-sm font-medium"
                >
                  Read our story →
                </Link>
              </div>
              {/* Industry-grouped columns. Each group has a header (emoji +
                  bold name) followed by a list of clients underneath — same
                  shape as the Category mega-menu's department columns. */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
                {clientGroups.map((g) => (
                  <div key={g.name}>
                    <div className="flex items-center gap-2 font-bold text-gray-900 mb-2">
                      <span className="text-base">{g.emoji}</span>
                      <span className="text-sm leading-tight">{g.name}</span>
                    </div>
                    <ul className="space-y-1.5 pl-1">
                      {g.items.map((c) => (
                        <li key={c.name}>
                          <Link
                            to="/about"
                            onClick={() => setOpenDropdown(null)}
                            className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-primary-500 hover:underline transition"
                          >
                            <span className={`${c.color} w-2 h-2 rounded-full flex-shrink-0`} />
                            {c.name}
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

        {openDropdown === 'category' && (
          <div className="absolute left-0 right-0 top-full bg-white shadow-xl border-t z-40 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Shop By Department</h3>
                <Link
                  to="/shop"
                  onClick={() => setOpenDropdown(null)}
                  className="text-primary-500 hover:underline text-sm font-medium"
                >
                  View all chairs →
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

        {openDropdown === 'material' && (
          <div className="absolute left-0 right-0 top-full bg-white shadow-xl border-t z-40 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {/* Header — matches the Category dropdown: bold lg title on
                  left + primary-coloured "view all" link on the right. */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Shop By Material</h3>
                <Link
                  to="/shop"
                  onClick={() => setOpenDropdown(null)}
                  className="text-primary-500 hover:underline text-sm font-medium"
                >
                  View all chairs →
                </Link>
              </div>
              {/* Grouped material columns — Soft & Breathable / Premium
                  Upholstery / Solid Frame. Same shape as the Category
                  mega-menu's department columns. */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                {materialGroups.map((g) => (
                  <div key={g.name}>
                    <div className="flex items-center gap-2 font-bold text-gray-900 mb-2">
                      <span className="text-base">{g.emoji}</span>
                      <span className="text-sm leading-tight">{g.name}</span>
                    </div>
                    <ul className="space-y-1.5 pl-1">
                      {g.items.map((m) => (
                        <li key={m.name}>
                          <Link
                            to={`/shop?material=${encodeURIComponent(m.name)}`}
                            onClick={() => setOpenDropdown(null)}
                            className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-primary-500 hover:underline transition"
                          >
                            <span className="text-sm">{m.emoji}</span>
                            {m.name}
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
              <p className="text-lg font-extrabold text-gray-900">Talle Furniture Menu</p>
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
              <li><Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2 py-2.5 px-2 rounded font-semibold hover:bg-gray-50 transition"><FiHome size={16} /> Home</Link></li>
              <li><Link to="/shop" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded font-semibold hover:bg-gray-50 transition">All Chairs</Link></li>
              <li><Link to="/chair-repair" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded font-semibold hover:bg-gray-50 transition">🔧 Repair Service</Link></li>
              <li><Link to="/shop?discount=true" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded text-primary-500 font-semibold hover:bg-primary-50 transition">🔥 Up to 50% Off</Link></li>
              <li><Link to="/shop?bestSeller=true" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded hover:bg-gray-50 transition">⭐ Best Sellers</Link></li>
              <li><Link to="/shop?newArrival=true" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded hover:bg-gray-50 transition">✨ New Arrivals</Link></li>
              <li><Link to="/shop?category=Premium" onClick={closeMobileMenu} className="block py-2.5 px-2 rounded hover:bg-gray-50 transition">✨ Premium</Link></li>

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

              {/* Collapsible: Clients */}
              <li>
                <button
                  type="button"
                  onClick={() => toggleMobileSection('clients')}
                  aria-expanded={openMobileSection === 'clients'}
                  className="w-full flex items-center justify-between py-2.5 px-2 rounded font-semibold border-t hover:bg-gray-50 transition"
                >
                  <span>Our Clients</span>
                  <FiChevronDown size={18} className={`transition-transform duration-300 ease-out ${openMobileSection === 'clients' ? 'rotate-180 text-primary-500' : 'text-gray-500'}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${openMobileSection === 'clients' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <ul className="overflow-hidden pl-2 grid grid-cols-2 gap-1">
                    {clients.map((c) => (
                      <li key={c.name}>
                        <Link
                          to="/about"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 py-2 px-2 rounded text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition"
                        >
                          <span className={`${c.color} w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>{c.name[0]}</span>
                          <span className="truncate">{c.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>

              {/* Collapsible: Shop by Material */}
              <li>
                <button
                  type="button"
                  onClick={() => toggleMobileSection('materials')}
                  aria-expanded={openMobileSection === 'materials'}
                  className="w-full flex items-center justify-between py-2.5 px-2 rounded font-semibold border-t hover:bg-gray-50 transition"
                >
                  <span>Shop by Material</span>
                  <FiChevronDown size={18} className={`transition-transform duration-300 ease-out ${openMobileSection === 'materials' ? 'rotate-180 text-primary-500' : 'text-gray-500'}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${openMobileSection === 'materials' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <ul className="overflow-hidden pl-2 grid grid-cols-2 gap-1">
                    {materialList.map((m) => (
                      <li key={m.name}>
                        <Link
                          to={`/shop?material=${encodeURIComponent(m.name)}`}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 py-2 px-2 rounded text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition"
                        >
                          <span className="text-base">{m.emoji}</span>
                          <span>{m.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>

            </ul>
          </div>
        </aside>
      </div>
    </header>
  );
}

function NavItem({ to, label, highlight, end }) {
  return (
    <li className="flex-shrink-0">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `relative inline-block whitespace-nowrap px-3 py-3 transition group ${
            isActive ? 'text-primary-500' : 'text-gray-700 hover:text-primary-500'
          } ${highlight ? 'text-primary-500 font-bold' : ''}`
        }
      >
        {({ isActive }) => (
          <>
            <span className={highlight ? 'animate-pulse' : ''}>{label}</span>
            {/* Animated underline — full-width when active, hover-grows from
                center when inactive. Skipped on highlight items so the red
                pulse stays the focus there. */}
            {!highlight && (
              <span
                className={`absolute left-3 right-3 -bottom-px h-[2px] bg-primary-500 transform origin-center transition-transform duration-300 ${
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
                aria-hidden
              />
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

function DropdownTrigger({ label, active, onHover }) {
  return (
    <li onMouseEnter={onHover} className="relative flex-shrink-0">
      <button
        className={`inline-flex items-center gap-1 whitespace-nowrap px-3 py-3 transition group ${
          active ? 'text-primary-500' : 'text-gray-700 hover:text-primary-500'
        }`}
      >
        {label}
        <FiChevronDown
          size={14}
          className={`transition-transform duration-300 ${active ? 'rotate-180' : ''}`}
        />
        {/* Same animated underline as NavItem so dropdowns visually match */}
        <span
          className={`absolute left-3 right-3 -bottom-px h-[2px] bg-primary-500 transform origin-center transition-transform duration-300 ${
            active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
          }`}
          aria-hidden
        />
      </button>
    </li>
  );
}

// Compact pill rendered in the mobile-only category strip. Highlight
// variant tints red for sale items.
function MobileChip({ to, children, highlight, purple }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center gap-1 flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition active:scale-95 ${
          highlight
            ? isActive
              ? 'bg-primary-500 text-white shadow'
              : 'bg-white border border-primary-200 text-primary-600 hover:bg-primary-500 hover:text-white hover:border-primary-500'
            : purple
              ? isActive
                ? 'bg-purple-600 text-white shadow'
                : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
              : isActive
                ? 'bg-gray-900 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

// Single row inside the user dropdown — bigger tap target, hover lift,
// chevron on the right that subtly nudges on hover. `accent` styles it as
// the admin entry-point.
function DropdownLink({ to, onClick, icon, label, accent }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition active:scale-[0.98] ${
        accent
          ? 'text-primary-600 bg-primary-50/70 hover:bg-primary-100'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      <FiChevronDown
        size={14}
        className="-rotate-90 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition"
      />
    </Link>
  );
}
