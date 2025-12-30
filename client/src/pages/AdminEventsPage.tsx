import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../admin/api';

type EventItem = {
  _id: string;
  name: string;
  schedule: string;
  url: string;
  locationHint: string;
  status: 'active' | 'archived';
};

export default function AdminEventsPage() {
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active');
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    if (status === 'all') return 'active,archived';
    return status;
  }, [status]);

  async function load() {
    setLoading(true);
    const res = await api.get<{ items: EventItem[] }>(`/api/admin/events?status=${encodeURIComponent(query)}`);
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [query]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">Events</h1>
          <p className="text-base text-vanillaCustard/85">Add, edit, and archive events.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="grid gap-1">
            <span className="text-sm font-bold text-vanillaCustard">Show</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'archived' | 'all')}
              className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-semibold text-vanillaCustard"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
          </label>

          <Link
            to="/admin/events/new"
            className="rounded-xl bg-powderBlush px-4 py-3 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95"
          >
            Add event
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">Loading…</div>
      ) : (
        <div className="grid gap-3">
          {items.map((e) => (
            <div
              key={e._id}
              className="grid gap-2 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft md:grid-cols-[1fr_auto] md:items-center"
            >
              <div className="grid gap-1">
                <div className="text-lg font-extrabold text-vanillaCustard">{e.name}</div>
                <div className="text-sm text-vanillaCustard/75">Schedule: {e.schedule}</div>
                <div className="text-sm text-vanillaCustard/75">Where: {e.locationHint}</div>
                <div className="text-sm text-vanillaCustard/75 break-all">{e.url}</div>
                <div className="text-sm text-vanillaCustard/75">
                  Status: <span className="font-bold">{e.status}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/events/${e._id}`}
                  className="rounded-xl border border-vanillaCustard/20 bg-graphite/60 px-3 py-2 text-base font-bold text-vanillaCustard hover:border-vanillaCustard/35"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}

          {!items.length ? (
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">No events found.</div>
          ) : null}
        </div>
      )}

      <button
        type="button"
        className="w-fit rounded-xl border border-vanillaCustard/20 bg-graphite/60 px-4 py-3 text-base font-bold text-vanillaCustard hover:border-vanillaCustard/35"
        onClick={load}
      >
        Refresh
      </button>
    </div>
  );
}
