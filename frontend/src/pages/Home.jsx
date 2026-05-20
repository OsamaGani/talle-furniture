import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import FollowUs from '../components/FollowUs';
import NewsletterForm from '../components/NewsletterForm';
import StatsCounter from '../components/StatsCounter';
import BrandMarquee from '../components/BrandMarquee';
import VideoShowcase from '../components/VideoShowcase';
import Reveal from '../components/Reveal';
import { FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiArrowRight, FiPhone, FiPackage, FiChevronLeft, FiChevronRight, FiZap } from 'react-icons/fi';
import SEO from '../components/SEO';
import ShopByAge from '../components/ShopByAge';
import RecentlyViewed from '../components/RecentlyViewed';
import { ProductRowSkeleton } from '../components/ProductCardSkeleton';
// FiShield, FiRefreshCw, FiHeadphones used in the USP trust strip below

// Editorial / lifestyle hero — full-bleed interior photography with a
// dark gradient overlay on the left so a magazine-style amber eyebrow +
// serif headline + sans subtitle + dual CTA stack stays readable. Each
// slide is the same shape so the carousel reads as one furniture line.
const heroSlides = [
  {
    eyebrow: 'NEW SEASON',
    title: 'Furniture that grows with your home',
    subtitle: 'Discover handcrafted pieces in solid wood, mesh, leather and warm metals — made in our Saki Naka workshop.',
    primaryCta: 'SHOP THE COLLECTION',
    primaryLink: '/shop',
    secondaryCta: 'OUR STORY',
    secondaryLink: '/about',
    // Wide interior lifestyle shot — living room with sofa, side table,
    // wall art. Keeps the chair business in a "home setting" frame.
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=85&auto=format&fit=crop',
  },
  {
    eyebrow: 'MADE TO LAST',
    title: 'Sofas built for everyday life',
    subtitle: 'Kiln-dried frames, high-resilience foam, and removable covers. 5-year warranty on every Talle build.',
    primaryCta: 'SHOP THE COLLECTION',
    primaryLink: '/shop?category=3-Seater Sofa',
    secondaryCta: 'OUR STORY',
    secondaryLink: '/about',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1920&q=85&auto=format&fit=crop',
  },
  {
    eyebrow: 'TALLE SPECIALTY',
    title: 'Expert chair repair, at your door',
    subtitle: 'Hydraulic replacement, reupholstery, wheel & base fix. Doorstep pickup across Mumbai. 6-month warranty.',
    primaryCta: 'BOOK SERVICE',
    primaryLink: '/chair-repair',
    secondaryCta: 'CALL +91 93261 66875',
    secondaryLink: 'tel:+919326166875',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1920&q=85&auto=format&fit=crop',
  },
];

const sideCards = [
  {
    eyebrow: 'WEEKEND DEAL',
    title: 'Recliners up to 30% Off',
    subtitle: 'Single & multi-seater recliners with manual and electric mechanisms.',
    link: '/shop?category=Recliners',
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600',
    bg: 'bg-gradient-to-br from-amber-600 to-orange-800',
  },
  {
    eyebrow: 'JUST LANDED',
    title: 'Banquet & Event Chairs',
    subtitle: 'Tiffany, Chiavari & stackable banquet chairs for weddings, halls and hotels.',
    link: '/shop?category=Banquet Chairs',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600',
    bg: 'bg-gradient-to-br from-purple-500 to-fuchsia-700',
  },
];

// Fallback "Shop By Category" tile list — used only if /api/categories
// fails or no category has featuredOnHome=true. Once the admin ticks the
// "Feature on Homepage" toggle on /admin/categories the rail switches to
// the live DB-driven list (filtered + sorted by homeOrder).
const fallbackHomeCategories = [
  { name: 'Executive Chairs',     image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400' },
  { name: 'Premium / Ergohuman',  image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400' },
  { name: 'Training Room Chairs', image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=400' },
  { name: 'Tandem Seating',       image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400' },
  { name: 'Recliners',            image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400' },
  { name: 'L-Shaped Couch',       image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400' },
  { name: 'Wooden Dining Tables', image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400' },
  { name: 'Office Desks',         image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400' },
];

// Trusted-by client list — real B2B customers we've manufactured for.
// (We do our own manufacturing under the Talle brand, so this section
// showcases CUSTOMERS, not brands we resell.)
const homeClients = [
  { name: 'WeWork',           color: 'from-slate-800 to-slate-950',     icon: '🏢', tag: 'Coworking' },
  { name: 'Roller Bearing',   color: 'from-amber-600 to-orange-800',    icon: '⚙',  tag: 'Industrial' },
  { name: 'Upstep Academy',   color: 'from-blue-600 to-indigo-800',     icon: '🎓', tag: 'Education' },
  { name: 'Respo Financial',  color: 'from-emerald-600 to-green-800',   icon: '💼', tag: 'Finance' },
  { name: 'Coworking Spaces', color: 'from-purple-500 to-fuchsia-700',  icon: '🪑', tag: '50+ partners' },
  { name: 'Coaching Hubs',    color: 'from-rose-500 to-pink-700',       icon: '📚', tag: '100+ centres' },
  { name: 'Restaurants',      color: 'from-orange-500 to-red-700',      icon: '🍽',  tag: 'Mumbai-wide' },
  { name: 'Banquet Halls',    color: 'from-yellow-500 to-amber-700',    icon: '🎉', tag: 'Event spaces' },
  { name: 'Mumbai Offices',   color: 'from-cyan-600 to-teal-800',       icon: '🏛',  tag: '200+ sites' },
  { name: '& Many More',      color: 'from-gray-600 to-gray-900',       icon: '✨', tag: 'Talk to us' },
];

// Read homepage product cache from localStorage. Used to render the page
// instantly on repeat visits while a fresh fetch happens in the background.
// v2 = post-rebrand to Talle Furniture Mart. Bumping the key invalidates
// the previous toy-mall caches sitting in returning visitors' browsers.
const HOME_CACHE_KEY = 'tfm_home_v2';
const HOME_CACHE_TTL = 5 * 60 * 1000; // 5 min — long enough to feel instant, short enough to stay fresh

function readHomeCache() {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || (Date.now() - obj.savedAt) > HOME_CACHE_TTL) return null;
    return obj.data;
  } catch { return null; }
}
function writeHomeCache(data) {
  try {
    localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch { /* localStorage full or disabled — ignore */ }
}

export default function Home() {
  // Hydrate from cache on first render so repeat visitors see content
  // immediately instead of a spinner waiting for the slow Render API.
  const cached = readHomeCache();
  const [featured, setFeatured] = useState(cached?.featured || []);
  const [bestSellers, setBestSellers] = useState(cached?.bestSellers || []);
  const [newArrivals, setNewArrivals] = useState(cached?.newArrivals || []);
  const [todaysDeals, setTodaysDeals] = useState(cached?.todaysDeals || []);
  // Admin-controlled "Shop By Category" tiles. Falls back to the hardcoded
  // list (above) until admin marks categories as featuredOnHome in
  // /admin/categories. Cached alongside the product rails so repeat visits
  // render instantly without waiting for the API round-trip.
  const [homeCategories, setHomeCategories] = useState(cached?.homeCategories || fallbackHomeCategories);
  // "loading" only applies when there's no cache to fall back on. With
  // cache, we never show a blocking loader — we just refresh in the
  // background and the user sees the new data appear.
  const [loading, setLoading] = useState(!cached);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [a, b, c, d, cat] = await Promise.all([
          API.get('/products?featured=true&limit=8'),
          API.get('/products?bestSeller=true&limit=8'),
          API.get('/products?newArrival=true&limit=8'),
          API.get('/products?onDeal=true&sort=price-asc&limit=8'),
          // Pull the full category list and filter client-side. Light enough
          // (one fetch, ~3 KB) that a dedicated endpoint isn't worth the
          // extra route. Sorted by homeOrder ascending, capped at 8 tiles.
          API.get('/categories'),
        ]);
        const featuredCats = (cat.data || [])
          .filter((c) => c.featuredOnHome)
          .sort((x, y) => (x.homeOrder ?? 999) - (y.homeOrder ?? 999))
          .slice(0, 8)
          .map((c) => ({ name: c.name, image: c.image }));
        // Only switch away from the hardcoded fallback if the admin has
        // actually configured some homepage tiles — otherwise leave the
        // demo grid visible so a fresh install doesn't show a blank rail.
        const liveHomeCategories = featuredCats.length > 0 ? featuredCats : fallbackHomeCategories;

        const fresh = {
          featured: a.data.products,
          bestSellers: b.data.products,
          newArrivals: c.data.products,
          todaysDeals: d.data.products,
          homeCategories: liveHomeCategories,
        };
        setFeatured(fresh.featured);
        setBestSellers(fresh.bestSellers);
        setNewArrivals(fresh.newArrivals);
        setTodaysDeals(fresh.todaysDeals);
        setHomeCategories(fresh.homeCategories);
        writeHomeCache(fresh);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // No early bail-out. Skeleton placeholders inside <Section /> handle the
  // loading state per-rail so the hero, brand strip, and other static
  // content render right away instead of being blocked by a full-page loader.

  const s = heroSlides[slide];
  const next = () => setSlide((s) => (s + 1) % heroSlides.length);
  const prev = () => setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length);

  return (
    <div>
      <SEO
        title="Talle Furniture Mart — Office Chair Manufacturer & Repair, Mumbai"
        description="Mumbai chair manufacturer & repair workshop in Saki Naka. Office, ergonomic, banquet, dining, sofas & tables — custom orders, doorstep repair, reupholstery. Trusted by WeWork & 200+ Mumbai businesses."
        path="/"
        keywords="office chair manufacturer mumbai, chair repair sakinaka, chair manufacturer mumbai, ergonomic chair manufacturer, executive chair supplier mumbai, bulk office chairs mumbai, chair reupholstery mumbai, banquet chair manufacturer, restaurant chair supplier, customised office chair, wooden dining table mumbai, conference table supplier, talle furniture mart, b2b chair supplier mumbai, hydraulic chair replacement, coworking chair supplier, training room chair, tandem seating supplier, d2d chair service mumbai"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'url': 'https://tallefurnituremart.com',
          'name': 'Talle Furniture Mart',
          'description': 'Own-manufactured office, ergonomic, banquet, dining chairs + sofas & tables. Expert chair repair & reupholstery in Mumbai.',
          'potentialAction': {
            '@type': 'SearchAction',
            'target': { '@type': 'EntryPoint', 'urlTemplate': 'https://tallefurnituremart.com/shop?keyword={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      {/* Hero — editorial / lifestyle carousel.
          Full-bleed interior photo + dark left-side gradient for text
          contrast. Amber eyebrow + Playfair serif headline + sans
          subtitle + two rectangular CTAs. Mobile gets a deeper bottom
          overlay so text reads against busier photos. */}
      <section className="bg-black">
        <div className="relative overflow-hidden group min-h-[460px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[640px] xl:min-h-[680px]">
          {heroSlides.map((slide_, i) => {
            const isActive = i === slide;
            const isExternal = (slide_.secondaryLink || '').startsWith('tel:') || (slide_.secondaryLink || '').startsWith('mailto:');
            return (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                aria-hidden={!isActive}
              >
                {/* Background lifestyle photo. Slow-zoom on the active
                    slide gives a subtle Ken-Burns feel without being
                    distracting. eager-load only the first slide so LCP
                    isn't blocked by lazy decoding on the rest. */}
                <img
                  src={slide_.image}
                  alt={slide_.title}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                />
                {/* Two overlays:
                    1. Left-to-right dark gradient — keeps the text panel
                       readable while letting the right ~40% of the photo
                       breathe (matches the reference screenshots).
                    2. Bottom-up dark fade — guarantees the dots + lower
                       CTA stay legible on busy photos / on mobile where
                       text stretches further down the frame. */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Content block — left-aligned, max-width capped so on
                    ultra-wide it doesn't smear across the whole hero. */}
                <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-20 xl:px-28 py-12">
                  <div className={`max-w-xl text-white ${isActive ? 'animate-fadeUp' : ''}`}>
                    <span className="inline-block text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-amber-300 mb-4 sm:mb-6">
                      {slide_.eyebrow}
                    </span>
                    {/* Serif display headline. Playfair Display from Google
                        Fonts (loaded in index.html) — falls back to Georgia
                        if the web font hasn't finished loading. */}
                    <h1 className="font-display font-medium leading-[1.05] text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5rem] drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                      {slide_.title}
                    </h1>
                    <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-white/90 max-w-md leading-relaxed">
                      {slide_.subtitle}
                    </p>
                    <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                      <Link
                        to={slide_.primaryLink}
                        className="inline-flex items-center justify-center bg-white hover:bg-amber-50 text-gray-900 font-semibold text-xs sm:text-sm tracking-[0.15em] px-6 sm:px-8 py-3 sm:py-3.5 transition shadow-lg hover:shadow-xl"
                      >
                        {slide_.primaryCta}
                      </Link>
                      {slide_.secondaryCta && (
                        isExternal ? (
                          <a
                            href={slide_.secondaryLink}
                            className="inline-flex items-center justify-center border border-white/80 hover:bg-white hover:text-gray-900 text-white font-semibold text-xs sm:text-sm tracking-[0.15em] px-6 sm:px-8 py-3 sm:py-3.5 transition"
                          >
                            {slide_.secondaryCta}
                          </a>
                        ) : (
                          <Link
                            to={slide_.secondaryLink}
                            className="inline-flex items-center justify-center border border-white/80 hover:bg-white hover:text-gray-900 text-white font-semibold text-xs sm:text-sm tracking-[0.15em] px-6 sm:px-8 py-3 sm:py-3.5 transition"
                          >
                            {slide_.secondaryCta}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Arrows — minimal, hover-only on desktop, hidden on touch
              (swipe + dots handle navigation there). */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white w-11 h-11 rounded-full items-center justify-center transition lg:opacity-0 lg:group-hover:opacity-100"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white w-11 h-11 rounded-full items-center justify-center transition lg:opacity-0 lg:group-hover:opacity-100"
          >
            <FiChevronRight size={20} />
          </button>

          {/* Slide dots — bottom-centre, thin pill style that matches
              the reference screenshots (active dot is wider rectangle). */}
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-[3px] rounded-full transition-all ${
                  i === slide ? 'w-10 bg-white' : 'w-6 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* USP strip — Amazon/Flipkart style trust signals right under hero */}
      <section className="border-b bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5 grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
          <Reveal direction="up" delay={0}>
            <UspBadge icon={<FiTruck />}      title="D2D Mumbai · Pan-India" desc="Door-to-door + free over ₹2,999" color="bg-blue-50 text-blue-600" />
          </Reveal>
          <Reveal direction="up" delay={80}>
            <UspBadge icon={<FiShield />}     title="5-Year Warranty"        desc="On all Talle-branded chairs"    color="bg-emerald-50 text-emerald-600" />
          </Reveal>
          <Reveal direction="up" delay={160}>
            <UspBadge icon={<FiRefreshCw />}  title="Doorstep Repair"        desc="Pickup, fix, return in Mumbai"  color="bg-orange-50 text-orange-600" link="/contact" />
          </Reveal>
          <Reveal direction="up" delay={240}>
            <UspBadge icon={<FiHeadphones />} title="Talk to a Human"        desc="Call +91 93261 66875"           color="bg-purple-50 text-purple-600" link="/contact" />
          </Reveal>
          <Reveal direction="up" delay={320}>
            <UspBadge icon={<FiPackage />}    title="Bulk / Wholesale"       desc="Best rates for offices & halls" color="bg-pink-50 text-pink-600" link="/wholesale" />
          </Reveal>
        </div>
      </section>

      {/* Brand marquee */}
      <BrandMarquee />

      {/* Shop by Category */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <Reveal>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold">Shop By Category</h2>
              <p className="text-gray-600">Find the perfect chair for every room, office and event</p>
            </div>
            <Link to="/shop" className="text-primary-500 hover:underline text-sm font-medium">View All →</Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {homeCategories.map((c, i) => (
            <Reveal key={c.name} delay={i * 60}>
              <Link to={`/shop?category=${encodeURIComponent(c.name)}`} className="text-center group block">
                <div className="aspect-square rounded-full bg-gray-50 overflow-hidden mb-2 border-2 border-transparent group-hover:border-primary-500 transition group-hover:shadow-xl">
                  <img
                    src={c.image || c.img}
                    alt={c.name}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('flex','items-center','justify-center','text-3xl'); e.target.parentElement.textContent = '🪑'; }}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                </div>
                <p className="text-sm font-medium group-hover:text-primary-500">{c.name}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Shop by Age */}
      <ShopByAge />

      {/* Featured */}
      <Section title="Featured Chairs" subtitle="Hand-picked favorites" link="/shop?featured=true" products={featured} loading={loading} />

      {/* Today's Deals — only renders if admin has flagged products onDeal */}
      {todaysDeals.length > 0 && (
        <Section
          title={<span className="inline-flex items-center gap-2"><FiZap className="text-orange-500" /> Today's Deals</span>}
          subtitle="Hand-picked deals"
          link="/shop?onDeal=true"
          products={todaysDeals}
          bg="bg-gradient-to-br from-orange-50 to-amber-50"
        />
      )}

      {/* Best Sellers */}
      <Section title="Best Sellers" subtitle="Most loved by customers" link="/shop?bestSeller=true" products={bestSellers} bg="bg-gray-50" loading={loading} />

      {/* Recently Viewed — empty section returns null if no history yet */}
      <RecentlyViewed />

      {/* Animated stats counter */}
      <StatsCounter />

      {/* Video showcase */}
      <VideoShowcase />

      {/* Wholesale promo banner */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <Link to="/wholesale" className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 via-pink-600 to-primary-500 text-white p-8 md:p-12 hover:shadow-2xl transition group">
          <div className="grid md:grid-cols-2 gap-6 items-center relative z-10">
            <div>
              <span className="inline-block bg-yellow-400 text-gray-900 text-xs font-extrabold px-3 py-1 rounded-full mb-3">FOR SHOPS &amp; RESELLERS</span>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                Open a <span className="text-yellow-300">Wholesale</span> Account
              </h2>
              <p className="mt-3 text-lg opacity-95">Best rates for offices, banquet halls, restaurants and resellers. Free Mumbai delivery on bulk orders. GST invoices. Custom branding available.</p>
              <div className="flex flex-wrap gap-3 mt-5">
                <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold">✓ Bulk pricing</span>
                <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold">✓ GST invoice</span>
                <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold">✓ Custom branding</span>
              </div>
              <span className="inline-flex items-center gap-2 mt-6 bg-white text-purple-700 group-hover:bg-yellow-300 group-hover:text-gray-900 font-bold px-6 py-3 rounded-lg transition">
                Learn More <FiArrowRight />
              </span>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="text-9xl">🛍</div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </Link>
      </section>

      {/* Multi-card promo section (main + 2 side cards) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Main big card */}
          <Reveal direction="left" className="lg:col-span-2">
          <Link
            to="/shop?discount=true"
            className="block relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition group min-h-[260px] sm:min-h-[320px] md:min-h-[380px] bg-gradient-to-br from-primary-500 via-pink-500 to-purple-600 text-white"
          >
            <img src="https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=1600" className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-30 group-hover:scale-105 transition duration-500" alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
            <div className="relative z-10 h-full flex flex-col justify-center p-6 sm:p-10 md:p-14 max-w-xl">
              <span className="inline-block w-fit bg-yellow-300 text-gray-900 text-[10px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full mb-2 sm:mb-4 tracking-wide">🔥 UP TO 50% OFF</span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold drop-shadow-lg leading-tight">Mega Chair Sale</h2>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-white/95">Office, Gaming, Banquet, Recliners — biggest discounts of the year</p>
              <span className="inline-flex items-center gap-2 mt-4 sm:mt-6 w-fit bg-white text-gray-900 hover:bg-yellow-300 font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm sm:text-base shadow-lg group-hover:scale-105 transition">
                Shop the Sale <FiArrowRight />
              </span>
            </div>
          </Link>
          </Reveal>

          {/* Two side cards */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            {sideCards.map((card, i) => (
              <Reveal key={card.title} direction="right" delay={i * 120}>
              <Link
                to={card.link}
                className={`block ${card.bg} text-white rounded-xl sm:rounded-2xl overflow-hidden relative group shadow-lg hover:shadow-2xl transition min-h-[140px] sm:min-h-[160px] lg:min-h-[182px]`}
              >
                <img src={card.image} className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-110 transition duration-500" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="relative z-10 h-full flex flex-col justify-between p-3 sm:p-5">
                  <div>
                    <span className="inline-block bg-yellow-300 text-gray-900 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded mb-1.5 sm:mb-2 tracking-wide">{card.eyebrow}</span>
                    <h3 className="text-sm sm:text-lg md:text-xl font-extrabold drop-shadow leading-tight">{card.title}</h3>
                    <p className="text-[11px] sm:text-sm opacity-95 mt-0.5 sm:mt-1 line-clamp-2">{card.subtitle}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold mt-1 sm:mt-2 group-hover:gap-2 transition-all">
                    Shop now <FiArrowRight size={12} />
                  </span>
                </div>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <Section title="New Arrivals" subtitle="Fresh on the shelves" link="/shop?newArrival=true" products={newArrivals} loading={loading} />

      {/* Our Clients — companies we manufacture chairs for */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-10 sm:py-14">
          <Reveal>
            <div className="text-center mb-8">
              <span className="inline-block bg-primary-100 text-primary-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wide">🤝 OUR CLIENTS</span>
              <h2 className="text-2xl md:text-4xl font-extrabold">Trusted by Mumbai's Best</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">We manufacture seating for coworking giants, financial firms, academies and 200+ Mumbai offices.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {homeClients.map((c, i) => (
              <Reveal key={c.name} delay={i * 50}>
                <Link
                  to="/about"
                  className={`group relative bg-gradient-to-br ${c.color} rounded-2xl overflow-hidden p-4 sm:p-5 text-white shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 block aspect-square sm:aspect-[4/3]`}
                >
                  {/* Decorative blob */}
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition duration-500"></div>
                  {/* Big icon */}
                  <div className="text-3xl sm:text-4xl md:text-5xl drop-shadow-md group-hover:scale-110 transition">{c.icon}</div>
                  {/* Client name + tag */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <p className="font-extrabold text-sm sm:text-base md:text-lg drop-shadow leading-tight">{c.name}</p>
                    <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-90">{c.tag}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter + Follow us */}
      <section className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Join the Talle Family</h2>
            <p className="text-gray-600 mb-4">Subscribe and get 10% off your first order plus exclusive deals on chairs &amp; service.</p>
            <NewsletterForm variant="light" source="home" />
          </div>
          <div>
            <FollowUs />
            <p className="text-sm text-gray-600 mt-3">Stay in the loop — new models, festive sales and chair-care tips.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function UspBadge({ icon, title, desc, color, link }) {
  const inner = (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-white rounded-lg transition cursor-default">
      <div className={`${color} w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-base sm:text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-[11px] sm:text-sm leading-tight truncate">{title}</p>
        <p className="text-[10px] sm:text-xs text-gray-500 leading-tight truncate">{desc}</p>
      </div>
    </div>
  );
  if (link) {
    return <Link to={link} className="cursor-pointer">{inner}</Link>;
  }
  return inner;
}

function PromoStrip({ icon, title, desc, link, cta, color }) {
  // Detect protocol URLs (tel:, mailto:, https:, etc.) — these need a real <a>,
  // not react-router's <Link> which would try to client-route to "/tel:..." and fail.
  const isExternal = /^(tel:|mailto:|sms:|https?:\/\/)/i.test(link || '');
  const className = "flex items-center gap-3 sm:gap-4 border rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-primary-300 transition group";
  const inner = (
    <>
      <div className={`${color} w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm sm:text-base truncate">{title}</p>
        <p className="text-[11px] sm:text-xs text-gray-500 truncate">{desc}</p>
      </div>
      <span className="hidden sm:inline text-xs text-primary-500 font-semibold group-hover:underline whitespace-nowrap">{cta} →</span>
    </>
  );

  if (isExternal) {
    const isHttp = /^https?:\/\//i.test(link);
    return (
      <a
        href={link}
        className={className}
        {...(isHttp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link to={link} className={className}>
      {inner}
    </Link>
  );
}

function Section({ title, subtitle, link, products, bg = '', loading = false }) {
  // Show skeletons while the first fetch is in flight; vanish entirely if
  // there's nothing to show after loading completes.
  if (!loading && !products?.length) return null;
  return (
    <section className={bg}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Reveal>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold">{title}</h2>
              <p className="text-gray-600">{subtitle}</p>
            </div>
            <Link to={link} className="text-primary-500 hover:underline text-sm font-medium">View All →</Link>
          </div>
        </Reveal>
        {loading && (!products || products.length === 0) ? (
          <ProductRowSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <Reveal key={p._id} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PromoCard({ title, text, cta, link, img, color }) {
  return (
    <Link to={link} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} text-white p-6 sm:p-10 md:p-14 min-h-[220px] sm:min-h-[280px] flex flex-col justify-between hover:shadow-2xl transition group`}>
      <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-30 group-hover:scale-105 transition duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent"></div>
      <div className="relative z-10 max-w-xl">
        <h3 className="text-2xl sm:text-3xl md:text-5xl font-extrabold drop-shadow-lg leading-tight">{title}</h3>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-white/95">{text}</p>
      </div>
      <span className="relative z-10 inline-flex items-center gap-2 mt-4 sm:mt-6 w-fit bg-white text-gray-900 hover:bg-yellow-300 font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm sm:text-base shadow-lg group-hover:scale-105 transition">
        {cta} <FiArrowRight />
      </span>
    </Link>
  );
}
