import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

// DPDP Act 2023 (Digital Personal Data Protection Act, India) compliance
// banner. Shown on first visit; once dismissed the choice is persisted
// in localStorage so we never bother returning customers.
//
// Premium e-commerce sites world-wide use this kind of restrained
// bottom-pill banner (Apple, Uniqlo, Knoll) — unobtrusive, doesn't
// block content, dismissible in one tap.

const STORAGE_KEY = 'tfm_cookie_consent_v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the banner doesn't fight the page mount animation.
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
      } catch {
        // localStorage disabled in private mode on some browsers — fail open.
      }
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = (choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: Date.now() }));
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[60] bg-gray-900 text-gray-100 rounded-xl shadow-2xl ring-1 ring-white/10 p-4 sm:p-5 animate-fadeIn"
    >
      <button
        onClick={() => dismiss('dismissed')}
        aria-label="Close cookie banner"
        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition"
      >
        <FiX size={16} />
      </button>
      <p className="text-sm font-semibold mb-1">Cookies on tallefurnituremart.com</p>
      <p className="text-xs text-gray-300 leading-relaxed pr-6">
        We use cookies to keep you signed in, remember your cart, and improve site performance.
        Read our{' '}
        <Link to="/privacy-policy" onClick={() => dismiss('read-policy')} className="text-primary-400 hover:text-primary-300 underline">
          Privacy Policy
        </Link>
        {' '}for details.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => dismiss('accepted')}
          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold py-2 px-3 rounded-md transition active:scale-[0.98]"
        >
          Accept
        </button>
        <button
          onClick={() => dismiss('declined')}
          className="flex-1 border border-white/20 hover:border-white/40 text-white text-xs font-semibold py-2 px-3 rounded-md transition active:scale-[0.98]"
        >
          Only essential
        </button>
      </div>
    </div>
  );
}
