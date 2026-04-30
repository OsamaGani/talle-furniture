import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { resolveImage } from '../utils/imageUrl';
import { openRazorpayCheckout } from '../utils/razorpay';
import {
  FiUser, FiMapPin, FiCreditCard, FiCheck, FiShield, FiTruck,
  FiRefreshCw, FiTag, FiClock, FiPhone, FiMail, FiEdit2,
} from 'react-icons/fi';

// Indian mobile: 10 digits starting 6/7/8/9
const PHONE_RE = /^[6-9]\d{9}$/;

// 6-digit Indian PIN code
const PIN_RE = /^\d{6}$/;

const cleanPhone = (v) => v.replace(/\D/g, '').slice(0, 10);

export default function Checkout() {
  const { items, subtotal, shipping, tax, total, clearCart, FREE_SHIPPING_THRESHOLD, amountToFreeShipping } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [coupon, setCoupon] = useState('');
  const [editingAddress, setEditingAddress] = useState(true); // collapses once filled & valid
  const [pinLookup, setPinLookup] = useState({ loading: false, error: '' });

  const [addr, setAddr] = useState({
    fullName: user?.name || '',
    phone: cleanPhone(user?.phone || ''),
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zip: user?.address?.zip || '',
    country: user?.address?.country || 'India',
  });

  // Validate the address before allowing payment.
  const validation = useMemo(() => {
    const errs = {};
    if (!addr.fullName.trim()) errs.fullName = 'Full name is required';
    if (!PHONE_RE.test(addr.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile';
    if (!addr.street.trim()) errs.street = 'Street is required';
    if (!addr.city.trim()) errs.city = 'City is required';
    if (!addr.state.trim()) errs.state = 'State is required';
    if (!PIN_RE.test(addr.zip)) errs.zip = 'Enter a valid 6-digit PIN code';
    return errs;
  }, [addr]);
  const addressValid = Object.keys(validation).length === 0;

  // Look up city/state from a 6-digit Indian PIN code (free public API).
  const lookupPin = async (zip) => {
    if (!PIN_RE.test(zip)) return;
    setPinLookup({ loading: true, error: '' });
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
      const data = await r.json();
      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0];
        setAddr((a) => ({ ...a, city: po.District || a.city, state: po.State || a.state, country: 'India' }));
        setPinLookup({ loading: false, error: '' });
      } else {
        setPinLookup({ loading: false, error: 'PIN not found — please type city/state manually' });
      }
    } catch {
      setPinLookup({ loading: false, error: '' }); // fail silent — let user fill manually
    }
  };

  // Estimated delivery — 4-7 working days from today.
  const eta = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 4);
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${fmt(start)} – ${fmt(end)}`;
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="text-6xl mb-3">🛒</div>
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-600 text-sm mb-4">Add a few toys before checking out.</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Browse toys →</button>
      </div>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-8">
          <p className="text-5xl mb-3">📧</p>
          <h2 className="text-xl font-bold mb-2">Verify your email to checkout</h2>
          <p className="text-gray-600 text-sm mb-4">For security, we require email verification before placing an order.</p>
          <button onClick={() => navigate('/verify-email')} className="btn-primary">Verify Email Now →</button>
        </div>
      </div>
    );
  }

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!addressValid) {
      setEditingAddress(true);
      toast.error(Object.values(validation)[0]);
      return;
    }
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

      if (paymentMethod === 'Razorpay') {
        try {
          const { data: session } = await API.post('/payment/razorpay/create-order', { orderId: order._id });
          clearCart();
          await openRazorpayCheckout({
            ...session,
            onSuccess: () => navigate(`/order/${order._id}`),
            onDismiss: () => navigate(`/order/${order._id}`),
          });
          return;
        } catch (err) {
          const msg = err.response?.data?.message || 'Could not start online payment';
          toast.error(`${msg}. Order saved as unpaid — retry from order details.`, { duration: 8000 });
          clearCart();
          navigate(`/order/${order._id}`);
          return;
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

  // Step state — sequence is informational only (single-page flow).
  const steps = [
    { id: 1, label: 'Login', icon: <FiUser />, done: true,  active: false, value: user?.email },
    { id: 2, label: 'Address', icon: <FiMapPin />, done: addressValid && !editingAddress, active: editingAddress, value: addressValid && !editingAddress ? `${addr.fullName} · ${addr.city}` : null },
    { id: 3, label: 'Payment', icon: <FiCreditCard />, done: false, active: !editingAddress && addressValid, value: paymentMethod },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Page header with stepper */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">Secure Checkout</h1>
          <Stepper steps={steps} />
        </div>

        <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_400px] gap-4 sm:gap-6">
          {/* === LEFT — Address + Payment === */}
          <div className="space-y-4">
            {/* Logged-in identity card */}
            <SectionCard
              n="1"
              title="Logged in as"
              icon={<FiUser />}
              done={!!user}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{user?.name || 'Guest'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link to="/profile" className="text-xs text-primary-500 hover:underline whitespace-nowrap ml-3">Manage</Link>
              </div>
            </SectionCard>

            {/* Shipping address */}
            <SectionCard
              n="2"
              title="Shipping Address"
              icon={<FiMapPin />}
              active={editingAddress}
              done={addressValid && !editingAddress}
              actionLabel={addressValid && !editingAddress ? 'Change' : null}
              onAction={() => setEditingAddress(true)}
            >
              {addressValid && !editingAddress ? (
                /* Collapsed summary */
                <div className="text-sm">
                  <p className="font-semibold">{addr.fullName} <span className="text-gray-500 font-normal">· +91 {addr.phone}</span></p>
                  <p className="text-gray-700 mt-0.5">{addr.street}, {addr.city}, {addr.state} {addr.zip}, {addr.country}</p>
                </div>
              ) : (
                /* Editable form */
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field
                      label="Full Name"
                      value={addr.fullName}
                      onChange={(v) => setAddr({ ...addr, fullName: v })}
                      error={validation.fullName}
                      required
                    />
                    <Field
                      label="Mobile Number"
                      value={addr.phone}
                      onChange={(v) => setAddr({ ...addr, phone: cleanPhone(v) })}
                      placeholder="10-digit (starts with 6/7/8/9)"
                      prefix="+91"
                      maxLength={10}
                      error={validation.phone}
                      required
                    />
                  </div>
                  <Field
                    label="Flat / House / Building, Street"
                    value={addr.street}
                    onChange={(v) => setAddr({ ...addr, street: v })}
                    placeholder="e.g. Flat 4, Mobin Apt, Amrut Nagar"
                    error={validation.street}
                    required
                  />
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field
                      label="PIN Code"
                      value={addr.zip}
                      onChange={(v) => {
                        const z = v.replace(/\D/g, '').slice(0, 6);
                        setAddr({ ...addr, zip: z });
                        if (PIN_RE.test(z)) lookupPin(z);
                      }}
                      placeholder="400612"
                      maxLength={6}
                      error={validation.zip}
                      hint={pinLookup.loading ? 'Looking up…' : pinLookup.error}
                      required
                    />
                    <Field
                      label="City"
                      value={addr.city}
                      onChange={(v) => setAddr({ ...addr, city: v })}
                      error={validation.city}
                      required
                    />
                    <Field
                      label="State"
                      value={addr.state}
                      onChange={(v) => setAddr({ ...addr, state: v })}
                      error={validation.state}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!addressValid}
                    onClick={() => setEditingAddress(false)}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Save & Continue
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Payment method */}
            <SectionCard
              n="3"
              title="Payment Method"
              icon={<FiCreditCard />}
              active={!editingAddress && addressValid}
            >
              <div className="space-y-2">
                <PaymentOption
                  selected={paymentMethod === 'Razorpay'}
                  onSelect={() => setPaymentMethod('Razorpay')}
                  icon="📱"
                  title="UPI / Cards / Netbanking / Wallets"
                  subtitle="GPay · PhonePe · Paytm · all major banks · all cards"
                  badge="RECOMMENDED"
                />
                <PaymentOption
                  selected={paymentMethod === 'COD'}
                  onSelect={() => setPaymentMethod('COD')}
                  icon="💵"
                  title="Cash on Delivery"
                  subtitle="Pay in cash when the order arrives"
                />
              </div>
            </SectionCard>

            {/* Trust badges row */}
            <div className="bg-white border rounded-lg p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <Trust icon={<FiShield />} title="Secure" desc="SSL encrypted" />
              <Trust icon={<FiTruck />}  title="Fast" desc="Pan-India delivery" />
              <Trust icon={<FiRefreshCw />} title="Easy" desc="7-day returns" />
            </div>
          </div>

          {/* === RIGHT — Order summary sidebar === */}
          <aside className="lg:sticky lg:top-32 h-fit space-y-4">
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-bold flex items-center justify-between">
                  <span>Order Summary</span>
                  <Link to="/cart" className="text-xs text-primary-500 hover:underline font-medium">Edit cart</Link>
                </h2>
              </div>

              {/* Item list */}
              <div className="px-4 py-3 max-h-60 overflow-y-auto space-y-3 border-b">
                {items.map((i) => (
                  <div key={i.product} className="flex gap-3 text-sm">
                    <img src={resolveImage(i.image)} className="w-12 h-12 rounded border object-contain p-1 bg-gray-50 flex-shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 leading-snug">{i.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Qty {i.qty} × ₹{i.price}</p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">₹{(i.price * i.qty).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="px-4 py-3 border-b bg-gradient-to-r from-yellow-50/50 to-orange-50/30">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <FiTag size={12} /> Have a coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    className="flex-1 min-w-0 px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => toast('Coupon system coming soon — your code is noted on the order.', { icon: '🏷' })}
                    className="bg-gray-900 hover:bg-black text-white text-sm font-semibold px-4 py-2 rounded transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Bill */}
              <div className="px-4 py-3 space-y-2 text-sm">
                <Row label="Item Total" value={`₹${subtotal.toFixed(2)}`} />
                <Row label="Delivery" value={shipping === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : `₹${shipping.toFixed(2)}`} />
                {amountToFreeShipping > 0 && (
                  <p className="text-[11px] text-emerald-600 -mt-1.5">
                    Add <strong>₹{amountToFreeShipping.toFixed(2)}</strong> more for FREE delivery
                  </p>
                )}
                <Row label="GST (18%)" value={`₹${tax.toFixed(2)}`} />
                <hr className="my-2" />
                <Row label="Total Payable" value={`₹${total.toFixed(2)}`} bold />
              </div>

              {/* ETA */}
              <div className="px-4 py-3 bg-emerald-50/40 border-t flex items-center gap-2 text-xs">
                <FiClock className="text-emerald-600" />
                <span className="text-gray-700">
                  Delivery between <strong className="text-gray-900">{eta}</strong>
                </span>
              </div>

              {/* Place order */}
              <div className="px-4 py-3 border-t">
                <button
                  type="submit"
                  disabled={submitting || !addressValid}
                  className="w-full bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-primary-500/30 hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  {submitting
                    ? 'Placing Order…'
                    : paymentMethod === 'COD'
                      ? <>Place Order · ₹{total.toFixed(2)}</>
                      : <>Pay ₹{total.toFixed(2)}</>
                  }
                </button>
                {!addressValid && (
                  <p className="text-[11px] text-orange-600 text-center mt-2">Complete your address to continue</p>
                )}
              </div>
            </div>

            {/* Need help footer */}
            <div className="bg-white border rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-900">Need help?</p>
              <a href="tel:+918655787075" className="flex items-center gap-2 hover:text-primary-500">
                <FiPhone size={12} /> +91 86557 87075
              </a>
              <a href="mailto:Huraira735@gmail.com" className="flex items-center gap-2 hover:text-primary-500">
                <FiMail size={12} /> Huraira735@gmail.com
              </a>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

// === Components ===

function Stepper({ steps }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
            s.done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : s.active ? 'bg-primary-500 text-white border border-primary-500'
              : 'bg-white text-gray-500 border border-gray-200'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
              s.done ? 'bg-emerald-500 text-white' : s.active ? 'bg-white text-primary-500' : 'bg-gray-200 text-gray-500'
            }`}>
              {s.done ? <FiCheck size={11} /> : s.id}
            </span>
            <span className="whitespace-nowrap">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`hidden sm:block h-0.5 w-6 ${s.done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
          )}
        </li>
      ))}
    </ol>
  );
}

function SectionCard({ n, title, icon, active, done, children, actionLabel, onAction }) {
  return (
    <section className={`bg-white border rounded-lg overflow-hidden transition ${
      active ? 'ring-2 ring-primary-100 border-primary-300' : ''
    }`}>
      <header className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b bg-gray-50/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            done ? 'bg-emerald-500 text-white' : active ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {done ? <FiCheck size={14} /> : n}
          </span>
          <h2 className="font-bold text-base sm:text-lg flex items-center gap-2 truncate">
            <span className="hidden sm:inline-flex text-gray-500">{icon}</span>
            {title}
          </h2>
        </div>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs sm:text-sm text-primary-500 hover:underline font-semibold whitespace-nowrap inline-flex items-center gap-1"
          >
            <FiEdit2 size={12} /> {actionLabel}
          </button>
        )}
      </header>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, required, placeholder, prefix, maxLength, error, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <div className={`flex items-stretch border-2 rounded-md transition ${
        error ? 'border-red-300 focus-within:border-red-500'
              : 'border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100'
      }`}>
        {prefix && (
          <span className="bg-gray-50 px-3 flex items-center text-gray-500 text-sm font-semibold border-r">{prefix}</span>
        )}
        <input
          type="text"
          className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent outline-none rounded-md"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function PaymentOption({ selected, onSelect, icon, title, subtitle, badge }) {
  return (
    <label
      className={`flex items-center gap-3 border-2 rounded-lg p-3 cursor-pointer transition ${
        selected
          ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-100'
          : 'border-gray-200 hover:border-primary-400'
      }`}
    >
      <input type="radio" name="pm" checked={selected} onChange={onSelect} className="accent-primary-500 flex-shrink-0" />
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold flex items-center gap-2">
          {title}
          {badge && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{badge}</span>}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </label>
  );
}

function Trust({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center text-xs">
      <div className="text-primary-500 text-lg sm:text-xl mb-0.5 sm:mb-1">{icon}</div>
      <p className="font-bold text-gray-900 text-[11px] sm:text-xs">{title}</p>
      <p className="text-[10px] sm:text-[11px] text-gray-500 leading-tight">{desc}</p>
    </div>
  );
}

const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between ${bold ? 'text-base font-extrabold pt-1' : 'text-gray-700'}`}>
    <span>{label}</span><span>{value}</span>
  </div>
);
