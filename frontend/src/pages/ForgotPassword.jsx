import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiMail, FiArrowRight, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

// Premium password-reset request screen. Single-panel centred card on a
// clean neutral background. Charcoal header band + solid charcoal CTA
// to match Login.jsx / Register.jsx — no pink-fuchsia gradient flash.

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await API.post('/auth/forgot-password', { email: email.trim() });
      toast.success(data.message);
      setSent(true);
    } catch (err) {
      // Backend always returns 200 to avoid email enumeration, so this is rare.
      toast.error(err.response?.data?.message || 'Could not send reset link. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-gray-50">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          {/* Header — charcoal band with the brand logo. Quiet, premium,
              same colour family as the main "Sign In" CTA on Login. */}
          <div className="bg-gray-900 px-6 sm:px-8 py-7 sm:py-9 text-center text-white">
            <Link to="/" className="inline-flex items-center mb-3 sm:mb-4" aria-label="Talle Furniture Mart — home">
              <img src="/logo-light.svg" alt="Talle Furniture Mart" className="h-10 sm:h-11 w-auto" />
            </Link>
            <p className="text-[10px] uppercase tracking-[2.5px] text-amber-300 font-bold mb-1.5">Account recovery</p>
            <h1 className="text-xl sm:text-2xl font-bold">Forgot your password?</h1>
          </div>

          <div className="px-6 sm:px-8 py-7 sm:py-8">
            {sent ? (
              <div className="text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-emerald-100">
                  <FiCheckCircle className="text-emerald-500" size={30} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  If an account exists for <strong className="break-all text-gray-900">{email}</strong>, we've sent a password reset link there.
                  The link is valid for the next 30 minutes.
                </p>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  Don't see it? Check your spam folder, or{' '}
                  <button
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="text-primary-500 hover:text-primary-600 hover:underline font-medium underline-offset-2"
                  >try a different email</button>.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-primary-500 font-semibold mt-6"
                >
                  <FiArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Enter the email address you used to sign up — we'll send a one-time link to reset your password.
                </p>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="label">Email address</label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        id="forgot-email"
                        type="email"
                        inputMode="email"
                        className="input pl-10 py-3 sm:py-3.5"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gray-900 hover:bg-black text-white font-semibold text-sm py-3 sm:py-3.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 group active:scale-[0.99]"
                  >
                    {submitting ? 'Sending…' : (<>Send reset link <FiArrowRight size={14} className="group-hover:translate-x-1 transition" /></>)}
                  </button>
                </form>
                <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary-500 transition"
                  >
                    <FiArrowLeft size={14} /> Back to sign in
                  </Link>
                  <Link
                    to="/register"
                    className="text-primary-500 hover:text-primary-600 hover:underline font-medium underline-offset-2"
                  >
                    Create an account
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Trouble signing in? <Link to="/contact" className="text-gray-500 hover:text-primary-500 hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
