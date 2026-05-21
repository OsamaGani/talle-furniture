import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import FollowUs from './FollowUs';
import NewsletterForm from './NewsletterForm';
import {
  PHONE_PRIMARY_DISPLAY, PHONE_PRIMARY_TEL,
  PHONE_SECONDARY_DISPLAY, PHONE_SECONDARY_TEL,
  EMAIL_PRIMARY,
  STORE_ADDRESS_FULL, STORE_NAME,
} from '../config/contact';

// Reusable link list — keeps every column footer-styled identically so
// adding/removing a link is a single line change, not five spread out.
const LinkList = ({ children }) => (
  <ul className="space-y-2 text-sm">{children}</ul>
);
const Li = ({ to, href, external, children }) => (
  <li>
    {external || href ? (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="hover:text-primary-500 transition">
        {children}
      </a>
    ) : (
      <Link to={to} className="hover:text-primary-500 transition">{children}</Link>
    )}
  </li>
);

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      {/* Main grid — four focused columns on lg, gracefully collapsing
          to two on md/mobile. Wider Brand + Subscribe columns on the
          smaller breakpoints to keep column heights balanced. */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">

        {/* === 1. Brand column === */}
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-4">
            <img src="/logo-light.svg" alt="Talle Furniture Mart" className="h-12 w-auto" />
          </div>
          <p className="text-sm leading-relaxed max-w-sm">
            Mumbai's trusted chair specialist — manufacturing, retail and expert repair. Comfort, durability and style in every seat.
          </p>
          <div className="mt-5">
            <FollowUs dark />
          </div>
        </div>

        {/* === 2. Shop column — products + categories === */}
        <div>
          <h3 className="font-bold text-white mb-3">Shop</h3>
          <LinkList>
            <Li to="/shop">All Chairs</Li>
            <Li to="/shop?category=Executive">Executive Chairs</Li>
            <Li to="/shop?category=Ergonomic">Ergonomic Chairs</Li>
            <Li to="/shop?category=Premium">Premium</Li>
            <Li to="/shop?category=Gaming">Gaming Chairs</Li>
            <Li to="/shop?bestSeller=true">Best Sellers</Li>
            <Li to="/shop?newArrival=true">New Arrivals</Li>
            <Li to="/shop?discount=true">Sale · Up to 50% Off</Li>
          </LinkList>
        </div>

        {/* === 3. Services & Help column — services first, then support === */}
        <div>
          <h3 className="font-bold text-white mb-3">Services &amp; Help</h3>
          <LinkList>
            <Li to="/chair-repair">Chair Repair</Li>
            <Li to="/chair-repair">Reupholstery</Li>
            <Li to="/contact">Custom Manufacturing</Li>
            <Li to="/contact">Bulk Office Orders</Li>
            <Li to="/about">About Us</Li>
            <Li to="/contact">Contact</Li>
            <Li to="/help">Help / FAQs</Li>
            <Li to="/orders">Track Order</Li>
            <Li href="https://wa.me/919326166875" external>WhatsApp Us</Li>
          </LinkList>
        </div>

        {/* === 4. Subscribe + contact column === */}
        <div className="col-span-2 lg:col-span-1">
          <h3 className="font-bold text-white mb-3">Stay in the loop</h3>
          <p className="text-sm mb-3">Get latest deals and offers in your inbox.</p>
          <NewsletterForm variant="dark" source="footer" />
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <FiPhone className="flex-shrink-0" />
              <a href={`tel:${PHONE_PRIMARY_TEL}`} className="hover:text-white">{PHONE_PRIMARY_DISPLAY}</a>
            </li>
            <li className="flex items-center gap-2 text-gray-400">
              <FiPhone className="flex-shrink-0 opacity-60" />
              <a href={`tel:${PHONE_SECONDARY_TEL}`} className="hover:text-white text-xs">{PHONE_SECONDARY_DISPLAY}</a>
            </li>
            <li className="flex items-center gap-2">
              <FiMail className="flex-shrink-0" />
              <a href={`mailto:${EMAIL_PRIMARY}`} className="hover:text-white">{EMAIL_PRIMARY}</a>
            </li>
            <li className="flex items-start gap-2">
              <FiMapPin className="mt-1 flex-shrink-0" />
              <span>{STORE_NAME}, {STORE_ADDRESS_FULL}</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Policies row — thin horizontal strip just above the copyright.
          Mirrors the premium-brand pattern (Herman Miller, Knoll, Vitra)
          where legal links sit at the very bottom in a compact line
          instead of in their own footer column. */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-400">
          <Link to="/shipping-policy"  className="hover:text-white transition">Shipping Policy</Link>
          <span className="opacity-40">·</span>
          <Link to="/privacy-policy"   className="hover:text-white transition">Privacy Policy</Link>
          <span className="opacity-40">·</span>
          <Link to="/terms-of-service" className="hover:text-white transition">Terms of Service</Link>
          <span className="opacity-40">·</span>
          <Link to="/refund-policy"    className="hover:text-white transition">Refund Policy</Link>
          <span className="opacity-40">·</span>
          <Link to="/help"             className="hover:text-white transition">Help / FAQs</Link>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
