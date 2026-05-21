import { useEffect, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import Loader from '../components/Loader';
import OrderTimeline from '../components/OrderTimeline';
import { useAuth } from '../context/AuthContext';
import { resolveImage } from '../utils/imageUrl';
import { openRazorpayCheckout } from '../utils/razorpay';
import PaymentDetails from '../components/PaymentDetails';
import toast from 'react-hot-toast';
import { FiMapPin, FiCreditCard, FiPhone, FiXCircle, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

// Reasons offered in the cancel modal — last one is "Other" with a free
// text field. Order matters: most-likely first.
const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price elsewhere',
  'Ordered the wrong item',
  'Delivery is taking too long',
  'Want to change shipping address',
  'Other',
];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { status, message }
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    // Skip the customer-facing fetch if we're about to redirect this admin away.
    if (isAdmin) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await API.get(`/orders/${id}`);
        setOrder(data);
      } catch (e) {
        setError({
          status: e.response?.status,
          message: e.response?.data?.message || 'Could not load order',
        });
      } finally { setLoading(false); }
    })();
  }, [id, isAdmin]);

  // Admins shouldn't see the customer-facing order page — send them straight
  // to the admin equivalent which has status updates, tracking, invoice, etc.
  if (isAdmin) {
    return <Navigate to={`/admin/orders/${id}`} replace />;
  }

  if (loading) return <Loader />;
  if (error || !order) {
    const status = error?.status;
    const isForbidden = status === 403;
    const isNotFound = status === 404 || !error;
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white border rounded-xl p-8 shadow-sm">
          <div className="text-5xl mb-3">{isForbidden ? '🔒' : '🔍'}</div>
          <h1 className="text-xl font-bold mb-2">
            {isForbidden ? 'This order isn\'t yours' : isNotFound ? 'Order not found' : 'Something went wrong'}
          </h1>
          <p className="text-gray-600 text-sm mb-5">
            {isForbidden
              ? 'You can only view orders placed from your own account. Sign in with the account that placed this order to see its details.'
              : isNotFound
                ? 'We couldn\'t find this order. It may have been removed, or the link you followed is invalid.'
                : (error?.message || 'Please try again in a moment.')}
          </p>
          <div className="flex justify-center gap-2">
            <Link to="/orders" className="btn-primary">View My Orders</Link>
            <Link to="/" className="border px-5 py-2.5 rounded hover:bg-gray-50">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <p className="text-sm text-gray-500">Order Number</p>
          <h1 className="text-xl md:text-2xl font-bold font-mono">{order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}</h1>
          <p className="text-sm text-gray-600 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <OrderTimeline
        status={order.status}
        history={order.statusHistory}
        estimatedDelivery={order.estimatedDelivery}
        trackingNumber={order.trackingNumber}
        carrier={order.carrier}
        cancelledBy={order.cancelledBy}
        cancelledAt={order.cancelledAt}
      />

      {/* Refund status banner — only when there's actual refund info to share.
          For COD/not_applicable, the cancellation header on the timeline is
          enough on its own; rendering a second "no refund needed" card just
          duplicates the message. */}
      {order.status === 'cancelled' && order.refund?.status &&
       order.refund.status !== 'not_applicable' && (
        <RefundBanner order={order} />
      )}

      {/* Retry-payment banner for unpaid Razorpay orders. */}
      {!order.isPaid && order.paymentMethod === 'Razorpay' && order.status !== 'cancelled' && (
        <PayNowBanner
          orderId={order._id}
          total={order.totalPrice}
          onPaid={(updated) => setOrder(updated)}
        />
      )}

      {/* Cancel Order — only visible while the order is still cancellable.
          Hidden once it's been packed/shipped (customer must contact us for
          returns instead) and on cancelled orders. */}
      {['pending', 'confirmed'].includes(order.status) && (
        <div className="mt-5 bg-white border rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">Need to cancel this order?</p>
            <p className="text-sm text-gray-600 mt-0.5">
              You can cancel any time before it's packed.
              {order.isPaid && order.paymentMethod === 'Razorpay' && (
                <> Refund of ₹{order.totalPrice.toFixed(2)} will be returned to your original payment method in 5–7 business days.</>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowCancel(true)}
            className="inline-flex items-center gap-1.5 border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-semibold px-4 py-2 rounded-md transition whitespace-nowrap"
          >
            <FiXCircle size={16} /> Cancel Order
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
        <div className="space-y-4">
          <Card title={`Items (${order.items.length})`}>
            {order.items.map((it) => (
              <div key={it._id} className="flex gap-3 py-3 border-b last:border-0">
                <Link to={`/product/${it.product}`} className="w-20 h-20 bg-gray-50 border rounded overflow-hidden p-2 flex-shrink-0">
                  <img src={resolveImage(it.image)} className="w-full h-full object-contain" alt={it.name} />
                </Link>
                <div className="flex-1">
                  <Link to={`/product/${it.product}`} className="font-medium hover:text-primary-500">{it.name}</Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-sm text-gray-500">Qty: {it.qty} × ₹{it.price}</p>
                    {it.color && (
                      <span className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                        Color: <span className="text-gray-900">{it.color}</span>
                      </span>
                    )}
                  </div>
                </div>
                <p className="font-bold">₹{(it.qty * it.price).toFixed(2)}</p>
              </div>
            ))}
          </Card>

          <Card title={<span className="flex items-center gap-2"><FiMapPin /> Shipping Address</span>}>
            <p className="font-semibold">{order.shippingAddress.fullName}</p>
            <p className="text-gray-600 text-sm mt-1">{order.shippingAddress.street}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress.country}</p>
            <p className="text-gray-600 text-sm mt-2 flex items-center gap-1"><FiPhone size={14} /> {order.shippingAddress.phone}</p>
          </Card>
        </div>

        <aside className="space-y-3">
          <PaymentDetails order={order} compact />
          <Card title="Bill Summary">
            <Row label="Subtotal" value={`₹${order.itemsPrice.toFixed(2)}`} />
            <Row label="Shipping" value={order.shippingPrice === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `₹${order.shippingPrice.toFixed(2)}`} />
            <Row label="Tax" value={`₹${order.taxPrice.toFixed(2)}`} />
            <hr className="my-2" />
            <Row label="Total" value={`₹${order.totalPrice.toFixed(2)}`} bold />
          </Card>
        </aside>
      </div>

      {showCancel && (
        <CancelOrderModal
          order={order}
          onClose={() => setShowCancel(false)}
          onCancelled={(updated) => { setOrder(updated); setShowCancel(false); }}
        />
      )}
    </div>
  );
}

// ====================================================================
// Cancel modal — collects an optional reason, shows the customer what
// will happen to their money (Razorpay refund vs nothing for COD), and
// posts to /orders/:id/cancel.
// ====================================================================
function CancelOrderModal({ order, onClose, onCancelled }) {
  const [reasonChoice, setReasonChoice] = useState('');
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const willRefund = order.isPaid && order.paymentMethod === 'Razorpay';
  const finalReason = reasonChoice === 'Other' ? otherText.trim() : reasonChoice;

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await API.put(`/orders/${order._id}/cancel`, { reason: finalReason });
      toast.success(
        willRefund
          ? 'Order cancelled. Refund initiated — check back in 5–7 days.'
          : 'Order cancelled successfully.'
      );
      onCancelled(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel the order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-5 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FiXCircle className="text-red-500" /> Cancel this order?
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 -mt-1" aria-label="Close">
            <FiX size={22} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Refund preview — sets expectations BEFORE they confirm. */}
          {willRefund ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-2">
              <FiCheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-800">Refund of ₹{order.totalPrice.toFixed(2)}</p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Will be returned to your original payment method automatically. Most banks credit within 5–7 business days.
                </p>
              </div>
            </div>
          ) : order.paymentMethod === 'COD' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
              <FiCheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800">No refund needed</p>
                <p className="text-blue-700 text-xs mt-0.5">
                  This is a Cash on Delivery order — you haven't been charged. Just confirm to cancel.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex gap-2">
              <FiAlertCircle className="text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                Confirm cancellation below. Your stock reservation will be released.
              </p>
            </div>
          )}

          {/* Reason selection */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Why are you cancelling? <span className="text-gray-400 font-normal">(optional, helps us improve)</span>
            </label>
            <div className="space-y-1">
              {CANCEL_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={reasonChoice === r}
                    onChange={(e) => setReasonChoice(e.target.value)}
                    className="accent-primary-500"
                  />
                  {r}
                </label>
              ))}
            </div>
            {reasonChoice === 'Other' && (
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Tell us a bit more (optional)"
                rows={3}
                maxLength={200}
                className="mt-2 w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-md focus:border-primary-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t px-5 py-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition"
          >
            Keep Order
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-md transition inline-flex items-center gap-1.5"
          >
            {submitting ? 'Cancelling…' : 'Yes, Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// Refund status banner shown on cancelled orders so the customer always
// knows where their money is. Different copy per refund state.
// ====================================================================
function RefundBanner({ order }) {
  const r = order.refund || {};

  if (r.status === 'initiated') {
    return (
      <div className="mt-5 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <FiCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={22} />
          <div className="flex-1">
            <p className="font-bold text-emerald-900">Refund of ₹{(r.amount / 100).toFixed(2)} initiated</p>
            <p className="text-sm text-emerald-800 mt-1">
              The amount has been sent back to your original payment method. Most banks credit within
              <strong> 5–7 business days</strong>. We'll email you when it's confirmed.
            </p>
            {r.id && <p className="text-xs text-emerald-700 mt-1.5 font-mono">Refund ID: {r.id}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (r.status === 'completed') {
    return (
      <div className="mt-5 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4 sm:p-5 flex items-start gap-3">
        <FiCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={22} />
        <div>
          <p className="font-bold text-emerald-900">Refund completed</p>
          <p className="text-sm text-emerald-800 mt-1">₹{(r.amount / 100).toFixed(2)} returned to your account.</p>
        </div>
      </div>
    );
  }

  if (r.status === 'pending_manual') {
    return (
      <div className="mt-5 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 sm:p-5 flex items-start gap-3">
        <FiAlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={22} />
        <div>
          <p className="font-bold text-amber-900">Refund being processed manually</p>
          <p className="text-sm text-amber-800 mt-1">
            Your order is cancelled. Our team is processing your ₹{order.totalPrice.toFixed(2)} refund manually and will reach out within
            <strong> 1–2 business days</strong>. Please contact support if you have questions.
          </p>
        </div>
      </div>
    );
  }

  if (r.status === 'not_applicable' && order.paymentMethod === 'COD') {
    return (
      <div className="mt-5 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 sm:p-5 flex items-start gap-3">
        <FiCheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={22} />
        <div>
          <p className="font-bold text-blue-900">Order cancelled</p>
          <p className="text-sm text-blue-800 mt-1">
            This was a Cash on Delivery order, so no payment was made — there's nothing to refund.
          </p>
        </div>
      </div>
    );
  }

  // Fallback for older cancelled orders without a refund record
  return (
    <div className="mt-5 bg-gray-50 border rounded-lg p-4 sm:p-5 flex items-start gap-3">
      <FiAlertCircle className="text-gray-500 flex-shrink-0 mt-0.5" size={20} />
      <div>
        <p className="font-bold text-gray-900">Order cancelled</p>
        <p className="text-sm text-gray-700 mt-1">
          {order.isPaid
            ? 'Contact support to confirm your refund status.'
            : 'No payment was processed for this order.'}
        </p>
      </div>
    </div>
  );
}

function PayNowBanner({ orderId, total, onPaid }) {
  const [loading, setLoading] = useState(false);
  const handleRetry = async () => {
    setLoading(true);
    try {
      const { data: session } = await API.post('/payment/razorpay/create-order', { orderId });
      const result = await openRazorpayCheckout({
        ...session,
        onSuccess: (updated) => onPaid?.(updated),
        onDismiss: () => setLoading(false),
      });
      if (result) onPaid?.(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mt-5 bg-gray-900 text-white rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-md ring-1 ring-black/5">
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-[2px] text-amber-300 font-bold mb-1">Payment pending</p>
        <p className="font-bold text-base sm:text-lg">Complete your payment</p>
        <p className="text-sm text-white/80 mt-1">
          Your order is reserved but unpaid. Pay <strong className="text-white">₹{total.toFixed(2)}</strong> securely via Razorpay to confirm.
        </p>
      </div>
      <button
        onClick={handleRetry}
        disabled={loading}
        className="bg-white text-gray-900 hover:bg-amber-300 font-semibold text-sm px-5 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition whitespace-nowrap active:scale-[0.99]"
      >
        {loading ? 'Loading…' : 'Pay Now →'}
      </button>
    </div>
  );
}

const Card = ({ title, children }) => (
  <div className="bg-white border rounded-lg p-5">
    <h2 className="font-bold text-lg mb-3">{title}</h2>
    {children}
  </div>
);
const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between ${bold ? 'text-lg font-bold' : 'text-sm text-gray-700'}`}>
    <span>{label}</span><span>{value}</span>
  </div>
);
