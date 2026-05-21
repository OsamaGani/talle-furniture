import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PasswordInput, { scorePassword } from '../components/PasswordInput';
import {
  FiMail, FiArrowRight, FiCheck, FiX,
  FiGift, FiTag, FiTruck, FiZap,
} from 'react-icons/fi';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_SCORE = 3;

// Premium two-panel sign-up. Same design language as Login.jsx for
// pattern continuity: editorial photo + charcoal overlay on the left,
// clean white form with charcoal CTA on the right. No candy gradients,
// no floating emojis.

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const checkEmail = (email) => {
    if (!email) return setEmailError('');
    if (!EMAIL_REGEX.test(email)) return setEmailError('Please enter a valid email format');
    setEmailError('');
  };

  const passwordsMatch = form.confirm === '' || form.confirm === form.password;
  const pwScore = scorePassword(form.password);
  const pwStrongEnough = pwScore >= MIN_PASSWORD_SCORE;

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(form.email)) return toast.error('Invalid email format');
    if (!pwStrongEnough) {
      return toast.error('Password is too weak — use 8+ chars with mixed case, numbers and a symbol');
    }
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setSubmitting(true);
    try {
      const data = await register(form);
      if (data.devOTP) {
        toast(`📧 Dev OTP: ${data.devOTP} (also in backend console)`, { duration: 12000, icon: '🔐' });
      }
      navigate('/verify-email');
    } catch {} finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] grid md:grid-cols-2 bg-white">
      {/* ========== LEFT — Editorial brand panel ==========
          Real chair lifestyle photo + dark charcoal overlay. Different
          photo than Login (interior workspace vs ergonomic chair detail)
          so returning visitors don't see the exact same view. */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden p-8 md:p-10 lg:p-12 text-white">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=85&auto=format&fit=crop"
          alt="Mumbai workspace with rows of Talle office chairs"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-900/70 to-gray-900/40" />

        {/* Top: logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center" aria-label="Talle Furniture Mart — home">
            <img src="/logo-light.svg" alt="Talle Furniture Mart" className="h-11 lg:h-12 w-auto" />
          </Link>
        </div>

        {/* Middle: editorial pitch */}
        <div className="relative z-10 max-w-md">
          <p className="text-[11px] uppercase tracking-[3px] text-amber-300 font-semibold mb-3 lg:mb-4">
            Join the Talle family
          </p>
          <h2 className="font-display font-medium text-3xl lg:text-4xl xl:text-5xl leading-[1.1] drop-shadow-md">
            Built by craftsmen.<br/>For people who sit.
          </h2>
          <p className="mt-4 lg:mt-5 text-sm lg:text-base text-white/85 leading-relaxed max-w-sm">
            Create an account in under a minute and unlock perks reserved for members of the workshop.
          </p>

          {/* Perks list — restrained, no candy backgrounds. */}
          <ul className="mt-8 lg:mt-10 space-y-3.5">
            <PerkRow icon={<FiGift  size={16} />} text="10% off your first order" />
            <PerkRow icon={<FiTag   size={16} />} text="Early access to new arrivals & sales" />
            <li className="hidden lg:block">
              <PerkRow icon={<FiTruck size={16} />} text="Free Mumbai delivery on orders ₹2,999+" />
            </li>
            <li className="hidden lg:block">
              <PerkRow icon={<FiZap   size={16} />} text="Faster checkout with saved addresses" />
            </li>
          </ul>
        </div>

        {/* Bottom: copyright */}
        <div className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} Talle Furniture Mart · Saki Naka, Mumbai
        </div>
      </div>

      {/* ========== RIGHT — Sign-up form ========== */}
      <div className="flex flex-col justify-center px-5 sm:px-8 md:px-10 lg:px-14 xl:px-20 py-10 sm:py-12 lg:py-16 bg-white min-h-[calc(100vh-160px)]">
        {/* Mobile-only brand bar — clean logo only, no gradient pill. */}
        <div className="md:hidden text-center mb-8">
          <Link to="/" className="inline-flex items-center" aria-label="Talle Furniture Mart — home">
            <img src="/logo.svg" alt="Talle Furniture Mart" className="h-11 sm:h-12 w-auto" />
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[2.5px] text-gray-500 font-bold mb-2">New customer</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-gray-600">
              Already a member?{' '}
              <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600 underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input py-3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="label">
                Email{' '}
                <span className="text-xs text-gray-500 font-normal">
                  (we'll send a 6-digit verification code)
                </span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  className={`input pl-10 py-3 ${emailError ? 'border-red-400 focus:ring-red-400' : ''}`}
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); checkEmail(e.target.value); }}
                  onBlur={(e) => checkEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>

            <PasswordInput
              label="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              showStrength
              required
            />

            <div>
              <label className="label">Confirm password</label>
              <PasswordInput
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                autoComplete="new-password"
                invalid={!passwordsMatch && form.confirm.length > 0}
                required
              />
              {form.confirm.length > 0 && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
                  passwordsMatch ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {passwordsMatch
                    ? <><FiCheck size={12} /> Passwords match</>
                    : <><FiX size={12} /> Passwords don't match yet</>}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || loading || !pwStrongEnough || !passwordsMatch}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold text-sm py-3.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group active:scale-[0.99]"
            >
              {submitting
                ? 'Creating…'
                : (<>Create Account <FiArrowRight size={14} className="group-hover:translate-x-1 transition" /></>)}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-400 text-center">
            By creating an account you agree to our{' '}
            <Link to="/terms-of-service" className="text-gray-500 hover:text-primary-500 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy-policy"   className="text-gray-500 hover:text-primary-500 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

// Mirrors Login.jsx PerkRow — same restraint, brand-cohesive amber accent.
function PerkRow({ icon, text }) {
  return (
    <li className="flex items-center gap-3 text-sm text-white/90">
      <span className="w-8 h-8 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-amber-300 flex-shrink-0">
        {icon}
      </span>
      <span className="leading-snug">{text}</span>
    </li>
  );
}
