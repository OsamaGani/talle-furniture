import PolicyLayout from '../../components/PolicyLayout';

export default function Shipping() {
  return (
    <PolicyLayout title="Shipping Policy" lastUpdated="April 2026">
      <h2 className="text-xl font-bold mb-2">Where we ship</h2>
      <p className="text-gray-700 mb-4">We currently deliver to all serviceable PIN codes across India. International shipping is not yet available.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Shipping fees</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li><strong>Free shipping</strong> on all orders above ₹999.</li>
        <li>A flat shipping fee of <strong>₹50</strong> applies to orders below ₹999.</li>
        <li>Wholesale orders may have separate freight terms — see your wholesale agreement.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Delivery time</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>Metro cities (Mumbai, Pune, Delhi, Bangalore, etc.): 2–4 business days</li>
        <li>Non-metro cities: 4–7 business days</li>
        <li>Remote PIN codes: 7–10 business days</li>
        <li>Wholesale / bulk orders: 5–10 business days based on volume</li>
      </ul>
      <p className="text-gray-700 mb-4">Estimated dates are shown at checkout and on each order page. Delays may occur during festivals, severe weather, or due to courier partner constraints — we'll always keep you posted via email.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Order tracking</h2>
      <p className="text-gray-700 mb-4">
        You can track your order anytime from <strong>My Orders</strong> in your account. Once shipped, you'll receive an email with your tracking number and a link to follow the package.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Cash on Delivery (COD)</h2>
      <p className="text-gray-700 mb-4">COD is available on most PIN codes for orders below ₹10,000. The exact COD amount is printed on the package label so the courier can collect it accurately.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">If your package doesn't arrive</h2>
      <p className="text-gray-700 mb-4">If your order hasn't arrived within the expected window, please contact us at <a href="mailto:support@toymall.in" className="text-primary-500 hover:underline">support@toymall.in</a> or call <a href="tel:+917738028750" className="text-primary-500 hover:underline">+91 77380 28750</a>. We'll trace it with our courier partner and resolve quickly.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Address changes</h2>
      <p className="text-gray-700">If you need to change your shipping address after placing an order, contact us within 2 hours. Once the package leaves our warehouse, we may not be able to redirect it.</p>
    </PolicyLayout>
  );
}
