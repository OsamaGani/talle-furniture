import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar, FiHeart, FiTruck, FiEye } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { resolveImage } from '../utils/imageUrl';

const FREE_SHIPPING_THRESHOLD = 999;

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const wished = isInWishlist(product._id);

  const final = product.discount > 0
    ? +(product.price - (product.price * product.discount) / 100).toFixed(2)
    : product.price;
  const saved = product.discount > 0 ? product.price - final : 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const eligibleFreeShip = final >= FREE_SHIPPING_THRESHOLD;

  // Star rating — half-star aware
  const stars = Math.max(0, Math.min(5, product.rating || 0));

  return (
    <div className="card group relative bg-white rounded-lg border hover:border-primary-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
      {/* Top-left badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.discount > 0 && (
          <span className="bg-primary-500 text-white text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded shadow">
            -{product.discount}%
          </span>
        )}
        {product.newArrival && (
          <span className="bg-yellow-400 text-gray-900 text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded shadow">
            NEW
          </span>
        )}
        {product.bestSeller && (
          <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded shadow inline-flex items-center gap-1">
            ⭐ BESTSELLER
          </span>
        )}
      </div>

      {/* Wishlist heart (top-right) */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product); }}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`absolute top-2 right-2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow transition
          ${wished ? 'bg-primary-500 text-white' : 'bg-white/95 text-gray-600 hover:bg-primary-500 hover:text-white'}`}
      >
        <FiHeart size={15} className={wished ? 'fill-current' : ''} />
      </button>

      {/* Image */}
      <Link
        to={`/product/${product._id}`}
        className="block h-32 sm:h-44 md:h-52 overflow-hidden bg-gradient-to-br from-gray-50 to-white p-2 sm:p-4 relative"
      >
        <img
          src={resolveImage(product.image || product.images?.[0])}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-110 transition duration-500"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Toy'; }}
        />
        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
            <span className="bg-gray-900 text-white text-xs font-extrabold px-3 py-1 rounded-full">OUT OF STOCK</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        <p className="text-[9px] sm:text-[11px] uppercase tracking-wide text-gray-500 truncate font-semibold">
          {product.brand}
        </p>

        <Link to={`/product/${product._id}`} className="flex-1">
          <h3 className="font-medium text-[12px] sm:text-sm text-gray-900 line-clamp-2 mt-0.5 hover:text-primary-500 leading-snug sm:min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating row — Flipkart-style green pill */}
        {stars > 0 && (
          <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
            <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
              {stars.toFixed(1)} <FiStar className="fill-current" size={9} />
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500">
              ({product.numReviews || 0})
            </span>
          </div>
        )}

        {/* Price block — final price + strike-through original + savings */}
        <div className="mt-1.5 sm:mt-2">
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-extrabold text-gray-900">₹{final.toFixed(0)}</span>
            {product.discount > 0 && (
              <>
                <span className="text-[11px] sm:text-sm text-gray-400 line-through">₹{product.price.toFixed(0)}</span>
                <span className="text-[10px] sm:text-xs text-emerald-600 font-bold">
                  {product.discount}% off
                </span>
              </>
            )}
          </div>
          {saved > 0 && (
            <p className="text-[10px] sm:text-xs text-emerald-700 mt-0.5">
              You save ₹{saved.toFixed(0)}
            </p>
          )}
        </div>

        {/* Free shipping / stock signals */}
        <div className="mt-1 space-y-0.5">
          {eligibleFreeShip && product.stock > 0 && (
            <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <FiTruck size={11} /> Free delivery
            </p>
          )}
          {lowStock && (
            <p className="text-[10px] sm:text-xs text-orange-600 font-semibold">
              Hurry — only {product.stock} left!
            </p>
          )}
        </div>

        {/* Mobile: single full-width Add button (small screens, taps are easier) */}
        <button
          disabled={product.stock === 0}
          onClick={() => addToCart(product)}
          className="sm:hidden mt-2 w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          <FiShoppingCart size={12} />
          {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
        </button>

        {/* Desktop: View + Add side by side */}
        <div className="hidden sm:flex gap-2 mt-3">
          <Link
            to={`/product/${product._id}`}
            className="flex-1 border border-gray-300 hover:border-primary-500 hover:text-primary-500 text-xs font-semibold py-2 rounded text-center inline-flex items-center justify-center gap-1 transition"
          >
            <FiEye size={12} /> View
          </Link>
          <button
            disabled={product.stock === 0}
            onClick={() => addToCart(product)}
            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition active:scale-95"
          >
            <FiShoppingCart size={12} />
            {product.stock === 0 ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
