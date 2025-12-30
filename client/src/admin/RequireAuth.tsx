import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth';

export default function RequireAuth() {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
        <div className="text-base font-semibold text-vanillaCustard">Loading…</div>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
