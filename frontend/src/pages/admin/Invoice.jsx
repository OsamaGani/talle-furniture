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
    <div className="bg-gray-100 min-h-screen py-6 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto bg-white shadow-lg p-10 print:shadow-none print:p-6">
        {/* Print button */}
        <div className="flex justify-end mb-4 print:hidden">
          <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
            <FiPrinter /> Print / Save as PDF
          </button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-primary-500 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-3xl font-extrabold text-primary-500">Toy</span>
              <span className="text-3xl font-extrabold text-gray-900">Mall</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Mobin Apartment A Wing, Shop No. 4</p>
            <p className="text-xs text-gray-600">Amrut Nagar, Near Dargah Road</p>
            <p className="text-xs text-gray-600">Mumbra, Thane — 400612, Maharashtra, India</p>
            <p className="text-xs text-gray-600">+91 98000 00000 · Huraira735@gmail.com</p>
            <p className="text-xs text-gray-600">Owner: Abu Huraira Khan · GSTIN: 27AAAAA0000A1Z5</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-extrabold uppercase text-gray-900">Invoice</h1>
            <p className="text-sm font-mono mt-1">{order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}</p>
            <p className="text-xs text-gray-600 mt-1">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            {order.accountType === 'wholesale' && <p className="text-xs font-bold text-purple-600 mt-1">WHOLESALE INVOICE</p>}
          </div>
        </div>

        {/* Bill to */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-500 font-bold mb-1">Bill To</p>
            <p className="font-semibold">{order.shippingAddress.fullName}</p>
            <p className="text-gray-700">{order.user?.email}</p>
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

        {/* Order info */}
        <div className="grid grid-cols-3 gap-3 mb-6 bg-gray-50 p-3 rounded text-xs">
          <div><p className="text-gray-500">Payment Method</p><p className="font-semibold">{order.paymentMethod}</p></div>
          <div><p className="text-gray-500">Payment Status</p><p className="font-semibold">{order.isPaid ? 'PAID' : 'PENDING'}</p></div>
          <div><p className="text-gray-500">Order Status</p><p className="font-semibold uppercase">{order.status.replace(/_/g, ' ')}</p></div>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-6">
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
                  {it.isWholesalePrice && <span className="ml-2 text-[10px] text-purple-600 font-bold">(wholesale)</span>}
                </td>
                <td className="p-2 text-center">{it.qty}</td>
                <td className="p-2 text-right">₹{it.price.toFixed(2)}</td>
                <td className="p-2 text-right font-semibold">₹{(it.qty * it.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-1 text-sm">
            <Row label="Subtotal" value={`₹${order.itemsPrice.toFixed(2)}`} />
            <Row label="Shipping" value={order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice.toFixed(2)}`} />
            <Row label="Tax (5%)" value={`₹${order.taxPrice.toFixed(2)}`} />
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold bg-primary-500 text-white p-2 rounded">
              <span>TOTAL</span><span>₹{order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t text-center text-xs text-gray-500">
          <p className="font-semibold">Thank you for shopping with Toy Mall!</p>
          <p className="mt-1">For returns or questions, contact Huraira735@gmail.com within 7 days of delivery.</p>
          <p className="mt-2">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between"><span className="text-gray-700">{label}</span><span className="font-semibold">{value}</span></div>
);
