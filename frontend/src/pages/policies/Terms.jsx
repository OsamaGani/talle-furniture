import PolicyLayout from '../../components/PolicyLayout';

export default function Terms() {
  return (
    <PolicyLayout title="Terms of Service" lastUpdated="April 2026">
      <p className="text-gray-700 mb-4">
        By using tallefurnituremart.com or buying from Talle Furniture Mart, you agree to these terms. Please read them carefully.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">1. Your account</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>You must be at least 18 years old to create an account.</li>
        <li>You're responsible for keeping your password secure.</li>
        <li>The information you provide (name, email, address) must be accurate.</li>
        <li>One account per person.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">2. Orders &amp; pricing</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>All prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</li>
        <li>Bulk and custom-manufacturing orders are priced per quote — contact us for a written estimate before placing the order.</li>
        <li>We reserve the right to refuse, cancel, or limit any order — for example, if a product is mispriced or out of stock.</li>
        <li>An order is confirmed only when you receive an "Order confirmed" email from us.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">3. Payments</h2>
      <p className="text-gray-700 mb-4">We accept Cash on Delivery, debit/credit cards, UPI, Netbanking and Wallets via Razorpay. Payment is securely handled by our payment partners. Talle Furniture Mart does not store full card numbers.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">4. Delivery</h2>
      <p className="text-gray-700 mb-4">See our <a href="/shipping-policy" className="text-primary-500 hover:underline">Shipping Policy</a> for delivery times, fees, and tracking. Estimated delivery dates are not guaranteed but we work hard to meet them.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">5. Returns &amp; refunds</h2>
      <p className="text-gray-700 mb-4">See our <a href="/refund-policy" className="text-primary-500 hover:underline">Refund Policy</a> for how to return or exchange items.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">6. Intellectual property</h2>
      <p className="text-gray-700 mb-4">All photos, descriptions, logos and design on tallefurnituremart.com belong to Talle Furniture Mart. Every chair is manufactured in-house under our own Talle brand — we do not resell any third-party brand. Client company names appearing on the site are referenced with permission and remain trademarks of their respective owners.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">7. Acceptable use</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>Don't try to break into the site, scrape data, or disrupt service.</li>
        <li>Don't post fake reviews or impersonate others.</li>
        <li>Don't use the site for any unlawful purpose.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">8. Limitation of liability</h2>
      <p className="text-gray-700 mb-4">To the maximum extent permitted by law, Talle Furniture Mart is not liable for indirect or consequential losses. Our total liability for any single order is limited to the amount you paid for that order.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">9. Changes to these terms</h2>
      <p className="text-gray-700 mb-4">We may update these terms from time to time. The current version is always shown on this page with the "Last updated" date.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">10. Governing law</h2>
      <p className="text-gray-700">These terms are governed by the laws of India. Any disputes will be subject to the courts of Mumbai, Maharashtra.</p>
    </PolicyLayout>
  );
}
