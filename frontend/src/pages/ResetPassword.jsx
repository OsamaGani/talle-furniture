import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import PasswordInput, { scorePassword } from '../components/PasswordInput';
import { FiArrowRight, FiCheckCircle, FiCheck, FiX } from 'react-icons/fi';

const MIN_PASSWORD_SCORE = 3; // matches Register

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
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-pink-50 via-white to-primary-50">
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-pink-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-pink-500 px-6 py-7 text-center text-white">
            <Link to="/" className="inline-flex items-center gap-1 mb-3">
              <span className="text-2xl font-extrabold">Toy</span>
              <span className="text-2xl font-extrabold">Mall</span>
            </Link>
            <h1 className="text-2xl font-bold">{done ? 'Password updated' : 'Set a new password'}</h1>
            <p className="text-sm text-white/85 mt-0.5">
              {done ? 'You can now sign in with your new password' : 'Choose a strong password — at least 8 characters'}
            </p>
          </div>

          <div className="px-6 sm:px-8 py-7">
            {done ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <FiCheckCircle className="text-emerald-500" size={36} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">All done!</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Your password has been reset. Sign in to continue shopping.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
                >
                  Sign in <FiArrowRight />
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <PasswordInput
                  label="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  showStrength
                  required
                />
                <div>
                  <label className="label">Confirm New Password</label>
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
                  className="w-full bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-bold py-3.5 rounded-lg shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 group"
                >
                  {submitting ? 'Saving…' : (<>Reset password <FiArrowRight className="group-hover:translate-x-1 transition" /></>)}
                </button>
                <p className="text-center text-xs text-gray-500">
                  Reset link valid for 30 minutes from when you requested it.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
