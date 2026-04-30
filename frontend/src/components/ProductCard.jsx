import { Link } from 'react-router-dom';
import { FiShoppingCart, FiEye, FiStar, FiHeart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { resolveImage } from '../utils/imageUrl';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const wished = isInWishlist(product._id);
  const final = product.discount > 0
    ? +(product.price - (product.price * product.discount) / 100).toFixed(2)
    : product.price;

  return (
    <div className="card group relative">
      {product.discount > 0 && (
        <span className="badge-discount">-{product.discount}%</span>
      )}
      {product.newArrival && (
        <span className="badge-new">NEW</span>
      )}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product); }}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`absolute top-2 right-2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow transition
          ${wished ? 'bg-primary-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-primary-500 hover:text-white'}
          ${product.newArrival ? 'mt-7' : ''}`}
      >
        <FiHeart size={14} className={wished ? 'fill-current' : ''} />
      </button>
      <Link to={`/product/${product._id}`} className="block h-28 sm:h-44 md:h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-white p-1.5 sm:p-3">
        <img
          src={resolveImage(product.image || product.images?.[0])}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-110 transition duration-300"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Toy'; }}
        />
      </Link>
      <div className="p-2 sm:p-3">
        <p className="text-[9px] sm:text-xs uppercase text-gray-500 truncate leading-tight">{product.brand}</p>
        <Link to={`/product/${product._id}`}>
          <h3 className="font-medium text-[11px] sm:text-sm text-gray-900 line-clamp-2 mt-0.5 sm:mt-1 hover:text-primary-500 leading-snug sm:min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        {product.rating > 0 && (
          <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 text-[9px] sm:text-xs text-yellow-500">
            <FiStar className="fill-current" size={10} />
            <span className="text-gray-600">{product.rating.toFixed(1)} ({product.numReviews})</span>
          </div>
        )}
        <div className="flex items-baseline gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
          <span className="text-sm sm:text-lg font-bold text-primary-600">₹{final.toFixed(2)}</span>
          {product.discount > 0 && (
            <span className="text-[10px] sm:text-sm text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
          )}
        </div>
        <p className={`hidden sm:block text-xs mt-1 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {product.stock > 0 ? `In stock` : 'Out of stock'}
        </p>

        {/* Mobile: single full-width Add button */}
        <button
          disabled={product.stock === 0}
          onClick={() => addToCart(product)}
          className="sm:hidden mt-1.5 w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-semibold py-1.5 rounded flex items-center justify-center gap-1"
        >
          <FiShoppingCart size={11} /> {product.stock === 0 ? 'Out' : 'Add'}
        </button>

        {/* Desktop: View + Add side by side */}
        <div className="hidden sm:flex gap-2 mt-3">
          <Link to={`/product/${product._id}`} className="flex-1 border border-gray-300 hover:border-primary-500 hover:text-primary-500 text-xs font-medium py-2 rounded text-center flex items-center justify-center gap-1">
            <FiEye size={12} /> View
          </Link>
          <button
            disabled={product.stock === 0}
            onClick={() => addToCart(product)}
            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded flex items-center justify-center gap-1"
          >
            <FiShoppingCart size={12} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
