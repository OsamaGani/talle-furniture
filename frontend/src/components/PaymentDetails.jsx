import { FiCreditCard, FiSmartphone, FiHome, FiCheckCircle, FiClock } from 'react-icons/fi';

// Method-specific icon + display label, mirroring how Flipkart / Amazon show
// payment receipts to customers.
function methodMeta(method = '', wallet = '') {
  switch ((method || '').toLowerCase()) {
    case 'upi':        return { icon: <FiSmartphone />, label: 'UPI', color: 'text-purple-600 bg-purple-50' };
    case 'card':       return { icon: <FiCreditCard />, label: 'Card',         color: 'text-blue-600 bg-blue-50' };
    case 'netbanking': return { icon: <FiHome />,       label: 'Net Banking',  color: 'text-emerald-600 bg-emerald-50' };
    case 'wallet':     return { icon: <FiSmartphone />, label: wallet ? `${wallet} Wallet` : 'Wallet', color: 'text-orange-600 bg-orange-50' };
    case 'emi':        return { icon: <FiCreditCard />, label: 'EMI',          color: 'text-indigo-600 bg-indigo-50' };
    default:           return { icon: <FiCreditCard />, label: method || 'Online', color: 'text-gray-600 bg-gray-100' };
  }
}

const fmt = (val) => (val == null ? '—' : val);

export default function PaymentDetails({ order, compact = false }) {
  if (!order) return null;
  const pr = order.paymentResult || {};
  const isPaid = !!order.isPaid;
  const isCOD = order.paymentMethod === 'COD';

  // === COD card — much simpler ===
  if (isCOD) {
    return (
      <div className={`bg-white border rounded-lg ${compact ? 'p-4' : 'p-5'}`}>
        <h2 className={`font-bold ${compact ? 'text-base' : 'text-lg'} mb-3 flex items-center gap-2`}>
          <FiCreditCard /> Payment Details
        </h2>
        <Row label="Method" value={<span className="font-semibold">Cash on Delivery</span>} />
        <Row label="Status" value={
          isPaid
            ? <span className="text-green-600 font-semibold inline-flex items-center gap-1"><FiCheckCircle size={14} /> Paid on delivery</span>
            : <span className="text-orange-600 font-semibold inline-flex items-center gap-1"><FiClock size={14} /> Pay at delivery</span>
        } />
        {isPaid && order.paidAt && (
          <Row label="Collected on" value={new Date(order.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} />
        )}
        <Row label="Amount" value={<span className="font-bold">₹{order.totalPrice.toFixed(2)}</span>} />
      </div>
    );
  }

  // === Online (Razorpay / Stripe) ===
  const m = methodMeta(pr.method, pr.wallet);
  const last4 = pr.cardLast4;
  const cardLine = last4 ? `•••• ${last4}${pr.cardBrand ? ` (${pr.cardBrand})` : ''}${pr.cardType ? ` · ${pr.cardType}` : ''}` : '';
  const txnId = pr.id || '—';
  const shortTxnId = txnId.length > 14 ? `${txnId.slice(0, 8)}…${txnId.slice(-6)}` : txnId;

  return (
    <div className={`bg-white border rounded-lg ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`font-bold ${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
          <FiCreditCard /> Payment Details
        </h2>
        {isPaid && (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
            <FiCheckCircle size={12} /> PAID
          </span>
        )}
      </div>

      {/* Method header — coloured badge like Flipkart */}
      {pr.method && (
        <div className={`${m.color} rounded-lg px-3 py-2.5 mb-3 inline-flex items-center gap-2 text-sm font-semibold`}>
          {m.icon}
          <span>Paid via {m.label}</span>
        </div>
      )}

      <div className="space-y-1.5 text-sm">
        {/* Gateway */}
        {pr.provider && <Row label="Gateway" value={pr.provider} />}

        {/* Method-specific identifiers */}
        {pr.vpa && <Row label="UPI ID" value={<span className="font-mono">{pr.vpa}</span>} />}
        {cardLine && <Row label="Card" value={<span className="font-mono">{cardLine}</span>} />}
        {pr.bank && pr.method === 'netbanking' && <Row label="Bank" value={pr.bank} />}
        {pr.wallet && pr.method === 'wallet' && <Row label="Wallet" value={pr.wallet} />}

        {/* Transaction identifiers */}
        <Row
          label="Transaction ID"
          value={<span className="font-mono break-all" title={txnId}>{compact ? shortTxnId : txnId}</span>}
        />
        {pr.rrn && <Row label="Bank Ref. No." value={<span className="font-mono">{pr.rrn}</span>} />}

        {/* Timing */}
        {(pr.capturedAt || order.paidAt) && (
          <Row
            label="Paid on"
            value={new Date(pr.capturedAt || order.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          />
        )}

        {/* Amount */}
        <Row label="Amount" value={<span className="font-bold">₹{order.totalPrice.toFixed(2)}</span>} />

        {/* Email shown on the receipt — small text */}
        {pr.email && <Row label="Email" value={<span className="break-all text-xs">{pr.email}</span>} />}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">{label}</span>
      <span className="text-gray-900 text-xs sm:text-sm text-right min-w-0">{value}</span>
    </div>
  );
}
