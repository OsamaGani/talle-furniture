import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiMail, FiArrowRight, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

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
    <div className="relative min-h-[calc(100vh-160px)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 overflow-hidden bg-gradient-to-br from-pink-50 via-white to-primary-50">
      {/* Decorative blobs — sized smaller on phone so they don't dominate */}
      <div className="absolute -top-24 -left-20 w-56 sm:w-72 h-56 sm:h-72 bg-primary-200/40 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-24 -right-20 w-56 sm:w-72 h-56 sm:h-72 bg-pink-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Card scales up gently on tablet+ — phone gets max-w-md (the
          natural card width on small screens), tablet gets max-w-lg for
          a little more breathing room without the form looking lost. */}
      <div className="relative w-full max-w-md sm:max-w-lg">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          {/* Header band with brand + page title. Padding scales on sm+. */}
          <div className="bg-gradient-to-r from-primary-500 to-pink-500 px-5 sm:px-8 py-6 sm:py-8 text-center text-white">
            {/* Light variant — sits on the red/pink gradient header band. */}
            <Link to="/" className="inline-flex items-center mb-2 sm:mb-3" aria-label="Talle Furniture Mart — home">
              <img src="/logo-light.svg" alt="Talle Furniture Mart" className="h-9 sm:h-10 w-auto" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold">Forgot password?</h1>
            <p className="text-xs sm:text-sm text-white/85 mt-1">
              No worries — we'll send you a reset link
            </p>
          </div>

          <div className="px-5 sm:px-8 py-6 sm:py-8">
            {sent ? (
              <div className="text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <FiCheckCircle className="text-emerald-500" size={32} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  If an account exists for <strong className="break-all">{email}</strong>, we've sent a password reset link there.
                  The link is valid for the next 30 minutes.
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Don't see it? Check your spam folder, or{' '}
                  <button
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="text-primary-500 hover:underline font-medium"
                  >try a different email</button>.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:underline font-semibold mt-5 sm:mt-6"
                >
                  <FiArrowLeft size={14} /> Back to login
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Enter the email address you used to sign up. We'll send a one-time link to reset your password.
                </p>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="label">Email address</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="forgot-email"
                        type="email"
                        inputMode="email"
                        className="input pl-10 py-3 sm:py-3.5 text-base"
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
                    className="w-full bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-bold py-3 sm:py-3.5 rounded-lg shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 group"
                  >
                    {submitting ? 'Sending…' : (<>Send reset link <FiArrowRight className="group-hover:translate-x-1 transition" /></>)}
                  </button>
                </form>
                <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary-500"
                  >
                    <FiArrowLeft size={14} /> Back to login
                  </Link>
                  <Link
                    to="/register"
                    className="text-primary-500 hover:underline font-medium"
                  >
                    Create an account
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
