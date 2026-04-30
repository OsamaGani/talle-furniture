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
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-pink-50 via-white to-primary-50">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-pink-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-pink-500 px-6 py-7 text-center text-white">
            <Link to="/" className="inline-flex items-center gap-1 mb-3">
              <span className="text-2xl font-extrabold">Toy</span>
              <span className="text-2xl font-extrabold">Mall</span>
            </Link>
            <h1 className="text-2xl font-bold">Forgot password?</h1>
            <p className="text-sm text-white/85 mt-0.5">No worries — we'll send you a reset link</p>
          </div>

          <div className="px-6 sm:px-8 py-7">
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <FiCheckCircle className="text-emerald-500" size={36} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link there.
                  The link is valid for the next 30 minutes.
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Don't see it? Check your spam folder, or
                  <button
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="text-primary-500 hover:underline ml-1"
                  >try a different email</button>.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-primary-500 hover:underline font-semibold mt-6"
                >
                  <FiArrowLeft size={14} /> Back to login
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-5">
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
                        className="input pl-10 py-3"
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
                    className="w-full bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 group"
                  >
                    {submitting ? 'Sending…' : (<>Send reset link <FiArrowRight className="group-hover:translate-x-1 transition" /></>)}
                  </button>
                </form>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mt-5"
                >
                  <FiArrowLeft size={14} /> Back to login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
