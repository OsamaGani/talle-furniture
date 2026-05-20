import PolicyLayout from '../../components/PolicyLayout';

export default function Refund() {
  return (
    <PolicyLayout title="Refund &amp; Returns Policy" lastUpdated="April 2026">
      <p className="text-gray-700 mb-4">
        We want every order to bring a smile. If something isn't right, here's how we'll make it right.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Returns window</h2>
      <p className="text-gray-700 mb-4">You can request a return within <strong>7 days</strong> of delivery. Items must be unused, in their original packaging, with all tags and accessories intact.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">What can be returned</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>Damaged or defective products</li>
        <li>Wrong item delivered</li>
        <li>Missing parts or accessories</li>
        <li>Significantly different from the description on the website</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">What cannot be returned</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>Chairs that have been heavily used or visibly damaged in use (unless faulty)</li>
        <li>Custom-upholstered or made-to-order chairs (we cut fabric specifically for you)</li>
        <li>Reupholstery, repair and other workshop services once started</li>
        <li>Sale or clearance items marked "Final Sale"</li>
        <li>Bulk / custom-manufacturing orders (subject to your purchase quote)</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">How to start a return</h2>
      <ol className="list-decimal list-inside text-gray-700 space-y-1 mb-4">
        <li>Email us at <a href="mailto:abdulrab2411@gmail.com" className="text-primary-500 hover:underline">abdulrab2411@gmail.com</a> within 7 days of delivery.</li>
        <li>Mention your order number and what's wrong (a photo helps us approve fast).</li>
        <li>We'll arrange a courier pickup or share a return address.</li>
        <li>Pack the item securely with all original accessories.</li>
      </ol>

      <h2 className="text-xl font-bold mt-6 mb-2">Refund timeline</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
        <li>Once we receive and inspect the returned item: <strong>1–2 business days</strong></li>
        <li>Refund to original payment method (UPI / Card): <strong>5–7 business days</strong></li>
        <li>Refund to bank account (for COD orders): <strong>5–7 business days</strong></li>
        <li>Store credit refunds are issued instantly</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Exchanges</h2>
      <p className="text-gray-700 mb-4">For a different size, colour, or model, we'll process a refund for the original item and you can place a fresh order for the replacement. This avoids stock issues and gets you the right item faster.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Cancellations</h2>
      <p className="text-gray-700 mb-4">You can cancel an order at any time before it ships — log in, open <strong>My Orders</strong>, and request cancellation. If it has already been shipped, please refuse the delivery and we'll process a full refund once it's back with us.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Damaged on arrival?</h2>
      <p className="text-gray-700 mb-4">Please open the package while the courier is still there if possible. Take photos of the damaged item and packaging, then email them to us the same day. We'll dispatch a replacement at no extra cost.</p>

      <h2 className="text-xl font-bold mt-6 mb-2">Need help?</h2>
      <p className="text-gray-700">
        We're here to help — email <a href="mailto:abdulrab2411@gmail.com" className="text-primary-500 hover:underline">abdulrab2411@gmail.com</a> or WhatsApp us at <a href="https://wa.me/919326166875" className="text-primary-500 hover:underline">+91 93261 66875</a>.
      </p>
    </PolicyLayout>
  );
}
