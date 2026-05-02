import { FiCheckCircle, FiClock, FiPackage, FiTruck, FiHome, FiSlash, FiUser, FiBriefcase } from 'react-icons/fi';

const STEPS = [
  { key: 'pending',          label: 'Order Placed',     icon: <FiClock />,       desc: 'We received your order' },
  { key: 'confirmed',        label: 'Confirmed',        icon: <FiCheckCircle />, desc: 'Payment confirmed, order accepted' },
  { key: 'packed',           label: 'Packed',           icon: <FiPackage />,     desc: 'Items packed and ready to ship' },
  { key: 'shipped',          label: 'Shipped',          icon: <FiTruck />,       desc: 'Order handed to courier' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: <FiTruck />,       desc: 'Driver is on the way' },
  { key: 'delivered',        label: 'Delivered',        icon: <FiHome />,        desc: 'Successfully delivered' },
];

export default function OrderTimeline({ status, history = [], estimatedDelivery, trackingNumber, carrier, cancelledBy, cancelledAt }) {
  if (status === 'cancelled') {
    // Find the cancellation event in history for the timestamp; fall back
    // to cancelledAt prop, then to "today" if neither is set on legacy orders.
    const cancelEvent = history.find((h) => h.status === 'cancelled');
    const when = cancelledAt || cancelEvent?.at;
    const whenLabel = when ? new Date(when).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;
    const whoIcon = cancelledBy === 'admin' ? <FiBriefcase size={12} /> : <FiUser size={12} />;
    const whoLabel = cancelledBy === 'admin' ? 'by Toy Mall' : cancelledBy === 'customer' ? 'by you' : '';

    return (
      <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
          <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <FiSlash size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 text-sm sm:text-base">Order Cancelled</p>
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-red-700/80 mt-0.5">
              {whenLabel && <span>{whenLabel}</span>}
              {whoLabel && <>
                <span className="text-red-300">·</span>
                <span className="inline-flex items-center gap-1">{whoIcon} {whoLabel}</span>
              </>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const findEvent = (key) => history.find((h) => h.status === key);

  return (
    <div className="bg-white border rounded-lg p-5">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="font-bold text-lg">Order Tracking</h2>
          {estimatedDelivery && status !== 'delivered' && (
            <p className="text-sm text-gray-600 mt-1">
              Estimated delivery: <span className="font-semibold">{new Date(estimatedDelivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </p>
          )}
          {(carrier || trackingNumber) && (
            <div className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {carrier && (
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                  <FiTruck size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500">Delivery via</span>
                  <span className="font-semibold">{carrier}</span>
                </span>
              )}
              {trackingNumber && (
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                  <span className="text-xs text-gray-500">Tracking</span>
                  <span className="font-mono font-semibold">{trackingNumber}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop horizontal timeline */}
      <div className="hidden md:flex items-start justify-between relative">
        <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 z-0"></div>
        <div
          className="absolute top-5 left-5 h-1 bg-green-500 z-0 transition-all duration-700"
          style={{ width: currentIdx > 0 ? `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - ${currentIdx === STEPS.length - 1 ? '0' : '0px'})` : '0%' }}
        ></div>
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const event = findEvent(step.key);
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 w-full">
              <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition
                ${done ? 'bg-green-500 border-green-500 text-white' : ''}
                ${active ? 'bg-primary-500 border-primary-500 text-white animate-pulse' : ''}
                ${!done && !active ? 'bg-white border-gray-300 text-gray-400' : ''}`}>
                {step.icon}
              </div>
              <p className={`mt-2 text-xs font-semibold text-center ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {event && (
                <p className="text-[10px] text-gray-500 mt-0.5 text-center">
                  {new Date(event.at).toLocaleDateString()} <br /> {new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="md:hidden space-y-3">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const event = findEvent(step.key);
          return (
            <div key={step.key} className="flex gap-3 items-start">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm
                  ${done ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${active ? 'bg-primary-500 border-primary-500 text-white' : ''}
                  ${!done && !active ? 'bg-white border-gray-300 text-gray-400' : ''}`}>
                  {step.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-0.5 h-8 ${done ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                )}
              </div>
              <div className="flex-1 pt-1">
                <p className={`font-semibold text-sm ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
                {event && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{new Date(event.at).toLocaleString()}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
