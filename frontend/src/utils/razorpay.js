// Razorpay Checkout helper — loads the SDK script once on demand,
// then opens the hosted modal for an existing Razorpay order.
//
// Usage:
//   await openRazorpayCheckout({
//     keyId, razorpayOrderId, amount, currency, prefill, orderId,
//     onSuccess: (response) => { ... },
//     onDismiss: () => { ... },
//   });

import API from '../api/axios';
import toast from 'react-hot-toast';

const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let sdkLoadPromise = null;
function loadRazorpaySdk() {
  // Already loaded
  if (typeof window.Razorpay !== 'undefined') return Promise.resolve(true);
  // Loading in progress — return the same promise so we don't add 5 script tags
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Razorpay SDK failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SDK_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      sdkLoadPromise = null; // allow retry
      reject(new Error('Razorpay SDK failed to load — check your network'));
    };
    document.body.appendChild(script);
  });
  return sdkLoadPromise;
}

/**
 * Opens Razorpay Checkout for an order that already has a server-side
 * Razorpay order id.
 *
 * Caller should first POST /payment/razorpay/create-order to get
 * { keyId, razorpayOrderId, amount, currency, prefill, orderId }.
 */
export async function openRazorpayCheckout({
  keyId,
  razorpayOrderId,
  amount,
  currency = 'INR',
  prefill = {},
  orderId,
  onSuccess,
  onDismiss,
}) {
  await loadRazorpaySdk();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      name: 'Toy Mall',
      description: `Order #${String(orderId).slice(-8).toUpperCase()}`,
      image: '/logo.png',
      order_id: razorpayOrderId,
      prefill,
      theme: { color: '#e53935' },
      // After successful payment Razorpay returns these three values —
      // verify them on the server before flipping the order to paid.
      handler: async (response) => {
        try {
          const { data } = await API.post('/payment/razorpay/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });
          toast.success('Payment received — thank you!');
          onSuccess?.(data);
          resolve(data);
        } catch (err) {
          const msg = err.response?.data?.message || 'Payment verification failed';
          toast.error(msg);
          reject(err);
        }
      },
      modal: {
        ondismiss: () => {
          toast('Payment cancelled — your order is still pending. You can pay later.', { icon: '⚠️' });
          onDismiss?.();
          resolve(null);
        },
      },
    });

    // Surface payment failures (e.g. card declined) clearly.
    rzp.on('payment.failed', (resp) => {
      console.warn('Razorpay payment.failed:', resp.error);
      toast.error(resp.error?.description || 'Payment failed — please try again');
    });

    rzp.open();
  });
}
