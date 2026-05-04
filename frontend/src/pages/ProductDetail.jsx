import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiShoppingCart, FiHeart, FiStar, FiTruck, FiShield, FiRefreshCw, FiChevronLeft, FiChevronRight, FiMapPin, FiCheckCircle, FiShare2, FiCheck, FiZap } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import { resolveImage } from '../utils/imageUrl';
import toast from 'react-hot-toast';
import SEO, { SITE_URL, SITE_NAME } from '../components/SEO';
import { addRecentlyViewed } from '../utils/recentlyViewed';
import { colorToBackground, isLightColor } from '../utils/colors';

export default function ProductDetail() {
  // Route param is "slug" but we accept any product identifier (slug or
  // legacy ObjectId) — the backend route resolves either.
  const { slug: id } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [related, setRelated] = useState({ similar: [], moreFromBrand: [], trending: [] });
  // Delivery check (Flipkart/Amazon style)
  const [pin, setPin] = useState('');
  const [pinCheck, setPinCheck] = useState(null); // { city, state, etaText } | { error }
  const [pinChecking, setPinChecking] = useState(false);


  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/products/${id}`);
      setProduct(data);
      // Don't auto-pick a colour. The customer should explicitly choose
      // their colour — that way the gallery starts clean (main images
      // only) and the variant photos only appear AFTER they tap a swatch.
      setSelectedColor('');
      // Default to the main hero image. If the product has no main image
      // (variants-only catalogue entry) fall back to product.images, then
      // any variant that has at least one image — so the gallery never
      // renders empty.
      const anyVariantImg = (data.colorVariants || []).find((v) => v.images?.length)?.images[0];
      setActiveImg(
        data.image ||
        data.images?.[0] ||
        anyVariantImg ||
        ''
      );
      // Remember this product so the homepage "Recently Viewed" rail picks it up.
      addRecentlyViewed(data);
    } catch (e) { toast.error('Product not found'); }
    finally { setLoading(false); }
  };

  // Fetch related products separately so the main page renders fast
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await API.get(`/products/${id}/related`);
        if (!cancelled) setRelated(data);
      } catch {
        if (!cancelled) setRelated({ similar: [], moreFromBrand: [], trending: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => { load(); window.scrollTo(0, 0); }, [id]);

  if (loading) return <Loader size="lg" />;
  if (!product) return <p className="text-center py-20">Not found</p>;

  // Resolve which colour variant the customer currently has selected (if any).
  const activeVariant = (product.colorVariants || []).find(
    (v) => v.color.toLowerCase() === (selectedColor || '').toLowerCase()
  );
  // Effective price + discount: prefer variant overrides when present,
  // fall back to the product's main values. Mirrors unitPriceFor() on the
  // server so what the customer sees == what they're charged.
  const effectiveBasePrice = (activeVariant && activeVariant.price > 0) ? activeVariant.price : product.price;
  const effectiveDiscount  = (activeVariant && activeVariant.discount > 0) ? activeVariant.discount : product.discount;
  const final = effectiveDiscount > 0
    ? +(effectiveBasePrice - (effectiveBasePrice * effectiveDiscount) / 100).toFixed(2)
    : effectiveBasePrice;
  const hasVariantOverride = !!(activeVariant && (activeVariant.price > 0 || activeVariant.discount > 0));

  // Gallery resolution — exclusive switch:
  //   • No colour picked → show main images (product.image + product.images)
  //   • Colour picked    → show ONLY that variant's images
  // The main image acts as the "cover" photo; once the customer commits
  // to a colour, the thumbnails switch fully to that colour's photos so
  // they're not distracted by the cover shot mixed in.
  const mainImages = [
    ...(product.image ? [product.image] : []),
    ...(product.images || []),
  ];
  // Dedupe in case product.image is also the first entry of product.images.
  const dedupedMain = [...new Set(mainImages)];
  let displayImages;
  if (activeVariant?.images && activeVariant.images.length > 0) {
    displayImages = activeVariant.images;
  } else {
    displayImages = dedupedMain;
  }
  // Final safety net: if a product has no main image AND no colour is
  // picked yet (admin only filled colour variants), borrow the first
  // photo we can find so the gallery never renders empty.
  if (displayImages.length === 0) {
    const anyVariantImg = (product.colorVariants || []).find((v) => v.images?.length)?.images[0];
    if (anyVariantImg) displayImages = [anyVariantImg];
  }
  // List of available colours — prefer the structured variants when present.
  const availableColors = (product.colorVariants && product.colorVariants.length > 0)
    ? product.colorVariants.map((v) => v.color)
    : (product.colors || []);

  const checkPin = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setPinCheck({ error: 'Enter a valid 6-digit PIN code' });
      return;
    }
    setPinChecking(true);
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await r.json();
      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0];
        const start = new Date(); start.setDate(start.getDate() + 4);
        const end = new Date();   end.setDate(end.getDate() + 7);
        const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        setPinCheck({ city: po.District, state: po.State, etaText: `${fmt(start)} – ${fmt(end)}` });
      } else {
        setPinCheck({ error: 'We don\'t deliver to this PIN yet' });
      }
    } catch {
      setPinCheck({ error: 'Could not check — try again in a moment' });
    } finally {
      setPinChecking(false);
    }
  };

  const sharePage = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text: product.description, url }); }
      catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Product link copied!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  // Pull a few highlight bullets from the description (split by commas /
  // semicolons / sentences). Falls back to category + age + brand triple.
  const highlights = (() => {
    const out = [];
    if (product.brand) out.push(`Brand: ${product.brand}`);
    if (product.category) out.push(`Category: ${product.category}`);
    if (product.ageGroup) out.push(`Recommended age: ${product.ageGroup}`);
    // Pull first comma-separated phrase from description
    const desc = product.description || '';
    const phrase = desc.split(/[,;]|\.\s/)[0]?.trim();
    if (phrase && phrase.length < 80 && phrase.length > 5) out.unshift(phrase);
    return out;
  })();

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await API.post(`/products/${id}/reviews`, { rating, comment });
      toast.success('Review submitted!');
      setComment('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // ----- SEO + Product structured data -----
  // Strip HTML and trim to a meta-description-friendly length so the
  // snippet Google shows isn't a wall of marketing copy.
  const cleanDesc = String(product.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const metaDesc = (cleanDesc || `Buy ${product.name} online at ${SITE_NAME} — best price in India, fast delivery, COD available.`).slice(0, 160);
  const productImages = (product.images && product.images.length ? product.images : [product.image])
    .filter(Boolean)
    .map((img) => resolveImage(img));
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: cleanDesc.slice(0, 5000) || product.name,
    image: productImages,
    sku: product._id,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug || product._id}`,
      priceCurrency: 'INR',
      price: final.toFixed(2),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
    ...(product.numReviews > 0 && product.rating > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(product.rating).toFixed(1),
        reviewCount: product.numReviews,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <SEO
        title={`${product.name}${product.brand ? ` — ${product.brand}` : ''} | Buy Online in India`}
        description={metaDesc}
        image={productImages[0]}
        path={`/product/${product.slug || product._id}`}
        type="product"
        jsonLd={productJsonLd}
      />
      <nav className="text-xs sm:text-sm text-gray-500 mb-4 flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-primary-500">Home</Link>
        <span>›</span>
        <Link to="/shop" className="hover:text-primary-500">Shop</Link>
        {product.category && <>
          <span>›</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-primary-500">{product.category}</Link>
        </>}
        <span>›</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-md">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-5 md:gap-8">
        {/* Images */}
        <div className="md:sticky md:top-32 md:self-start">
          {/* Image height capped on desktop so the price/CTA sit on the
              same screen as the photo. md:max-h-[380px] is the sweet spot
              — big enough to show product detail, small enough that the
              right column doesn't disappear below the fold on a 14-inch
              laptop screen. */}
          <div className="aspect-square max-h-[280px] sm:max-h-[360px] md:max-h-[380px] mx-auto md:max-w-[420px] border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-3 sm:p-4">
            {/* key on the active image URL forces React to remount the <img>,
                which re-runs the .animate-imgFade keyframe — gives a smooth
                opacity + tiny zoom-out cross-fade every time the customer
                taps a new colour swatch. */}
            <img
              key={activeImg || displayImages[0] || product._id}
              src={resolveImage(activeImg || displayImages[0])}
              alt={product.name}
              className="max-w-full max-h-full object-contain animate-imgFade"
            />
          </div>
          {displayImages.length > 1 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {displayImages.length} photos
                {activeVariant ? ` of ${activeVariant.color}` : ''} · click to preview
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {displayImages.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImg(img)}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className={`w-16 h-16 sm:w-20 sm:h-20 border-2 rounded-lg overflow-hidden flex-shrink-0 bg-white transition hover:scale-[1.04] animate-imgFade ${(activeImg || displayImages[0]) === img ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200 hover:border-primary-300'}`}
                    aria-label={`View image ${i + 1} of ${displayImages.length}`}
                  >
                    <img src={resolveImage(img)} className="w-full h-full object-contain p-1" alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile-only colour picker — sits right under the gallery so
              customers on phones don't have to scroll past the whole image
              and price block to find it. The desktop version below the
              price (in the info column) is hidden on mobile via md:block. */}
          {availableColors.length > 0 && (
            <div className="md:hidden mt-4 border rounded-lg p-3 bg-gray-50/50">
              <ColorSwatchPanel
                colors={availableColors}
                selectedColor={selectedColor}
                onSelect={(c) => {
                  setSelectedColor(c);
                  const v = (product.colorVariants || []).find(
                    (cv) => cv.color.toLowerCase() === c.toLowerCase()
                  );
                  const nextImg = (v?.images && v.images[0]) || product.image || product.images?.[0] || '';
                  setActiveImg(nextImg);
                }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500 uppercase">{product.brand}</p>
              <h1 className="text-base sm:text-lg md:text-xl font-bold mt-1">{product.name}</h1>
              {/* Short description preview right under the title — gives
                  customers the gist of the product without scrolling.
                  Capped at 3 lines so it doesn't push the price down on
                  small screens; the full description is still rendered
                  in its own section further down. */}
              {product.description && (
                <p className="text-sm text-gray-700 mt-2 leading-relaxed line-clamp-3">
                  {product.description.replace(/<[^>]+>/g, '')}
                </p>
              )}
            </div>
            <button
              onClick={() => toggleWishlist(product)}
              aria-label={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition
                ${isInWishlist(product._id)
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-primary-500 hover:text-primary-500'}`}
            >
              <FiHeart size={20} className={isInWishlist(product._id) ? 'fill-current' : ''} />
            </button>
          </div>
          {/* Rating row — Flipkart-style green pill + share */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {(product.rating || 0) > 0 && (
              <span className="bg-emerald-600 text-white text-sm font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                {(product.rating || 0).toFixed(1)} <FiStar className="fill-current" size={12} />
              </span>
            )}
            <span className="text-sm text-gray-600">
              {product.numReviews || 0} reviews
            </span>
            <button
              onClick={sharePage}
              className="ml-auto text-xs text-gray-500 hover:text-primary-500 inline-flex items-center gap-1 font-semibold"
            >
              <FiShare2 size={14} /> Share
            </button>
          </div>

          {/* Price block with savings — uses the colour-variant override
              when the customer has picked a coloured variant with its own
              price. effectiveBasePrice / effectiveDiscount are derived
              above; they fall back cleanly to the product-level values. */}
          <div className="mt-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">₹{final.toFixed(0)}</span>
              {effectiveDiscount > 0 && (
                <>
                  <span className="text-sm text-gray-400 line-through">₹{effectiveBasePrice.toFixed(0)}</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600">{effectiveDiscount}% off</span>
                </>
              )}
            </div>
            {effectiveDiscount > 0 && (
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                You save ₹{(effectiveBasePrice - final).toFixed(0)}
              </p>
            )}
            {hasVariantOverride && selectedColor && (
              <p className="text-[11px] text-primary-600 font-medium mt-0.5">
                Price for {selectedColor}
              </p>
            )}
            <p className="text-[11px] text-gray-500 mt-0.5">Inclusive of all taxes</p>
          </div>

          {product.wholesalePrice > 0 && product.wholesaleMinQty > 0 && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-purple-700">🛍 Wholesale Price: ₹{product.wholesalePrice.toFixed(2)} / unit</p>
              <p className="text-xs text-purple-600 mt-0.5">When you order {product.wholesaleMinQty}+ units (wholesale account required)</p>
            </div>
          )}

          {/* Stock indicator */}
          <div className="mt-3">
            {product.stock > 5 && (
              <p className="text-sm font-semibold text-emerald-600 inline-flex items-center gap-1.5">
                <FiCheckCircle size={14} /> In Stock
              </p>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-sm font-semibold text-orange-600 inline-flex items-center gap-1.5">
                <FiZap size={14} /> Hurry, only {product.stock} left!
              </p>
            )}
            {product.stock === 0 && (
              <p className="text-sm font-semibold text-red-600">Out of Stock</p>
            )}
          </div>

          {/* Desktop-only colour picker — sits in the right info column
              next to the price. Mobile users get the same panel rendered
              right under the image gallery (above this column) so the
              swatches are reachable without scrolling. */}
          {availableColors.length > 0 && (
            <div className="hidden md:block mt-4 border rounded-lg p-3 bg-gray-50/50">
              <ColorSwatchPanel
                colors={availableColors}
                selectedColor={selectedColor}
                onSelect={(c) => {
                  setSelectedColor(c);
                  const v = (product.colorVariants || []).find(
                    (cv) => cv.color.toLowerCase() === c.toLowerCase()
                  );
                  const nextImg = (v?.images && v.images[0]) || product.image || product.images?.[0] || '';
                  setActiveImg(nextImg);
                }}
              />
            </div>
          )}

          {/* Delivery PIN check — Flipkart/Amazon pattern */}
          <div className="mt-4 bg-gray-50 border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiMapPin className="text-primary-500" size={16} />
              <p className="text-sm font-bold">Check delivery</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinCheck(null); }}
                placeholder="Enter PIN code"
                maxLength={6}
                className="flex-1 min-w-0 px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={checkPin}
                disabled={pinChecking || pin.length !== 6}
                className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded transition"
              >
                {pinChecking ? '…' : 'Check'}
              </button>
            </div>
            {pinCheck?.error && (
              <p className="text-xs text-red-500 mt-2">{pinCheck.error}</p>
            )}
            {pinCheck?.etaText && (
              <div className="mt-3 space-y-1 text-xs">
                <p className="text-emerald-600 font-semibold inline-flex items-center gap-1.5">
                  <FiCheck size={12} /> Delivery available to {pinCheck.city}, {pinCheck.state}
                </p>
                <p className="text-gray-700">
                  <FiTruck className="inline mr-1.5 text-gray-400" size={12} />
                  Get it by <strong>{pinCheck.etaText}</strong>
                </p>
                <p className="text-gray-500">💵 Cash on Delivery available</p>
              </div>
            )}
          </div>

          {/* Highlights bullets */}
          {highlights.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold mb-2">Highlights</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {highlights.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <FiCheck className="text-emerald-500 mt-0.5 flex-shrink-0" size={14} />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          <div className="mt-4">
            <p className="text-sm font-bold mb-1.5">Description</p>
            <p className="text-gray-700 leading-relaxed text-sm">{product.description}</p>
          </div>

          {/* Specifications */}
          <div className="mt-4 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b">
              <p className="text-sm font-bold">Specifications</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <SpecRow label="Brand" value={product.brand} />
                <SpecRow label="Category" value={product.category} />
                {product.ageGroup && <SpecRow label="Recommended Age" value={product.ageGroup} />}
                <SpecRow label="Sold by" value="Toy Mall (verified seller)" />
                <SpecRow label="Country of Origin" value="India" />
              </tbody>
            </table>
          </div>

          {product.stock > 0 ? (
            <div className="mt-5 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <div className="flex items-center border border-gray-300 rounded h-8 text-xs">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-2 hover:bg-gray-50 h-full">−</button>
                <span className="px-2 font-semibold">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-2 hover:bg-gray-50 h-full">+</button>
              </div>
              <button
                onClick={() => {
                  // Require an explicit colour pick when the product has options —
                  // we no longer auto-select the first colour, so a missing pick
                  // means the customer didn't decide. Toast + abort.
                  if (availableColors.length > 0 && !selectedColor) {
                    toast.error('Please select a colour first');
                    return;
                  }
                  addToCart(product, qty, selectedColor || '');
                }}
                className="flex items-center justify-center gap-1 border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white text-xs font-semibold px-3 h-8 rounded transition"
              >
                <FiShoppingCart size={12} /> Add to Cart
              </button>
              <button
                onClick={() => {
                  if (availableColors.length > 0 && !selectedColor) {
                    toast.error('Please select a colour first');
                    return;
                  }
                  addToCart(product, qty, selectedColor || '');
                  navigate('/checkout');
                }}
                className="flex items-center justify-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-3 h-8 rounded transition"
              >
                ⚡ Buy Now
              </button>
            </div>
          ) : (
            <button disabled className="mt-6 bg-gray-300 text-gray-500 text-xs font-bold px-4 py-2 rounded cursor-not-allowed">
              Out of Stock
            </button>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-center pt-6 border-t">
            <Perk icon={<FiTruck />} text="Free Shipping over ₹999" />
            <Perk icon={<FiShield />} text="Secure Payment" />
            <Perk icon={<FiRefreshCw />} text="7-Day Returns" />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        {product.reviews?.length === 0 && <p className="text-gray-500">No reviews yet. Be the first to review!</p>}
        <div className="space-y-4">
          {product.reviews?.map((r) => (
            <div key={r._id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <strong>{r.name || 'Anonymous'}</strong>
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => <FiStar key={i} className={i < r.rating ? 'fill-current' : ''} />)}
                </div>
                <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-gray-700">{r.comment}</p>
            </div>
          ))}
        </div>

        {user && (
          <form onSubmit={submitReview} className="mt-6 border rounded-lg p-4 max-w-xl">
            <h3 className="font-bold mb-2">Write a Review</h3>
            <label className="label">Rating</label>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} className="text-2xl text-yellow-500">
                  <FiStar className={n <= rating ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
            <label className="label">Your Review</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="input" rows="3" required />
            <button type="submit" className="btn-primary mt-3">Submit Review</button>
          </form>
        )}
      </section>

      {/* Related products — Amazon/Flipkart style */}
      {related.similar.length > 0 && (
        <ProductRow
          title="Similar Products You May Like"
          subtitle={`More toys from the ${product.category} category`}
          products={related.similar}
          viewAllHref={`/shop?category=${encodeURIComponent(product.category)}`}
        />
      )}

      {related.moreFromBrand.length > 0 && (
        <ProductRow
          title={`More from ${product.brand}`}
          subtitle={`Browse other ${product.brand} products`}
          products={related.moreFromBrand}
          viewAllHref={`/shop?brand=${encodeURIComponent(product.brand)}`}
          accent="purple"
        />
      )}

      {related.similar.length === 0 && related.moreFromBrand.length === 0 && related.trending.length > 0 && (
        <ProductRow
          title="Trending Toys"
          subtitle="Top-rated picks customers love"
          products={related.trending}
          viewAllHref="/shop?bestSeller=true"
          accent="amber"
        />
      )}

    </div>
  );
}

/**
 * Horizontally scrollable row of products with arrow controls.
 * On phones it's swipeable; on desktops users can scroll or click the arrows.
 */
function ProductRow({ title, subtitle, products, viewAllHref, accent = 'primary' }) {
  const scrollerRef = useRef(null);

  const accentBar =
    accent === 'purple' ? 'bg-purple-500' :
    accent === 'amber'  ? 'bg-amber-500'  :
    'bg-primary-500';

  const scroll = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  };

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-3 mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`${accentBar} w-1 h-6 rounded`} aria-hidden></span>
            <h2 className="text-lg sm:text-2xl font-extrabold truncate">{title}</h2>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-3">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {viewAllHref && (
            <Link to={viewAllHref} className="hidden sm:inline text-sm font-semibold text-primary-500 hover:underline">
              View all →
            </Link>
          )}
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="hidden sm:inline-flex w-9 h-9 rounded-full border border-gray-300 hover:border-primary-500 hover:text-primary-500 items-center justify-center transition"
          >
            <FiChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="hidden sm:inline-flex w-9 h-9 rounded-full border border-gray-300 hover:border-primary-500 hover:text-primary-500 items-center justify-center transition"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {products.map((p) => (
          <div
            key={p._id}
            data-card
            className="snap-start flex-shrink-0 w-[150px] sm:w-[210px] md:w-[230px]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {viewAllHref && (
        <div className="text-center mt-2 sm:hidden">
          <Link to={viewAllHref} className="text-sm font-semibold text-primary-500 hover:underline">
            View all →
          </Link>
        </div>
      )}
    </section>
  );
}

const Info = ({ label, value }) => (
  <div className="border-b pb-1"><span className="text-gray-500">{label}:</span> <span className="font-medium">{value}</span></div>
);
// Colour swatch panel rendered in two places (mobile under gallery + desktop
// in info column). Identical UI, just controlled by parent state so both
// instances stay in sync.
function ColorSwatchPanel({ colors, selectedColor, onSelect }) {
  // selectedColor stays empty until the customer explicitly picks one.
  // We DON'T fall back to colors[0] here — the heading should read
  // "Select a colour" so it's obvious a choice is required.
  return (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-bold">
          {selectedColor
            ? <>Color: <span className="font-medium text-primary-600">{selectedColor}</span></>
            : <span className="text-gray-700">Select a colour</span>}
        </p>
        <p className="text-[10px] text-gray-500">{colors.length} option{colors.length === 1 ? '' : 's'}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => {
          const bg = colorToBackground(c);
          const isPicked = (selectedColor || '').toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onSelect(c)}
              title={c}
              aria-label={`Select ${c}`}
              className={`relative inline-flex items-center gap-1.5 border-2 rounded-full pl-0.5 pr-2.5 py-0.5 text-xs transition ${
                isPicked
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-100'
                  : 'border-gray-200 bg-white hover:border-primary-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full inline-block border ${isLightColor(c) ? 'border-gray-300' : 'border-white shadow-inner'}`}
                style={bg ? { background: bg } : { background: 'repeating-linear-gradient(45deg,#e5e7eb 0 3px,#fff 3px 6px)' }}
              />
              <span className="font-medium">{c}</span>
              {isPicked && <FiCheck size={11} className="text-primary-600" />}
            </button>
          );
        })}
      </div>
    </>
  );
}

const SpecRow = ({ label, value }) => (
  <tr className="border-b last:border-0">
    <td className="px-3 py-2 text-gray-500 w-1/3">{label}</td>
    <td className="px-3 py-2 font-medium text-gray-900">{value}</td>
  </tr>
);
const Perk = ({ icon, text }) => (
  <div className="flex flex-col items-center gap-1 text-gray-600">
    <span className="text-2xl text-primary-500">{icon}</span>
    {text}
  </div>
);
