import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import OrderTimeline from '../../components/OrderTimeline';
import toast from 'react-hot-toast';
import { FiPrinter, FiTag, FiArrowLeft, FiUser, FiMapPin, FiPhone, FiMail, FiCreditCard, FiTruck, FiBriefcase } from 'react-icons/fi';
import { resolveImage } from '../../utils/imageUrl';
import PaymentDetails from '../../components/PaymentDetails';

const STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/orders/${id}`);
      setOrder(data);
      setTrackingNumber(data.trackingNumber || '');
      setCarrier(data.carrier || '');
    } catch (e) { toast.error('Order not found'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const payload = { status: newStatus, note, trackingNumber, carrier };
      const { data } = await API.put(`/orders/${id}/status`, payload);
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      if (data.emailSent) {
        toast.success(`📧 Email notification sent to customer`, { duration: 3000 });
      }
      setNote('');
      load();
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const printInvoice = () => {
    window.open(`/admin/orders/${id}/invoice`, '_blank');
  };
  const printLabel = () => {
    window.open(`/admin/orders/${id}/label`, '_blank');
  };

  if (loading) return <Loader />;
  if (!order) return <p className="text-center py-20">Order not found</p>;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <Link to="/admin/orders" className="text-sm text-gray-500 hover:text-primary-500 flex items-center gap-1 mb-1"><FiArrowLeft /> Back to Orders</Link>
          <h1 className="text-2xl md:text-3xl font-bold font-mono">{order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}</h1>
          <p className="text-sm text-gray-600 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {order.accountType === 'wholesale' && (
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1"><FiBriefcase /> WHOLESALE</span>
          )}
          <button onClick={printLabel} className="bg-gray-900 hover:bg-black text-white font-semibold px-4 py-2 rounded inline-flex items-center gap-2 text-sm"><FiTag /> Shipping Label</button>
          <button onClick={printInvoice} className="btn-primary inline-flex items-center gap-2 text-sm"><FiPrinter /> Print Invoice</button>
        </div>
      </div>

      <OrderTimeline status={order.status} history={order.statusHistory} estimatedDelivery={order.estimatedDelivery} trackingNumber={order.trackingNumber} carrier={order.carrier} />

      {/* Status update controls */}
      <div className="bg-white border rounded-lg p-5 mt-4">
        <h2 className="font-bold mb-1 flex items-center gap-2"><FiTruck /> Update Order Status</h2>
        <p className="text-xs text-gray-500 mb-3">📧 Customer is automatically emailed on every status change</p>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Delivery via (optional)</label>
            <input
              list="carriers"
              className="input"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. Bluedart"
            />
            <datalist id="carriers">
              <option value="Bluedart" />
              <option value="FedEx" />
              <option value="DTDC" />
              <option value="Delhivery" />
              <option value="DHL" />
              <option value="Ekart" />
              <option value="India Post" />
              <option value="Shadowfax" />
              <option value="Xpressbees" />
              <option value="Self Delivery" />
            </datalist>
          </div>
          <div>
            <label className="label">Tracking Number (optional)</label>
            <input className="input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. TRK1234567890" />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any extra info for the customer" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={updating || order.status === s}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border-2
                ${order.status === s ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 hover:border-primary-500 hover:text-primary-500'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {s.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-4">
        <div className="space-y-4">
          {/* Customer details */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><FiUser /> Customer Details</h2>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <Info icon={<FiUser />} label="Name" value={order.user?.name || 'Guest'} />
              <Info icon={<FiMail />} label="Email" value={order.user?.email} />
              <Info icon={<FiPhone />} label="Phone" value={order.shippingAddress?.phone} />
              <Info icon={<FiBriefcase />} label="Account Type" value={order.accountType?.toUpperCase() || 'RETAIL'} />
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><FiMapPin /> Shipping Address</h2>
            <p className="font-semibold">{order.shippingAddress.fullName}</p>
            <p className="text-gray-700 text-sm mt-1">{order.shippingAddress.street}</p>
            <p className="text-gray-700 text-sm">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            <p className="text-gray-700 text-sm">{order.shippingAddress.country}</p>
            <p className="text-gray-700 text-sm mt-2"><FiPhone className="inline mr-1" />{order.shippingAddress.phone}</p>
          </div>

          {/* Items */}
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-bold text-lg mb-3">Items ({order.items.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2">Product</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Unit</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it._id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <img src={resolveImage(it.image)} className="w-10 h-10 rounded border bg-gray-50 object-contain p-1" alt="" />
                          <Link to={`/product/${it.product}`} className="hover:text-primary-500">
                            {it.name}
                            {it.isWholesalePrice && <span className="ml-2 bg-purple-100 text-purple-700 text-[10px] px-1 py-0.5 rounded font-bold">W</span>}
                          </Link>
                        </div>
                      </td>
                      <td className="text-center">{it.qty}</td>
                      <td className="text-right">₹{it.price.toFixed(2)}</td>
                      <td className="text-right font-semibold">₹{(it.qty * it.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <PaymentDetails order={order} compact />

          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-bold mb-3">Bill Summary</h2>
            <Row label="Subtotal" value={`₹${order.itemsPrice.toFixed(2)}`} />
            <Row label="Shipping" value={order.shippingPrice === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `₹${order.shippingPrice.toFixed(2)}`} />
            <Row label="Tax" value={`₹${order.taxPrice.toFixed(2)}`} />
            <hr className="my-2" />
            <Row label="Total" value={`₹${order.totalPrice.toFixed(2)}`} bold />
          </div>

          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-bold mb-3">Status History</h2>
            <ol className="space-y-2 text-xs">
              {order.statusHistory?.slice().reverse().map((h, i) => (
                <li key={i} className="border-l-2 border-primary-500 pl-2">
                  <p className="font-semibold uppercase">{h.status.replace(/_/g, ' ')}</p>
                  <p className="text-gray-500">{new Date(h.at).toLocaleString()}</p>
                  {h.note && <p className="text-gray-600 italic">"{h.note}"</p>}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

const Info = ({ icon, label, value }) => (
  <div>
    <p className="text-xs text-gray-500 flex items-center gap-1">{icon} {label}</p>
    <p className="font-medium">{value || '-'}</p>
  </div>
);
const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between py-1 ${bold ? 'text-base font-bold' : 'text-sm text-gray-700'}`}>
    <span>{label}</span><span>{value}</span>
  </div>
);
