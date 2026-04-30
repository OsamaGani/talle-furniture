import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import { FiPrinter, FiPackage } from 'react-icons/fi';

export default function ShippingLabel() {
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

  const isCOD = order.paymentMethod === 'COD' && !order.isPaid;
  const totalQty = order.items.reduce((s, i) => s + i.qty, 0);
  // Simple barcode look from order number
  const bars = (order.orderNumber || order._id).slice(-12).split('').map((c) => c.charCodeAt(0) % 4);

  return (
    <div className="bg-gray-200 min-h-screen py-6 px-4 print:bg-white print:py-0 print:px-0">
      {/* Print button */}
      <div className="max-w-md mx-auto mb-4 flex justify-end print:hidden">
        <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
          <FiPrinter /> Print Shipping Label
        </button>
      </div>

      {/* Label - 4x6 inch standard shipping label size */}
      <div className="max-w-md mx-auto bg-white border-2 border-black shadow-lg print:shadow-none print:border-2 print:border-black">
        {/* Header strip */}
        <div className="bg-black text-white px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-extrabold text-primary-500">Toy</span>
            <span className="text-xl font-extrabold text-white">Mall</span>
          </div>
          {isCOD && (
            <span className="bg-yellow-400 text-black px-3 py-1 text-sm font-extrabold rounded">COD ₹{order.totalPrice.toFixed(2)}</span>
          )}
          {!isCOD && (
            <span className="bg-green-500 text-white px-3 py-1 text-sm font-extrabold rounded">PREPAID</span>
          )}
        </div>

        {/* FROM */}
        <div className="px-3 py-2 border-b-2 border-black text-xs">
          <p className="font-bold text-gray-500 uppercase text-[10px]">From / Pickup Address</p>
          <p className="font-bold text-sm">Toy Mall</p>
          <p>Mobin Apartment A Wing, Shop No. 4</p>
          <p>Amrut Nagar, Near Dargah Road</p>
          <p>Mumbra, Thane — 400612</p>
          <p>📞 +91 86557 87075</p>
        </div>

        {/* TO - the most prominent */}
        <div className="px-3 py-3 border-b-2 border-black bg-gray-50">
          <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">Deliver To</p>
          <p className="font-extrabold text-lg leading-tight">{order.shippingAddress.fullName}</p>
          <p className="text-sm font-medium leading-snug mt-1">{order.shippingAddress.street}</p>
          <p className="text-sm font-medium leading-snug">
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>
          <p className="text-base font-extrabold leading-snug">PIN — {order.shippingAddress.zip}</p>
          <p className="text-sm font-medium">{order.shippingAddress.country}</p>
          <p className="text-sm font-bold mt-1">📞 {order.shippingAddress.phone}</p>
        </div>

        {/* Order info strip */}
        <div className="px-3 py-2 border-b-2 border-black grid grid-cols-3 text-xs">
          <div>
            <p className="text-gray-500 text-[9px] uppercase">Order #</p>
            <p className="font-mono font-bold">{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[9px] uppercase">Date</p>
            <p className="font-bold">{new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[9px] uppercase">Items</p>
            <p className="font-bold">{order.items.length} sku · {totalQty} qty</p>
          </div>
        </div>

        {/* Items mini list with prices — handy for COD verification & courier reference */}
        <div className="px-3 py-2 border-b-2 border-black">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-500 text-[9px] uppercase font-bold">Package Contents</p>
            <p className="text-gray-500 text-[9px] uppercase font-bold">Amount</p>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {order.items.map((it, i) => (
                <tr key={it._id} className="border-b last:border-0 align-top">
                  <td className="py-1 w-6">{i + 1}.</td>
                  <td className="py-1 pr-2">
                    <p className="truncate max-w-[180px] font-medium">{it.name}</p>
                    <p className="text-[10px] text-gray-600">×{it.qty} @ ₹{it.price.toFixed(2)}</p>
                  </td>
                  <td className="py-1 text-right font-bold whitespace-nowrap">₹{(it.qty * it.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black">
                <td colSpan={2} className="pt-1.5 text-[10px] text-gray-600">Subtotal</td>
                <td className="pt-1.5 text-right font-semibold">₹{order.itemsPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={2} className="text-[10px] text-gray-600">Shipping</td>
                <td className="text-right font-semibold">{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice.toFixed(2)}`}</td>
              </tr>
              {order.taxPrice > 0 && (
                <tr>
                  <td colSpan={2} className="text-[10px] text-gray-600">Tax</td>
                  <td className="text-right font-semibold">₹{order.taxPrice.toFixed(2)}</td>
                </tr>
              )}
              <tr className="border-t border-black">
                <td colSpan={2} className="pt-1.5 text-xs font-extrabold uppercase">Total</td>
                <td className="pt-1.5 text-right text-sm font-extrabold">₹{order.totalPrice.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Barcode-style strip */}
        <div className="px-3 py-3 border-b-2 border-black bg-white text-center">
          <div className="flex justify-center items-end h-12 gap-px">
            {[...bars, ...bars, ...bars].map((b, i) => (
              <div key={i} className="bg-black" style={{ width: b === 0 ? 1 : b === 1 ? 2 : b === 2 ? 3 : 1, height: '100%' }}></div>
            ))}
          </div>
          <p className="font-mono text-[11px] mt-1 tracking-widest">{order.orderNumber || order._id.slice(-12).toUpperCase()}</p>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 text-[10px] text-center bg-gray-100">
          <p className="font-semibold">📦 Handle with care · Fragile toys</p>
          <p className="text-gray-600">Returns to: Toy Mall, Mobin Apartment A Wing, Shop No. 4, Mumbra, Thane — within 7 days</p>
        </div>
      </div>

      {/* Print instructions (hidden when printing) */}
      <div className="max-w-md mx-auto mt-4 text-center text-xs text-gray-600 print:hidden">
        <p>📌 Print this label on a 4×6 inch sticker, A6 paper, or normal A4.</p>
        <p>Tape it on the outside of the package facing up.</p>
      </div>
    </div>
  );
}
