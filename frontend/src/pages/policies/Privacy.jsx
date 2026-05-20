import PolicyLayout from '../../components/PolicyLayout';

export default function Privacy() {
  return (
    <PolicyLayout title="Privacy Policy" lastUpdated="April 2026">
      <p className="text-gray-700 mb-4">
        Talle Furniture Mart ("we", "our") respects your privacy. This page explains what we collect, why we collect it, and how we keep it safe.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">What we collect</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li><strong>Account info:</strong> name, email, phone, password (hashed), and optional address.</li>
        <li><strong>Order info:</strong> items purchased, shipping address, payment method, order history.</li>
        <li><strong>Technical info:</strong> browser, device, and basic usage analytics to keep the site running well.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Why we collect it</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>To process your orders and send shipping updates.</li>
        <li>To verify your email address with a one-time code.</li>
        <li>To answer your support requests.</li>
        <li>To improve our store and recommend chairs you might like.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">What we don't do</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>We <strong>do not sell</strong> your personal data to third parties.</li>
        <li>We don't share your information with advertisers.</li>
        <li>We don't store your full payment card details — these are handled securely by Razorpay (PCI-DSS compliant) and your issuing bank.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Cookies</h2>
      <p className="text-gray-700 mb-4">We use essential cookies to keep you logged in and remember items in your cart. We may also use anonymous analytics cookies to understand which pages are most useful.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Your rights</h2>
      <p className="text-gray-700 mb-4">You can:</p>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>View and update your account at any time from your <strong>Profile</strong> page.</li>
        <li>Request a copy of all data we hold about you.</li>
        <li>Ask us to delete your account and personal data (we may need to keep some order records for tax compliance).</li>
        <li>Unsubscribe from marketing emails using the link in any email.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Security</h2>
      <p className="text-gray-700 mb-4">All passwords are stored using industry-standard hashing. Login is protected with JWT tokens and HTTPS. We regularly review our systems to keep your data safe.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Children's privacy</h2>
      <p className="text-gray-700 mb-4">Our store is for parents and adult buyers. We don't knowingly collect data from children under 13. If you believe a child has signed up, please contact us and we'll remove the account.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Contact</h2>
      <p className="text-gray-700">Privacy questions? Write to <a href="mailto:abdulrab2411@gmail.com" className="text-primary-500 hover:underline">abdulrab2411@gmail.com</a> or by post: Talle Furniture Mart, Shop No. 5, D'Souza Sadan, near Peninsula Grand Hotel, Sainath Wadi, Lokmanya Tilak Nagar, Saki Naka, Mumbai — 400072.</p>
    </PolicyLayout>
  );
}
