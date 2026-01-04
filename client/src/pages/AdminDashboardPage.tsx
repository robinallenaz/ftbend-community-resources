import { Link } from 'react-router-dom';
import { useAuth } from '../admin/auth';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="grid gap-3">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">Welcome</h1>
          <p className="text-base text-vanillaCustard/90">
            Signed in as <span className="font-bold">{user?.email}</span> ({user?.role}).
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/resources"
          className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft hover:border-vanillaCustard/35"
        >
          <div className="text-lg font-extrabold text-vanillaCustard">Resources</div>
          <div className="text-sm text-vanillaCustard/75">Add/edit listings and archive old ones.</div>
        </Link>

        <Link
          to="/admin/events"
          className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft hover:border-vanillaCustard/35"
        >
          <div className="text-lg font-extrabold text-vanillaCustard">Events</div>
          <div className="text-sm text-vanillaCustard/75">Add/edit community event listings.</div>
        </Link>

        <Link
          to="/admin/submissions"
          className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft hover:border-vanillaCustard/35"
        >
          <div className="text-lg font-extrabold text-vanillaCustard">Submissions</div>
          <div className="text-sm text-vanillaCustard/75">Review community submissions and approve/reject.</div>
        </Link>

        <a
          href="/"
          className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft hover:border-vanillaCustard/35"
        >
          <div className="text-lg font-extrabold text-vanillaCustard">Public site</div>
          <div className="text-sm text-vanillaCustard/75">Return to the main website.</div>
        </a>
      </div>
    </div>
  );
}
