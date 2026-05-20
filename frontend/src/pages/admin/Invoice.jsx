import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import { FiPrinter } from 'react-icons/fi';

export default function Invoice() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/orders/${id}`);
        setOrder(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <Loader />;
  if (!order) return <p className="text-center py-20">Not found</p>;

  return (
    <div className="bg-gray-100 min-h-screen py-4 sm:py-6 px-3 sm:px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto bg-white shadow-lg p-4 sm:p-8 lg:p-10 print:shadow-none print:p-6">
        {/* Print button */}
        <div className="flex justify-end mb-4 print:hidden">
          <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2 text-sm">
            <FiPrinter /> Print / Save as PDF
          </button>
        </div>

        {/* Header — stacks on mobile, side-by-side on tablet+ */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b-4 border-primary-500 pb-4 mb-6 print:flex-row print:gap-0">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary-500">Talle</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">Furniture</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Shop No. 5, D'Souza Sadan, near Peninsula Grand Hotel</p>
            <p className="text-xs text-gray-600">Sainath Wadi, Lokmanya Tilak Nagar, Saki Naka</p>
            <p className="text-xs text-gray-600">Mumbai — 400072, Maharashtra, India</p>
            <p className="text-xs text-gray-600">+91 93261 66875 · abdulrab2411@gmail.com</p>
            <p className="text-xs text-gray-600">Proprietor: Abdul Rab · GSTIN: 27AAAAA0000A1Z5</p>
          </div>
          <div className="sm:text-right print:text-right">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-gray-900">Invoice</h1>
            <p className="text-sm font-mono mt-1 break-all sm:break-normal">{order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}</p>
            <p className="text-xs text-gray-600 mt-1">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Bill to / Ship to — stacks on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 text-sm print:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-gray-500 font-bold mb-1">Bill To</p>
            <p className="font-semibold">{order.shippingAddress.fullName}</p>
            <p className="text-gray-700 break-words">{order.user?.email}</p>
            <p className="text-gray-700">{order.shippingAddress.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 font-bold mb-1">Ship To</p>
            <p className="font-semibold">{order.shippingAddress.fullName}</p>
            <p className="text-gray-700">{order.shippingAddress.street}</p>
            <p className="text-gray-700">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            <p className="text-gray-700">{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Order info — 3 cols stays even on mobile (compact data) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 bg-gray-50 p-3 rounded text-[11px] sm:text-xs">
          <div><p className="text-gray-500">Payment Method</p><p className="font-semibold">{order.paymentMethod}</p></div>
          <div><p className="text-gray-500">Payment Status</p><p className="font-semibold">{order.isPaid ? 'PAID' : 'PENDING'}</p></div>
          <div><p className="text-gray-500">Order Status</p><p className="font-semibold uppercase">{order.status.replace(/_/g, ' ')}</p></div>
        </div>

        {/* Detailed payment receipt block — appears on the printed invoice
            so the customer sees exactly what was charged and how. */}
        {order.isPaid && order.paymentResult && (order.paymentResult.id || order.paymentResult.method) && (
          <div className="mb-6 border-2 border-emerald-200 bg-emerald-50/40 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase font-bold text-emerald-700">Payment Details</p>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">PAID ✓</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {order.paymentResult.provider && (
                <PRow label="Gateway" value={order.paymentResult.provider} />
              )}
              {order.paymentResult.method && (
                <PRow label="Method" value={order.paymentResult.method.toUpperCase()} />
              )}
              {order.paymentResult.vpa && (
                <PRow label="UPI ID" value={order.paymentResult.vpa} mono />
              )}
              {order.paymentResult.cardLast4 && (
                <PRow label="Card" value={`•••• ${order.paymentResult.cardLast4}${order.paymentResult.cardBrand ? ` (${order.paymentResult.cardBrand})` : ''}`} mono />
              )}
              {order.paymentResult.bank && order.paymentResult.method === 'netbanking' && (
                <PRow label="Bank" value={order.paymentResult.bank} />
              )}
              {order.paymentResult.id && (
                <PRow label="Transaction ID" value={order.paymentResult.id} mono />
              )}
              {order.paymentResult.rrn && (
                <PRow label="Bank Ref. No." value={order.paymentResult.rrn} mono />
              )}
              {(order.paymentResult.capturedAt || order.paidAt) && (
                <PRow label="Paid On" value={new Date(order.paymentResult.capturedAt || order.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} />
              )}
            </div>
          </div>
        )}

        {/* Items — desktop table */}
        <table className="hidden sm:table w-full text-sm mb-6">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={it._id} className="border-b">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">
                  {it.name}
                  {it.color && <span className="ml-2 text-[10px] text-gray-600">· Colour: <strong>{it.color}</strong></span>}
                </td>
                <td className="p-2 text-center">{it.qty}</td>
                <td className="p-2 text-right">₹{it.price.toFixed(2)}</td>
                <td className="p-2 text-right font-semibold">₹{(it.qty * it.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Items — mobile cards (better than a wide table on a 360px screen) */}
        <div className="sm:hidden mb-5 space-y-2 print:hidden">
          {order.items.map((it, i) => (
            <div key={it._id} className="border rounded-lg p-3 text-sm">
              <div className="flex justify-between gap-2">
                <p className="font-semibold flex-1 min-w-0">
                  {i + 1}. {it.name}
                </p>
                <p className="font-bold text-primary-600 whitespace-nowrap">₹{(it.qty * it.price).toFixed(2)}</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Qty: {it.qty} × ₹{it.price.toFixed(2)}
                {it.color && <> · Colour: <strong className="text-gray-800">{it.color}</strong></>}
              </p>
            </div>
          ))}
        </div>

        {/* Totals — full width on mobile, right-aligned card on desktop */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-1 text-sm">
            <Row label="Subtotal" value={`₹${order.itemsPrice.toFixed(2)}`} />
            <Row label="Shipping" value={order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice.toFixed(2)}`} />
            <Row label="Tax (5%)" value={`₹${order.taxPrice.toFixed(2)}`} />
            <hr className="my-2" />
            <div className="flex justify-between text-base sm:text-lg font-bold bg-primary-500 text-white p-2 rounded">
              <span>TOTAL</span><span>₹{order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t text-center text-xs text-gray-500">
          <p className="font-semibold">Thank you for shopping with Talle Furniture Mart!</p>
          <p className="mt-1">For returns or questions, contact abdulrab2411@gmail.com within 7 days of delivery.</p>
          <p className="mt-2">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between"><span className="text-gray-700">{label}</span><span className="font-semibold">{value}</span></div>
);

const PRow = ({ label, value, mono }) => (
  <div className="flex justify-between gap-2 py-1 border-b border-emerald-100 last:border-0">
    <span className="text-emerald-700/70">{label}</span>
    <span className={`font-semibold text-gray-900 break-all text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);
