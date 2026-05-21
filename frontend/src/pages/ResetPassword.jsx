import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import PasswordInput, { scorePassword } from '../components/PasswordInput';
import { FiArrowRight, FiCheckCircle, FiCheck, FiX } from 'react-icons/fi';

const MIN_PASSWORD_SCORE = 3; // matches Register

// Premium new-password screen. Same design language as ForgotPassword:
// neutral gray-50 background, white centred card with a quiet charcoal
// header band, solid charcoal CTA. No candy gradient flash.

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const passwordsMatch = confirm === '' || confirm === password;
  const pwScore = scorePassword(password);
  const pwStrongEnough = pwScore >= MIN_PASSWORD_SCORE;

  const submit = async (e) => {
    e.preventDefault();
    if (!pwStrongEnough) {
      return toast.error('Password is too weak — use 8+ chars with mixed case, numbers and a symbol');
    }
    if (password !== confirm) return toast.error('Passwords do not match');

    setSubmitting(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          {/* Header — same quiet charcoal band as the Forgot screen for
              continuity through the recovery flow. */}
          <div className="bg-gray-900 px-6 py-7 sm:py-9 text-center text-white">
            <Link to="/" className="inline-flex items-center mb-3" aria-label="Talle Furniture Mart — home">
              <img src="/logo-light.svg" alt="Talle Furniture Mart" className="h-10 w-auto" />
            </Link>
            <p className="text-[10px] uppercase tracking-[2.5px] text-amber-300 font-bold mb-1.5">
              {done ? 'Done' : 'Set a new password'}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold">
              {done ? 'Password updated' : 'Choose a new password'}
            </h1>
          </div>

          <div className="px-6 sm:px-8 py-7 sm:py-8">
            {done ? (
              <div className="text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-emerald-100">
                  <FiCheckCircle className="text-emerald-500" size={30} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">All done.</h2>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Your password has been reset. Sign in to continue shopping.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-900 hover:bg-black text-white font-semibold text-sm py-3 rounded-lg transition flex items-center justify-center gap-2 group active:scale-[0.99]"
                >
                  Sign in <FiArrowRight size={14} className="group-hover:translate-x-1 transition" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Choose a strong password — at least 8 characters, with mixed case, numbers and a symbol.
                </p>
                <form onSubmit={submit} className="space-y-4">
                  <PasswordInput
                    label="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    showStrength
                    required
                  />
                  <div>
                    <label className="label">Confirm new password</label>
                    <PasswordInput
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      invalid={!passwordsMatch && confirm.length > 0}
                      required
                    />
                    {confirm.length > 0 && (
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
                    disabled={submitting || !pwStrongEnough || !passwordsMatch}
                    className="w-full bg-gray-900 hover:bg-black text-white font-semibold text-sm py-3.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 group active:scale-[0.99]"
                  >
                    {submitting ? 'Saving…' : (<>Reset password <FiArrowRight size={14} className="group-hover:translate-x-1 transition" /></>)}
                  </button>
                  <p className="text-center text-xs text-gray-500">
                    Reset link is valid for 30 minutes from when you requested it.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Trouble? <Link to="/contact" className="text-gray-500 hover:text-primary-500 hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
