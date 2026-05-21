import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import { FiMail, FiArrowRight, FiTruck, FiShield, FiHeart, FiPackage } from 'react-icons/fi';

// Premium two-panel sign-in. Left: real chair lifestyle photo with a
// dark charcoal overlay (no candy gradients, no floating emojis). Right:
// clean white form with editorial typography and a solid charcoal CTA.
// Mirrors the auth pattern used by Apple ID / J. Crew / Pottery Barn /
// Cassina rather than flash-sale marketplaces.

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(from);
    } catch {}
  };

  return (
    <div className="min-h-[calc(100vh-160px)] grid md:grid-cols-2 bg-white">
      {/* ========== LEFT — Editorial brand panel ==========
          Real ergonomic-chair lifestyle photo + dark charcoal overlay.
          Replaces the previous pink/fuchsia gradient + floating 🛋🪑💼
          emojis which read as a flash-sale marketplace. */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden p-8 md:p-10 lg:p-12 text-white">
        {/* Background photo — kept low-saturation so text overlay reads.
            object-cover so the photo fills the panel at every height. */}
        <img
          src="https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=1600&q=85&auto=format&fit=crop"
          alt="Talle ergonomic office chair in a daylit workspace"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Charcoal-to-transparent overlay for text legibility — same
            recipe the home hero uses, brand-cohesive. */}
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
            Welcome back
          </p>
          <h2 className="font-display font-medium text-3xl lg:text-4xl xl:text-5xl leading-[1.1] drop-shadow-md">
            Sign in to continue.
          </h2>
          <p className="mt-4 lg:mt-5 text-sm lg:text-base text-white/85 leading-relaxed max-w-sm">
            Pick up where you left off — your cart, wishlist and saved addresses are right where you need them.
          </p>

          {/* Member-perk list — restrained vertical list, no candy cards.
              Visible from lg+ where the panel has the height for it. */}
          <ul className="mt-8 lg:mt-10 hidden lg:block space-y-3.5">
            <PerkRow icon={<FiTruck   size={16} />} text="Free Mumbai delivery on orders above ₹2,999" />
            <PerkRow icon={<FiShield  size={16} />} text="BIFMA-grade hydraulics, 6-month warranty" />
            <PerkRow icon={<FiPackage size={16} />} text="Doorstep pickup and drop for repairs" />
            <PerkRow icon={<FiHeart   size={16} />} text="Save favourites across devices" />
          </ul>
        </div>

        {/* Bottom: copyright */}
        <div className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} Talle Furniture Mart · Saki Naka, Mumbai
        </div>
      </div>

      {/* ========== RIGHT — Sign-in form ========== */}
      <div className="flex flex-col justify-center px-5 sm:px-8 md:px-10 lg:px-14 xl:px-20 py-10 sm:py-12 lg:py-16 bg-white min-h-[calc(100vh-160px)]">
        {/* Mobile-only brand bar — clean, just the logo. The previous
            tri-tone gradient pill above it was visual noise. */}
        <div className="md:hidden text-center mb-8">
          <Link to="/" className="inline-flex items-center" aria-label="Talle Furniture Mart — home">
            <img src="/logo.svg" alt="Talle Furniture Mart" className="h-11 sm:h-12 w-auto" />
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Headline + secondary CTA in the same hierarchy as Apple ID,
              Pottery Barn, J. Crew sign-in pages. */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[2.5px] text-gray-500 font-bold mb-2">Account</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-gray-600">
              New to Talle?{' '}
              <Link to="/register" className="font-semibold text-primary-500 hover:text-primary-600 underline-offset-2 hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="label">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="login-email"
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-500 hover:text-primary-600 hover:underline font-medium underline-offset-2">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <label className="flex items-center gap-2 select-none cursor-pointer text-sm text-gray-700">
              <input type="checkbox" defaultChecked className="accent-primary-500 w-4 h-4" />
              Keep me signed in on this device
            </label>

            {/* Solid charcoal CTA — premium pattern. The pink-gradient
                glow-shadow button was the loudest element on the page. */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold text-sm py-3.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group active:scale-[0.99]"
            >
              {loading
                ? 'Signing in…'
                : (<>Sign In <FiArrowRight size={14} className="group-hover:translate-x-1 transition" /></>)}
            </button>
          </form>

          <p className="mt-8 text-xs text-gray-400 text-center">
            By signing in you agree to our{' '}
            <Link to="/terms-of-service" className="text-gray-500 hover:text-primary-500 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy-policy"   className="text-gray-500 hover:text-primary-500 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

// Restrained perk row — icon in a subtle circle, single line of text.
// Replaces the candy-card "Feature" component with a chair-brand-appropriate
// list style (think Cassina / Carl Hansen feature lists).
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
