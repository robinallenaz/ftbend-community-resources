import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../admin/auth';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'working'>('idle');

  const params = new URLSearchParams(location.search);
  const next = params.get('next') || '/admin';

  if (user) return <Navigate to={next} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('working');
    try {
      await login(email, password);
      navigate(next);
    } catch {
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">Admin login</h1>
        <p className="text-base text-vanillaCustard/85">Use your admin email and password.</p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            inputMode="email"
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <button
          type="submit"
          className="rounded-xl bg-powderBlush px-4 py-3 text-lg font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-60"
          disabled={status === 'working'}
        >
          Log in
        </button>

        {status === 'error' ? (
          <div className="rounded-2xl bg-graphite/70 p-4 text-base text-vanillaCustard">Login failed. Check your email/password.</div>
        ) : null}
      </form>

      <div className="text-sm text-vanillaCustard/75">
        If you don’t have admin credentials yet, run the server seed script.
      </div>
    </div>
  );
}
