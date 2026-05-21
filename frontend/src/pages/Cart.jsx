import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FiTrash2, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { resolveImage } from '../utils/imageUrl';
import { PHONE_PRIMARY_DISPLAY, PHONE_PRIMARY_TEL, EMAIL_PRIMARY } from '../config/contact';
import { colorToBackground, isLightColor } from '../utils/colors';

export default function Cart() {
  const { items, removeFromCart, updateQty, subtotal, shipping, tax, total, amountToFreeShipping, FREE_SHIPPING_THRESHOLD } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <FiShoppingBag size={64} className="mx-auto text-gray-300" />
        <h2 className="text-2xl font-bold mt-4">Your cart is empty</h2>
        <p className="text-gray-600 mt-2">Looks like you haven't added any chairs yet.</p>
        <Link to="/shop" className="btn-primary inline-block mt-6">Continue Shopping</Link>
      </div>
    );
  }

  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Shopping Cart ({items.length})</h1>

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
            const colorBg = it.color ? colorToBackground(it.color) : null;
            return (
              <div key={it.lineId || it.product} className="bg-white border rounded-lg p-3 sm:p-4 flex gap-3 sm:gap-4">
                <Link to={`/product/${it.product}`} className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-50 border rounded overflow-hidden p-1.5 sm:p-2">
                  <img src={resolveImage(it.image)} alt={it.name} className="w-full h-full object-contain" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${it.product}`} className="font-medium text-sm sm:text-base hover:text-primary-500 line-clamp-2">{it.name}</Link>
                  {/* Colour pill — only renders when the customer picked one */}
                  {it.color && (
                    <span className="inline-flex items-center gap-1.5 mt-1 bg-gray-50 border rounded-full pl-1 pr-2 py-0.5 text-xs">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border ${isLightColor(it.color) ? 'border-gray-300' : 'border-white'}`}
                        style={colorBg ? { background: colorBg } : { background: 'repeating-linear-gradient(45deg,#e5e7eb 0 3px,#fff 3px 6px)' }}
                      />
                      <span className="font-medium">{it.color}</span>
                    </span>
                  )}
                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                    <p className="text-primary-600 font-bold text-sm sm:text-base">₹{it.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-2">
                    <div className="flex items-center border rounded text-sm">
                      <button onClick={() => updateQty(it.lineId || it.product, it.qty - 1)} className="px-2.5 sm:px-3 py-1">-</button>
                      <span className="px-3 sm:px-4">{it.qty}</span>
                      <button onClick={() => updateQty(it.lineId || it.product, it.qty + 1)} className="px-2.5 sm:px-3 py-1">+</button>
                    </div>
                    <button onClick={() => removeFromCart(it.lineId || it.product)} className="text-red-500 hover:text-red-700 text-xs sm:text-sm flex items-center gap-1">
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

        <aside className="lg:sticky lg:top-32 h-fit space-y-4">
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50">
              <h2 className="font-bold text-lg">Order Summary</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              <Row label={`Item Total (${items.length} ${items.length === 1 ? 'item' : 'items'})`} value={`₹${subtotal.toFixed(2)}`} />
              <Row label="Delivery" value={shipping === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shipping.toFixed(2)}`} />
              <Row label="GST (18%)" value={`₹${tax.toFixed(2)}`} />
              <hr className="my-2" />
              <Row label="Total Amount" value={`₹${total.toFixed(2)}`} bold />
              {subtotal > 0 && (
                <p className="text-xs text-emerald-700 font-semibold pt-1">
                  You will save ₹{items.reduce((s, it) => {
                    if (!it.originalPrice || it.originalPrice <= it.price) return s;
                    return s + (it.originalPrice - it.price) * it.qty;
                  }, 0).toFixed(0) || '0'} on this order
                </p>
              )}
            </div>
            <div className="px-5 py-3 border-t bg-gray-50">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gray-900 hover:bg-black text-white font-semibold text-sm py-3 rounded-lg transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                Proceed to Checkout →
              </button>
              <Link to="/shop" className="block text-center text-xs text-gray-500 hover:text-primary-500 mt-2">
                or continue shopping
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="bg-white border rounded-lg p-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <FiTruck className="mx-auto text-primary-500 mb-1" size={18} />
              <p className="font-semibold">Fast</p>
              <p className="text-[10px] text-gray-500">Pan-India</p>
            </div>
            <div>
              <span className="text-lg">🛡</span>
              <p className="font-semibold">Secure</p>
              <p className="text-[10px] text-gray-500">SSL encrypted</p>
            </div>
            <div>
              <span className="text-lg">🔄</span>
              <p className="font-semibold">7-day</p>
              <p className="text-[10px] text-gray-500">Easy returns</p>
            </div>
          </div>

          {/* Help line */}
          <div className="bg-white border rounded-lg p-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-900 mb-1">Need help?</p>
            <a href={`tel:${PHONE_PRIMARY_TEL}`} className="block hover:text-primary-500">📞 {PHONE_PRIMARY_DISPLAY}</a>
            <a href={`mailto:${EMAIL_PRIMARY}`} className="block hover:text-primary-500">✉ {EMAIL_PRIMARY}</a>
          </div>
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
