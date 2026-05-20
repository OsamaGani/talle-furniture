import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import { FiMail, FiArrowRight, FiTruck, FiShield, FiHeart, FiPackage } from 'react-icons/fi';

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
      {/* ========== LEFT — Brand showcase ==========
          Visible from md (768px+) so tablets also get the nice split view
          instead of a lonely full-width form with empty whitespace. Padding
          and feature grid scale down on md, full treatment from lg+. */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-500 via-pink-500 to-fuchsia-600 text-white p-8 md:p-10 lg:p-12">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-20 w-72 lg:w-96 h-72 lg:h-96 bg-yellow-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-20 w-72 lg:w-96 h-72 lg:h-96 bg-white/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        {/* Floating chair emojis */}
        <span className="absolute top-16 right-10 text-5xl lg:text-6xl opacity-30 animate-float" style={{ animationDelay: '0.5s' }}>🛋</span>
        <span className="absolute bottom-28 left-10 text-6xl lg:text-7xl opacity-25 animate-float" style={{ animationDelay: '2s' }}>🪑</span>
        <span className="absolute top-1/2 right-24 text-4xl lg:text-5xl opacity-30 animate-float hidden lg:inline" style={{ animationDelay: '1s' }}>💼</span>

        <div className="relative z-10">
          {/* Light variant — sits on the red/pink gradient panel. */}
          <Link to="/" className="inline-flex items-center" aria-label="Talle Furniture Mart — home">
            <img src="/logo-light.svg" alt="Talle Furniture Mart" className="h-11 lg:h-12 w-auto" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <span className="inline-block bg-white/20 backdrop-blur text-[10px] lg:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 lg:mb-5">
            Welcome back
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-tight drop-shadow-lg">
            Better seating, built to last.
          </h2>
          <p className="mt-3 lg:mt-4 text-base lg:text-lg text-white/90 leading-relaxed">
            Sign in to track orders, save favourites, and get exclusive member-only offers.
          </p>

          {/* Feature grid — hidden on md (saves vertical space on tablet),
              shown from lg+ where the panel has more breathing room. */}
          <div className="mt-8 lg:mt-10 hidden lg:grid grid-cols-2 gap-4">
            <Feature icon={<FiTruck />}   title="Free Mumbai delivery" desc="On orders ₹2,999+" />
            <Feature icon={<FiShield />}  title="BIFMA-grade parts"    desc="Genuine components" />
            <Feature icon={<FiPackage />} title="Doorstep repair"      desc="Pickup & drop in Mumbai" />
            <Feature icon={<FiHeart />}   title="Wishlist"             desc="Save for later" />
          </div>
        </div>

        <div className="relative z-10 text-xs lg:text-sm text-white/75">
          © {new Date().getFullYear()} Talle Furniture Mart · Sakinaka, Mumbai
        </div>
      </div>

      {/* ========== RIGHT — Form ==========
          Padding scales: tight on phone (px-5), generous on tablet+ without
          getting cramped at xl. min-h ensures form is vertically centred
          even when content is short. */}
      <div className="flex flex-col justify-center px-5 sm:px-8 md:px-10 lg:px-14 xl:px-20 py-8 sm:py-10 lg:py-12 bg-white min-h-[calc(100vh-160px)]">
        {/* Mobile-only brand bar — has a subtle gradient bar above the
            wordmark so the otherwise-text-only mobile screen has some
            visual identity. Hidden from md+ where the brand panel takes
            over on the left. */}
        <div className="md:hidden text-center mb-6 sm:mb-8">
          <div className="inline-block">
            <div className="h-1 w-12 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full mx-auto mb-3" />
            {/* Dark variant — mobile-only screen on white background. */}
            <Link to="/" className="inline-flex items-center" aria-label="Talle Furniture Mart — home">
              <img src="/logo.svg" alt="Talle Furniture Mart" className="h-11 sm:h-12 w-auto" />
            </Link>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Sign in</h1>
            <p className="mt-2 text-gray-600">
              New here?{' '}
              <Link to="/register" className="font-semibold text-primary-500 hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="label">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-sm text-primary-500 hover:underline font-medium">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {loading
                ? 'Signing in…'
                : (<>Sign in <FiArrowRight className="group-hover:translate-x-1 transition" /></>)}
            </button>
          </form>

          <p className="mt-8 text-xs text-gray-400 text-center">
            By signing in you agree to our{' '}
            <Link to="/terms-of-service" className="hover:text-primary-500 hover:underline">Terms</Link>
            {' '}&{' '}
            <Link to="/privacy-policy" className="hover:text-primary-500 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-white/80">{desc}</p>
      </div>
    </div>
  );
}
