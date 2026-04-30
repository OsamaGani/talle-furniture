import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { resolveImage } from '../utils/imageUrl';

export default function Checkout() {
  const { items, subtotal, shipping, tax, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [addr, setAddr] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zip: user?.address?.zip || '',
    country: user?.address?.country || 'USA',
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p>Your cart is empty</p>
        <button onClick={() => navigate('/shop')} className="btn-primary mt-4">Shop Now</button>
      </div>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-8">
          <p className="text-5xl mb-3">📧</p>
          <h2 className="text-xl font-bold mb-2">Verify your email to checkout</h2>
          <p className="text-gray-600 text-sm mb-4">For security, we require email verification before you can place an order.</p>
          <button onClick={() => navigate('/verify-email')} className="btn-primary">Verify Email Now →</button>
        </div>
      </div>
    );
  }

  const placeOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: order } = await API.post('/orders', {
        items: items.map((i) => ({ product: i.product, name: i.name, image: i.image, price: i.price, qty: i.qty, isWholesalePrice: i.isWholesalePrice })),
        shippingAddress: addr,
        paymentMethod,
        itemsPrice: subtotal,
        shippingPrice: shipping,
        taxPrice: tax,
        totalPrice: total,
      });

      if (paymentMethod === 'Stripe') {
        try {
          const { data: session } = await API.post('/payment/create-checkout-session', {
            items: items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, image: i.image })),
            orderId: order._id,
          });
          clearCart();
          window.location.href = session.url;
          return;
        } catch (err) {
          toast.error('Stripe not configured. Order saved as COD.');
        }
      }

      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Checkout</h1>
      <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <section className="bg-white border rounded-lg p-5">
            <h2 className="font-bold text-lg mb-4">Shipping Address</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Full Name" value={addr.fullName} onChange={(v) => setAddr({ ...addr, fullName: v })} required />
              <Field label="Phone" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} required />
              <div className="md:col-span-2"><Field label="Street Address" value={addr.street} onChange={(v) => setAddr({ ...addr, street: v })} required /></div>
              <Field label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} required />
              <Field label="State" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} required />
              <Field label="ZIP" value={addr.zip} onChange={(v) => setAddr({ ...addr, zip: v })} required />
              <Field label="Country" value={addr.country} onChange={(v) => setAddr({ ...addr, country: v })} required />
            </div>
          </section>

          <section className="bg-white border rounded-lg p-5">
            <h2 className="font-bold text-lg mb-4">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-3 border rounded p-3 cursor-pointer hover:border-primary-500">
                <input type="radio" name="pm" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="accent-primary-500" />
                <div>
                  <p className="font-semibold">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when you receive the order</p>
                </div>
              </label>
              <label className="flex items-center gap-3 border rounded p-3 cursor-pointer hover:border-primary-500">
                <input type="radio" name="pm" checked={paymentMethod === 'Stripe'} onChange={() => setPaymentMethod('Stripe')} className="accent-primary-500" />
                <div>
                  <p className="font-semibold">Credit/Debit Card (Stripe)</p>
                  <p className="text-xs text-gray-500">Secure online payment</p>
                </div>
              </label>
              <label className="flex items-center gap-3 border rounded p-3 cursor-pointer hover:border-primary-500">
                <input type="radio" name="pm" checked={paymentMethod === 'Razorpay'} onChange={() => setPaymentMethod('Razorpay')} className="accent-primary-500" />
                <div>
                  <p className="font-semibold">Razorpay</p>
                  <p className="text-xs text-gray-500">UPI, Netbanking, Cards & Wallets</p>
                </div>
              </label>
            </div>
          </section>
        </div>

        <aside className="bg-white border rounded-lg p-5 h-fit lg:sticky lg:top-32">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={i.product} className="flex gap-2 text-sm">
                <img src={resolveImage(i.image)} className="w-12 h-12 rounded object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-1">{i.name}</p>
                  <p className="text-gray-500 text-xs">Qty: {i.qty} × ₹{i.price}</p>
                </div>
                <p className="font-semibold">₹{(i.price * i.qty).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <hr className="my-3" />
          <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
          <Row label="Shipping" value={shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`} />
          <Row label="Tax" value={`₹${tax.toFixed(2)}`} />
          <hr className="my-3" />
          <Row label="Total" value={`₹${total.toFixed(2)}`} bold />
          <button type="submit" disabled={submitting} className="btn-primary w-full mt-4">
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </aside>
      </form>
    </div>
  );
}

const Field = ({ label, value, onChange, required }) => (
  <div>
    <label className="label">{label}{required && <span className="text-red-500">*</span>}</label>
    <input className="input" value={value} onChange={(e) => onChange(e.target.value)} required={required} />
  </div>
);
const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between ${bold ? 'text-lg font-bold' : 'text-sm text-gray-700'}`}>
    <span>{label}</span><span>{value}</span>
  </div>
);
