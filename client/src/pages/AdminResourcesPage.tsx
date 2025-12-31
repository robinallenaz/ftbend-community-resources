import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../admin/api';

type ResourceItem = {
  _id: string;
  name: string;
  url: string;
  status: 'active' | 'archived';
  locations: string[];
  types: string[];
  audiences: string[];
  tags: string[];
  updatedAt?: string;
};

const SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'created_desc', label: 'Recently created' }
] as const;

export default function AdminResourcesPage() {
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('updated_desc');
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    if (status === 'all') return 'active,archived';
    return status;
  }, [status]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('status', query);
    if (q.trim()) params.set('q', q.trim());
    if (sort) params.set('sort', sort);

    const res = await api.get<{ items: ResourceItem[] }>(`/api/admin/resources?${params.toString()}`);
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [query, q, sort]);

  const resultCount = items.length;

  const sortLabel = useMemo(() => {
    return SORT_OPTIONS.find((x) => x.value === sort)?.label ?? 'Sort';
  }, [sort]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">Resources</h1>
          <p className="text-base text-vanillaCustard/85">Add, edit, and archive resources.</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1">
            <span className="text-sm font-bold text-vanillaCustard">Search</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, tags, etc…"
              className="w-60 max-w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-semibold text-vanillaCustard placeholder:text-vanillaCustard/60"
              inputMode="search"
            />
          </label>

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

          <label className="grid gap-1">
            <span className="text-sm font-bold text-vanillaCustard">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof SORT_OPTIONS)[number]['value'])}
              className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-semibold text-vanillaCustard"
              aria-label={`Sort resources (${sortLabel})`}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <Link
            to="/admin/resources/new"
            className="rounded-xl bg-powderBlush px-4 py-3 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95"
          >
            Add resource
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">Loading…</div>
      ) : (
        <div className="grid gap-3">
          <div className="text-sm text-vanillaCustard/75">Showing {resultCount} result{resultCount === 1 ? '' : 's'}.</div>
          {items.map((r) => (
            <div
              key={r._id}
              className="grid gap-2 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft md:grid-cols-[1fr_auto] md:items-center"
            >
              <div className="grid gap-1">
                <div className="text-lg font-extrabold text-vanillaCustard">{r.name}</div>
                <div className="text-sm text-vanillaCustard/75 break-all">{r.url}</div>
                <div className="text-sm text-vanillaCustard/75">
                  Status: <span className="font-bold">{r.status}</span>
                </div>
                {r.updatedAt ? (
                  <div className="text-sm text-vanillaCustard/75">
                    Updated: <span className="font-bold">{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/resources/${r._id}`}
                  className="rounded-xl border border-vanillaCustard/20 bg-graphite/60 px-3 py-2 text-base font-bold text-vanillaCustard hover:border-vanillaCustard/35"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}

          {!items.length ? (
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">No resources found.</div>
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
