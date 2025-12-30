import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }: { isActive: boolean }) =>
        [
          'rounded-xl px-3 py-2 text-base font-semibold transition',
          'hover:bg-pitchBlack/70 hover:text-vanillaCustard',
          isActive ? 'bg-pitchBlack text-vanillaCustard shadow-soft' : 'text-vanillaCustard/95'
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-vanillaCustard/15 bg-graphite/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-pitchBlack/60"
            aria-label="Go to public site"
          >
            <div className="text-base font-extrabold leading-tight text-vanillaCustard">Admin Dashboard</div>
            <div className="text-sm text-vanillaCustard/80 hidden sm:block">{user?.email}</div>
          </button>

          <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
            <NavItem to="/admin" label="Overview" />
            <NavItem to="/admin/resources" label="Resources" />
            <NavItem to="/admin/submissions" label="Submissions" />
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl bg-powderBlush px-3 py-2 text-base font-bold text-pitchBlack shadow-soft transition hover:brightness-95"
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}
