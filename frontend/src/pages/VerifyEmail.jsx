import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiMail, FiCheck, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

export default function VerifyEmail() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (!user) navigate('/login');
    else if (user.emailVerified) {
      toast.success('Email already verified');
      navigate('/');
    }
    refs.current[0]?.focus();
  }, [user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setDigit = (i, val) => {
    if (val && !/^\d$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(text)) {
      e.preventDefault();
      setDigits(text.split(''));
      refs.current[5]?.focus();
    }
  };

  const verify = async (e) => {
    e?.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) return toast.error('Enter all 6 digits');
    setSubmitting(true);
    try {
      await API.post('/auth/verify-email', { otp });
      toast.success('🎉 Email verified! Welcome to Talle Furniture Mart.');
      await refreshUser();
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const { data } = await API.post('/auth/resend-otp');
      toast.success('New OTP sent to your email');
      if (data.devOTP) toast(`🔐 Dev OTP: ${data.devOTP}`, { duration: 12000 });
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-lg p-8 animate-scaleIn">
        <Link to="/" className="text-sm text-gray-500 hover:text-primary-500 inline-flex items-center gap-1 mb-4"><FiArrowLeft /> Back</Link>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-primary-100 text-primary-500 rounded-full flex items-center justify-center mb-3 animate-float">
            <FiMail size={28} />
          </div>
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-sm text-gray-600 mt-1">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-gray-900">{user.email}</span>
          </p>
        </div>

        <form onSubmit={verify}>
          <div className="flex justify-center gap-2 mb-5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || digits.join('').length !== 6}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiCheck /> {submitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="text-center mt-5 text-sm text-gray-600">
          Didn't get the code?{' '}
          <button
            onClick={resend}
            disabled={resending || cooldown > 0}
            className="text-primary-500 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline inline-flex items-center gap-1"
          >
            <FiRefreshCw size={12} className={resending ? 'animate-spin' : ''} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
          </button>
        </div>

        <hr className="my-5" />
        <div className="text-center text-xs text-gray-500">
          Wrong email? <button onClick={() => { logout(); navigate('/register'); }} className="text-primary-500 hover:underline">Sign up again</button>
        </div>

        <p className="text-[10px] text-gray-400 mt-4 text-center">
          Code expires in 10 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </div>
  );
}
