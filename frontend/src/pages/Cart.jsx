import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FiTrash2, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { resolveImage } from '../utils/imageUrl';

export default function Cart() {
  const { items, removeFromCart, updateQty, subtotal, shipping, tax, total, amountToFreeShipping, FREE_SHIPPING_THRESHOLD, isWholesale } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <FiShoppingBag size={64} className="mx-auto text-gray-300" />
        <h2 className="text-2xl font-bold mt-4">Your cart is empty</h2>
        <p className="text-gray-600 mt-2">Looks like you haven't added any toys yet.</p>
        <Link to="/shop" className="btn-primary inline-block mt-6">Continue Shopping</Link>
      </div>
    );
  }

  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Shopping Cart ({items.length})</h1>
      {isWholesale && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 text-sm px-3 py-2 rounded mb-3 inline-block">
          🛍 Wholesale account active — bulk prices apply when minimum quantities are met
        </div>
      )}

      {/* Free shipping progress */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5">
        {amountToFreeShipping === 0 ? (
          <p className="text-sm text-green-700 font-semibold flex items-center gap-2"><FiTruck /> 🎉 You qualify for FREE shipping!</p>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-2">
              Add <span className="font-bold text-primary-500">₹{amountToFreeShipping.toFixed(2)}</span> more for <span className="font-semibold">FREE shipping</span> (over ₹{FREE_SHIPPING_THRESHOLD})
            </p>
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-3">
          {items.map((it) => {
            const eligibleForWholesale = isWholesale && it.wholesalePrice > 0 && it.wholesaleMinQty > 0;
            const qtyToUnlockWholesale = eligibleForWholesale && !it.isWholesalePrice ? it.wholesaleMinQty - it.qty : 0;
            return (
              <div key={it.product} className="bg-white border rounded-lg p-3 sm:p-4 flex gap-3 sm:gap-4">
                <Link to={`/product/${it.product}`} className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-50 border rounded overflow-hidden p-1.5 sm:p-2">
                  <img src={resolveImage(it.image)} alt={it.name} className="w-full h-full object-contain" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${it.product}`} className="font-medium text-sm sm:text-base hover:text-primary-500 line-clamp-2">{it.name}</Link>
                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                    <p className="text-primary-600 font-bold text-sm sm:text-base">₹{it.price.toFixed(2)}</p>
                    {it.isWholesalePrice && <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-semibold">WHOLESALE</span>}
                    {!it.isWholesalePrice && eligibleForWholesale && (
                      <span className="text-[10px] sm:text-xs text-purple-600">+{qtyToUnlockWholesale} for ₹{it.wholesalePrice}/ea</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-2">
                    <div className="flex items-center border rounded text-sm">
                      <button onClick={() => updateQty(it.product, it.qty - 1)} className="px-2.5 sm:px-3 py-1">-</button>
                      <span className="px-3 sm:px-4">{it.qty}</span>
                      <button onClick={() => updateQty(it.product, it.qty + 1)} className="px-2.5 sm:px-3 py-1">+</button>
                    </div>
                    <button onClick={() => removeFromCart(it.product)} className="text-red-500 hover:text-red-700 text-xs sm:text-sm flex items-center gap-1">
                      <FiTrash2 size={14} /> <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm sm:text-base">₹{(it.price * it.qty).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="bg-white border rounded-lg p-5 h-fit lg:sticky lg:top-32">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <Row label={`Subtotal (${items.length} items)`} value={`₹${subtotal.toFixed(2)}`} />
          <Row label="Shipping" value={shipping === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `₹${shipping.toFixed(2)}`} />
          <Row label="Tax (5%)" value={`₹${tax.toFixed(2)}`} />
          <hr className="my-3" />
          <Row label="Total" value={`₹${total.toFixed(2)}`} bold />
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-4">
            Proceed to Checkout
          </button>
          <Link to="/shop" className="block text-center text-sm text-primary-500 hover:underline mt-3">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between py-1 ${bold ? 'text-lg font-bold' : 'text-sm text-gray-700'}`}>
    <span>{label}</span><span>{value}</span>
  </div>
);
