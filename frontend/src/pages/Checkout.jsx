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
  FiRefreshCw, FiTag, FiClock, FiPhone, FiMail, FiEdit2, FiPlus,
  FiTrash2, FiHome, FiBriefcase,
} from 'react-icons/fi';
import { PHONE_PRIMARY_DISPLAY, PHONE_PRIMARY_TEL, EMAIL_PRIMARY } from '../config/contact';

// Indian mobile: 10 digits starting 6/7/8/9
const PHONE_RE = /^[6-9]\d{9}$/;
// 6-digit Indian PIN code
const PIN_RE = /^\d{6}$/;
const cleanPhone = (v) => v.replace(/\D/g, '').slice(0, 10);

const EMPTY_ADDR = {
  label: '',
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'India',
  isDefault: false,
};

export default function Checkout() {
  const { items, subtotal, shipping, tax, total, clearCart, amountToFreeShipping } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [coupon, setCoupon] = useState('');

  // Saved addresses + which one is selected for this order.
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Inline form mode: 'closed' | 'new' | 'edit'. When 'edit', editingId is set.
  const [formMode, setFormMode] = useState('closed');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDR);
  const [saveAddress, setSaveAddress] = useState(true);  // checkbox state when adding new
  const [savingAddr, setSavingAddr] = useState(false);
  const [pinLookup, setPinLookup] = useState({ loading: false, error: '' });

  // Show validation errors only after the user has interacted with a field
  // (blurred away from it) or tried to submit. Keeps the form clean on
  // first render — nobody likes a wall of red before they've typed anything.
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));
  const showError = (field) => (touched[field] || submitAttempted);

  // ---- Load saved addresses on mount ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await API.get('/addresses');
        if (cancelled) return;
        setSavedAddresses(data);
        const def = data.find((a) => a.isDefault) || data[0];
        if (def) setSelectedId(def._id);
        // No saved addresses yet → open the new-address form by default,
        // pre-filled with what we know about the user.
        if (data.length === 0) {
          setFormMode('new');
          setForm({
            ...EMPTY_ADDR,
            fullName: user?.name || '',
            phone: cleanPhone(user?.phone || ''),
          });
        }
      } catch (err) {
        // Silent fail — guests don't have addresses; logged-in users see the form.
        if (!cancelled) {
          setFormMode('new');
          setForm({
            ...EMPTY_ADDR,
            fullName: user?.name || '',
            phone: cleanPhone(user?.phone || ''),
          });
        }
      } finally {
        if (!cancelled) setLoadingAddresses(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?._id]);

  // ---- Derived: which address actually ships this order ----
  const selectedAddress = useMemo(() => {
    if (formMode === 'new') return form;
    return savedAddresses.find((a) => a._id === selectedId) || null;
  }, [formMode, form, savedAddresses, selectedId]);

  // ---- Validation against the form (for the inline form only) ----
  const validation = useMemo(() => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!PHONE_RE.test(form.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile';
    if (!form.street.trim()) errs.street = 'Street is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!PIN_RE.test(form.zip)) errs.zip = 'Enter a valid 6-digit PIN code';
    return errs;
  }, [form]);
  const formValid = Object.keys(validation).length === 0;

  const lookupPin = async (zip) => {
    if (!PIN_RE.test(zip)) return;
    setPinLookup({ loading: true, error: '' });
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
      const data = await r.json();
      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0];
        setForm((a) => ({ ...a, city: po.District || a.city, state: po.State || a.state, country: 'India' }));
        setPinLookup({ loading: false, error: '' });
      } else {
        setPinLookup({ loading: false, error: 'PIN not found — type city/state manually' });
      }
    } catch {
      setPinLookup({ loading: false, error: '' });
    }
  };

  // ---- Address handlers ----
  const openNew = () => {
    setEditingId(null);
    setFormMode('new');
    setForm({
      ...EMPTY_ADDR,
      fullName: user?.name || '',
      phone: cleanPhone(user?.phone || ''),
    });
    setSaveAddress(true);
    setTouched({});
    setSubmitAttempted(false);
  };

  const openEdit = (addr) => {
    setEditingId(addr._id);
    setFormMode('edit');
    setForm({ ...addr });
    // Editing existing data — pre-mark fields as touched so any validation
    // issue surfaces immediately (the user already entered these values).
    setTouched({ fullName: true, phone: true, street: true, city: true, state: true, zip: true });
    setSubmitAttempted(false);
  };

  const closeForm = () => {
    setFormMode('closed');
    setEditingId(null);
    setForm(EMPTY_ADDR);
    setTouched({});
    setSubmitAttempted(false);
  };

  const submitAddressForm = async () => {
    setSubmitAttempted(true);
    if (!formValid) {
      toast.error(Object.values(validation)[0]);
      return;
    }
    setSavingAddr(true);
    try {
      if (formMode === 'edit' && editingId) {
        const { data } = await API.put(`/addresses/${editingId}`, form);
        setSavedAddresses(data);
        setSelectedId(editingId);
        toast.success('Address updated');
        closeForm();
      } else if (formMode === 'new' && saveAddress && user) {
        // Save to address book + use for this order
        const { data } = await API.post('/addresses', form);
        setSavedAddresses(data);
        const newest = data[data.length - 1];
        setSelectedId(newest._id);
        toast.success('Address saved');
        closeForm();
      }
      // If guest or saveAddress unchecked, we leave the form open — the
      // place-order flow uses the unsaved form values directly.
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save address');
    } finally {
      setSavingAddr(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!confirm('Remove this address?')) return;
    try {
      const { data } = await API.delete(`/addresses/${id}`);
      setSavedAddresses(data);
      // If we just deleted the selected one, fall back to the new default.
      if (selectedId === id) {
        const def = data.find((a) => a.isDefault) || data[0];
        setSelectedId(def?._id || null);
        if (data.length === 0) openNew();
      }
      toast.success('Address removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  };

  const setAsDefault = async (id) => {
    try {
      const { data } = await API.put(`/addresses/${id}/default`);
      setSavedAddresses(data);
      toast.success('Default address updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    }
  };

  const eta = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() + 4);
    const end = new Date();   end.setDate(end.getDate() + 7);
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${fmt(start)} – ${fmt(end)}`;
  }, []);

  // ---- Empty cart / unverified guards ----
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="text-6xl mb-3">🛒</div>
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-600 text-sm mb-4">Add a few chairs before checking out.</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Browse chairs →</button>
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

  // ---- Place order ----
  // The shipping address sent to the API is whichever one is currently
  // active: the selected saved card, or the values being typed into the
  // unsaved-new form (if the user opted out of saving).
  const placeOrder = async (e) => {
    e.preventDefault();

    // Resolve the shipping address — selected saved card OR unsaved new form
    let shippingAddress = null;
    if (formMode === 'new' || formMode === 'edit') {
      // The form is open. Validate first.
      setSubmitAttempted(true);
      if (!formValid) {
        toast.error(Object.values(validation)[0]);
        return;
      }
      // If user asked to save, persist before placing the order so future
      // orders pick it up. If not (or guest), use form values directly.
      if (formMode === 'new' && saveAddress && user) {
        try {
          const { data } = await API.post('/addresses', form);
          setSavedAddresses(data);
          const newest = data[data.length - 1];
          setSelectedId(newest._id);
          shippingAddress = newest;
          closeForm();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Could not save address');
          return;
        }
      } else if (formMode === 'edit' && editingId) {
        try {
          const { data } = await API.put(`/addresses/${editingId}`, form);
          setSavedAddresses(data);
          shippingAddress = data.find((a) => a._id === editingId);
          setSelectedId(editingId);
          closeForm();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Could not save address');
          return;
        }
      } else {
        // Guest checkout or "don't save" — pass form values straight through
        shippingAddress = form;
      }
    } else {
      shippingAddress = savedAddresses.find((a) => a._id === selectedId);
    }

    if (!shippingAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    setSubmitting(true);
    try {
      const { data: order } = await API.post('/orders', {
        items: items.map((i) => ({ product: i.product, name: i.name, image: i.image, price: i.price, qty: i.qty, color: i.color || '' })),
        shippingAddress,
        paymentMethod,
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

  const addressDone = !!selectedAddress && (formMode === 'closed' || (formMode !== 'closed' && formValid));
  const steps = [
    { id: 1, label: 'Login',   icon: <FiUser />,       done: !!user, active: false, value: user?.email },
    { id: 2, label: 'Address', icon: <FiMapPin />,     done: addressDone && formMode === 'closed', active: !addressDone || formMode !== 'closed' },
    { id: 3, label: 'Payment', icon: <FiCreditCard />, done: false, active: addressDone && formMode === 'closed' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">Secure Checkout</h1>
          <Stepper steps={steps} />
        </div>

        <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_400px] gap-4 sm:gap-6">
          <div className="space-y-4">
            {/* 1. Logged-in identity */}
            <SectionCard n="1" title="Logged in as" icon={<FiUser />} done={!!user}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{user?.name || 'Guest'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link to="/profile" className="text-xs text-primary-500 hover:underline whitespace-nowrap ml-3">Manage</Link>
              </div>
            </SectionCard>

            {/* 2. Shipping address — saved cards + add-new form */}
            <SectionCard
              n="2"
              title="Shipping Address"
              icon={<FiMapPin />}
              active={!addressDone || formMode !== 'closed'}
              done={addressDone && formMode === 'closed'}
            >
              {loadingAddresses ? (
                <p className="text-sm text-gray-500">Loading saved addresses…</p>
              ) : (
                <div className="space-y-3">
                  {/* Saved address cards */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      {savedAddresses.map((a) => (
                        <SavedAddressCard
                          key={a._id}
                          address={a}
                          selected={selectedId === a._id && formMode === 'closed'}
                          onSelect={() => { setSelectedId(a._id); setFormMode('closed'); }}
                          onEdit={() => openEdit(a)}
                          onDelete={() => deleteAddress(a._id)}
                          onSetDefault={() => setAsDefault(a._id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Inline form (new / edit) */}
                  {formMode !== 'closed' ? (
                    <AddressForm
                      form={form}
                      setForm={setForm}
                      validation={validation}
                      showError={showError}
                      markTouched={markTouched}
                      pinLookup={pinLookup}
                      lookupPin={lookupPin}
                      isEdit={formMode === 'edit'}
                      isGuest={!user}
                      saveAddress={saveAddress}
                      setSaveAddress={setSaveAddress}
                      onCancel={savedAddresses.length > 0 ? closeForm : null}
                      onSubmit={submitAddressForm}
                      saving={savingAddr}
                    />
                  ) : (
                    /* "+ Add new address" button — only shown when there's at least one saved */
                    savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={openNew}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/30 text-gray-700 hover:text-primary-600 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                      >
                        <FiPlus /> Add a new address
                      </button>
                    )
                  )}
                </div>
              )}
            </SectionCard>

            {/* 3. Payment */}
            <SectionCard n="3" title="Payment Method" icon={<FiCreditCard />} active={addressDone && formMode === 'closed'}>
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

            <div className="bg-white border rounded-lg p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <Trust icon={<FiShield />} title="Secure" desc="SSL encrypted" />
              <Trust icon={<FiTruck />}  title="Fast" desc="Pan-India delivery" />
              <Trust icon={<FiRefreshCw />} title="Easy" desc="7-day returns" />
            </div>
          </div>

          {/* === Order summary === */}
          <aside className="lg:sticky lg:top-32 h-fit space-y-4">
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-bold flex items-center justify-between">
                  <span>Order Summary</span>
                  <Link to="/cart" className="text-xs text-primary-500 hover:underline font-medium">Edit cart</Link>
                </h2>
              </div>

              <div className="px-4 py-3 max-h-60 overflow-y-auto space-y-3 border-b">
                {items.map((i) => (
                  <div key={i.lineId || i.product} className="flex gap-3 text-sm">
                    <img src={resolveImage(i.image)} className="w-12 h-12 rounded border object-contain p-1 bg-gray-50 flex-shrink-0" alt={i.name} />
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 leading-snug">{i.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Qty {i.qty} × ₹{i.price}
                        {i.color && <> · <span className="text-gray-700 font-medium">{i.color}</span></>}
                      </p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">₹{(i.price * i.qty).toFixed(2)}</p>
                  </div>
                ))}
              </div>

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

              <div className="px-4 py-3 bg-emerald-50/40 border-t flex items-center gap-2 text-xs">
                <FiClock className="text-emerald-600" />
                <span className="text-gray-700">Delivery between <strong className="text-gray-900">{eta}</strong></span>
              </div>

              <div className="px-4 py-3 border-t">
                <button
                  type="submit"
                  disabled={submitting || !selectedAddress || (formMode !== 'closed' && !formValid)}
                  className="w-full bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-primary-500/30 hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  {submitting ? 'Placing Order…'
                    : paymentMethod === 'COD' ? <>Place Order · ₹{total.toFixed(2)}</>
                    : <>Pay ₹{total.toFixed(2)}</>}
                </button>
                {!selectedAddress && (
                  <p className="text-[11px] text-orange-600 text-center mt-2">Add a shipping address to continue</p>
                )}
              </div>
            </div>

            <div className="bg-white border rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-900">Need help?</p>
              <a href={`tel:${PHONE_PRIMARY_TEL}`} className="flex items-center gap-2 hover:text-primary-500"><FiPhone size={12} /> {PHONE_PRIMARY_DISPLAY}</a>
              <a href={`mailto:${EMAIL_PRIMARY}`} className="flex items-center gap-2 hover:text-primary-500"><FiMail size={12} /> {EMAIL_PRIMARY}</a>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

// ====================================================================
// Subcomponents
// ====================================================================

function SavedAddressCard({ address: a, selected, onSelect, onEdit, onDelete, onSetDefault }) {
  // Pick a small visual cue for the label — Home / Office / generic.
  const labelLower = (a.label || '').toLowerCase();
  const Icon = labelLower.includes('office') || labelLower.includes('work') ? FiBriefcase : FiHome;

  return (
    <label
      className={`block border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition ${
        selected
          ? 'border-primary-500 bg-primary-50/40 ring-2 ring-primary-100'
          : 'border-gray-200 hover:border-primary-400'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="savedAddress"
          checked={selected}
          onChange={onSelect}
          className="mt-1 accent-primary-500 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <Icon className="text-gray-500 flex-shrink-0" size={14} />
            <span className="font-semibold text-sm">{a.fullName}</span>
            {a.label && (
              <span className="text-[10px] uppercase tracking-wide font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                {a.label}
              </span>
            )}
            {a.isDefault && (
              <span className="text-[10px] uppercase tracking-wide font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                Default
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-700 leading-snug">
            {a.street}, {a.city}, {a.state} {a.zip}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">+91 {a.phone}</p>

          {/* Actions row — only revealed when this card is selected to keep
              other cards visually clean. */}
          {selected && (
            <div className="flex gap-3 mt-2 pt-2 border-t border-primary-100 text-xs">
              <button type="button" onClick={(e) => { e.preventDefault(); onEdit(); }} className="text-primary-500 hover:underline font-semibold inline-flex items-center gap-1">
                <FiEdit2 size={11} /> Edit
              </button>
              {!a.isDefault && (
                <button type="button" onClick={(e) => { e.preventDefault(); onSetDefault(); }} className="text-gray-600 hover:text-gray-900 font-semibold">
                  Set as default
                </button>
              )}
              <button type="button" onClick={(e) => { e.preventDefault(); onDelete(); }} className="text-red-500 hover:text-red-700 font-semibold inline-flex items-center gap-1 ml-auto">
                <FiTrash2 size={11} /> Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </label>
  );
}

function AddressForm({ form, setForm, validation, showError, markTouched, pinLookup, lookupPin, isEdit, isGuest, saveAddress, setSaveAddress, onCancel, onSubmit, saving }) {
  // err(field) returns the validation error for that field — but only when
  // it should be visible (after blur or submit). Keeps the form quiet on
  // first render.
  const err = (field) => (showError(field) ? validation[field] : '');
  return (
    <div className="space-y-3 bg-gray-50/60 border-2 border-dashed border-gray-200 rounded-lg p-3 sm:p-4">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <FiMapPin /> {isEdit ? 'Edit address' : 'Add a new address'}
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field
          label="Full Name"
          value={form.fullName}
          onChange={(v) => setForm({ ...form, fullName: v })}
          onBlur={() => markTouched('fullName')}
          error={err('fullName')}
          required
        />
        <Field
          label="Mobile Number"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: cleanPhone(v) })}
          onBlur={() => markTouched('phone')}
          placeholder="9876543210"
          prefix="+91"
          maxLength={10}
          error={err('phone')}
          required
        />
      </div>
      <Field
        label="Flat / House / Building, Street"
        value={form.street}
        onChange={(v) => setForm({ ...form, street: v })}
        onBlur={() => markTouched('street')}
        placeholder="Flat 4, Mobin Apt, Amrut Nagar"
        error={err('street')}
        required
      />
      <div className="grid sm:grid-cols-3 gap-3">
        <Field
          label="PIN Code"
          value={form.zip}
          onChange={(v) => {
            const z = v.replace(/\D/g, '').slice(0, 6);
            setForm({ ...form, zip: z });
            if (PIN_RE.test(z)) lookupPin(z);
          }}
          onBlur={() => markTouched('zip')}
          placeholder="400612"
          maxLength={6}
          error={err('zip')}
          hint={pinLookup.loading ? 'Looking up…' : pinLookup.error}
          required
        />
        <Field
          label="City"
          value={form.city}
          onChange={(v) => setForm({ ...form, city: v })}
          onBlur={() => markTouched('city')}
          error={err('city')}
          required
        />
        <Field
          label="State"
          value={form.state}
          onChange={(v) => setForm({ ...form, state: v })}
          onBlur={() => markTouched('state')}
          error={err('state')}
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Label (optional)" value={form.label} onChange={(v) => setForm({ ...form, label: v.slice(0, 20) })} placeholder="Home, Office, Mom…" />
        {!isGuest && !isEdit && (
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:mt-7">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="accent-primary-500"
            />
            Save this address for next time
          </label>
        )}
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:mt-7">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="accent-primary-500"
            />
            Use as default address
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-semibold px-5 py-2.5 rounded-md transition"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : (saveAddress ? 'Save & Use' : 'Use this address')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2.5 font-semibold">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function Stepper({ steps }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-2">
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

function SectionCard({ n, title, icon, active, done, children }) {
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
      </header>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, onBlur, required, placeholder, prefix, maxLength, error, hint }) {
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
          onBlur={onBlur}
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
    <label className={`flex items-center gap-3 border-2 rounded-lg p-3 cursor-pointer transition ${
      selected ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-100' : 'border-gray-200 hover:border-primary-400'
    }`}>
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
