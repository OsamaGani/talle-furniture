import PolicyLayout from '../../components/PolicyLayout';

export default function Shipping() {
  return (
    <PolicyLayout title="Shipping Policy" lastUpdated="April 2026">
      <h2 className="text-xl font-bold mb-2">Where we ship</h2>
      <p className="text-gray-700 mb-4">We currently deliver to all serviceable PIN codes across India. International shipping is not yet available.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Shipping fees</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li><strong>Free Mumbai delivery</strong> on all orders above ₹2,999.</li>
        <li>Outside Mumbai: shipping calculated at checkout based on chair size and PIN code (chairs are bulky so freight is at cost).</li>
        <li>Local Mumbai delivery includes white-glove unpacking and basic placement assistance.</li>
        <li>Bulk and custom-manufacturing orders may have separate freight terms — agreed at quote time.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Delivery time</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>Metro cities (Mumbai, Pune, Delhi, Bangalore, etc.): 2–4 business days</li>
        <li>Non-metro cities: 4–7 business days</li>
        <li>Remote PIN codes: 7–10 business days</li>
        <li>Bulk / custom-manufacturing orders: 5–10 business days based on volume</li>
      </ul>
      <p className="text-gray-700 mb-4">Estimated dates are shown at checkout and on each order page. Delays may occur during festivals, severe weather, or due to courier partner constraints — we'll always keep you posted via email.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Order tracking</h2>
      <p className="text-gray-700 mb-4">
        You can track your order anytime from <strong>My Orders</strong> in your account. Once shipped, you'll receive an email with your tracking number and a link to follow the package.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Payment terms by location</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li><strong>Mumbai &amp; nearby areas:</strong> Cash on Delivery accepted on most orders. Pay the full amount to the delivery person when the chair arrives.</li>
        <li><strong>Outside Mumbai (pan-India):</strong> 70% advance payment online, 30% balance on delivery. This keeps freight costs covered while you keep some leverage until the chair is in your hands.</li>
        <li>Online prepayment (UPI / card / netbanking via Razorpay) is welcome from any location and unlocks a smoother dispatch.</li>
        <li>For bulk and custom-manufacturing orders, payment terms are agreed at quote time.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">If your package doesn't arrive</h2>
      <p className="text-gray-700 mb-4">If your order hasn't arrived within the expected window, please contact us at <a href="mailto:abdulrab2411@gmail.com" className="text-primary-500 hover:underline">abdulrab2411@gmail.com</a> or call <a href="tel:+919326166875" className="text-primary-500 hover:underline">+91 93261 66875</a>. We'll trace it with our courier partner and resolve quickly.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Address changes</h2>
      <p className="text-gray-700">If you need to change your shipping address after placing an order, contact us within 2 hours. Once the package leaves our warehouse, we may not be able to redirect it.</p>
    </PolicyLayout>
  );
}
