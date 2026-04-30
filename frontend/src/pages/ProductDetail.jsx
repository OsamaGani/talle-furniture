import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiShoppingCart, FiHeart, FiStar, FiTruck, FiShield, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import { resolveImage } from '../utils/imageUrl';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [related, setRelated] = useState({ similar: [], moreFromBrand: [], trending: [] });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/products/${id}`);
      setProduct(data);
      setActiveImg(data.image || data.images?.[0] || '');
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

  const final = product.discount > 0 ? +(product.price - (product.price * product.discount) / 100).toFixed(2) : product.price;

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-primary-500">Home</Link> / <Link to="/shop" className="hover:text-primary-500">Shop</Link> / <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-5 md:gap-8">
        {/* Images */}
        <div className="md:sticky md:top-32 md:self-start">
          <div className="aspect-square max-h-[280px] sm:max-h-[400px] md:max-h-[520px] border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-3 sm:p-4">
            <img src={resolveImage(activeImg)} alt={product.name} className="max-w-full max-h-full object-contain" />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(img)} className={`w-20 h-20 border-2 rounded-lg overflow-hidden flex-shrink-0 bg-white ${activeImg === img ? 'border-primary-500' : 'border-gray-200'}`}>
                  <img src={resolveImage(img)} className="w-full h-full object-contain p-1" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 uppercase">{product.brand}</p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{product.name}</h1>
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
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={i < Math.round(product.rating) ? 'fill-current' : ''} />
              ))}
            </div>
            <span className="text-sm text-gray-600">{product.rating?.toFixed(1) || 0} ({product.numReviews} reviews)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-extrabold text-primary-600">₹{final.toFixed(2)}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-sm font-semibold">-{product.discount}%</span>
              </>
            )}
          </div>

          {product.wholesalePrice > 0 && product.wholesaleMinQty > 0 && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-purple-700">🛍 Wholesale Price: ₹{product.wholesalePrice.toFixed(2)} / unit</p>
              <p className="text-xs text-purple-600 mt-0.5">When you order {product.wholesaleMinQty}+ units (wholesale account required)</p>
            </div>
          )}

          <p className={`mt-2 text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock > 0 ? `In Stock — ${product.stock} available` : 'Out of Stock'}
          </p>

          <p className="text-gray-700 mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Info label="Category" value={product.category} />
            <Info label="Brand" value={product.brand} />
            {product.ageGroup && <Info label="Age" value={product.ageGroup} />}
          </div>

          {product.stock > 0 ? (
            <div className="mt-5 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <div className="flex items-center border border-gray-300 rounded h-8 text-xs">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-2 hover:bg-gray-50 h-full">−</button>
                <span className="px-2 font-semibold">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-2 hover:bg-gray-50 h-full">+</button>
              </div>
              <button
                onClick={() => addToCart(product, qty)}
                className="flex items-center justify-center gap-1 border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white text-xs font-semibold px-3 h-8 rounded transition"
              >
                <FiShoppingCart size={12} /> Add to Cart
              </button>
              <button
                onClick={() => { addToCart(product, qty); navigate('/checkout'); }}
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
const Perk = ({ icon, text }) => (
  <div className="flex flex-col items-center gap-1 text-gray-600">
    <span className="text-2xl text-primary-500">{icon}</span>
    {text}
  </div>
);
