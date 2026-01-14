import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import TextSizeToggle from './TextSizeToggle';

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }: { isActive: boolean }) =>
        [
          'rounded-xl px-3 py-2 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-graphite',
          'hover:bg-pitchBlack/70 hover:text-vanillaCustard',
          isActive ? 'bg-pitchBlack text-vanillaCustard shadow-soft' : 'text-vanillaCustard/95'
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-vanillaCustard/15 bg-graphite/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-pitchBlack/60 focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-graphite transition"
          aria-label="Go to homepage"
        >
          <img
            src="/ftbend-lgbtqia-logo.jpg"
            alt="Fort Bend County LGBTQIA+ Community logo"
            className="h-10 w-10 rounded-xl object-cover"
          />
          <div className="hidden sm:block">
            <div className="text-base font-extrabold leading-tight text-vanillaCustard">
              Fort Bend County LGBTQIA+ Community
            </div>
          </div>
        </button>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          <NavItem to="/" label="Home" />
          <NavItem to="/resources" label="Resources" />
          <NavItem to="/events" label="Events" />
          <NavItem to="/blog" label="Blog" />
          <NavItem to="/about" label="About" />
          <NavItem to="/submit" label="Submit a Resource" />
        </nav>

        <div className="flex items-center gap-2">
          <TextSizeToggle />
          <button
            type="button"
            className="rounded-xl bg-powderBlush px-3 py-2 text-base font-bold text-pitchBlack shadow-soft transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-graphite"
            onClick={() => navigate('/newsletter')}
            aria-label="Subscribe to newsletter"
          >
            Newsletter
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-3 md:px-6 md:hidden">
        <nav aria-label="Primary navigation (mobile)" className="flex flex-wrap gap-2">
          <NavItem to="/" label="Home" />
          <NavItem to="/resources" label="Resources" />
          <NavItem to="/events" label="Events" />
          <NavItem to="/blog" label="Blog" />
          <NavItem to="/about" label="About" />
          <NavItem to="/submit" label="Submit" />
        </nav>
      </div>
    </header>
  );
}
