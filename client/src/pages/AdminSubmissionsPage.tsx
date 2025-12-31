import { useEffect, useMemo, useState } from 'react';
import FilterGroup from '../components/FilterGroup';
import { api } from '../admin/api';

type Options = { locations: string[]; types: string[]; audiences: string[] };

type SubmissionItem = {
  _id: string;
  name: string;
  url: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

type NotificationSettings = {
  submissionEmailEnabled: boolean;
  submissionEmailRecipients: string[];
  publicSiteUrl: string;
};

function toSet(list: string[]) {
  return new Set(list);
}

function setToList(s: Set<string>) {
  return Array.from(s.values());
}

export default function AdminSubmissionsPage() {
  const [options, setOptions] = useState<Options | null>(null);
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [notif, setNotif] = useState<NotificationSettings | null>(null);
  const [notifRecipients, setNotifRecipients] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [publicSiteUrl, setPublicSiteUrl] = useState('');
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifSaved, setNotifSaved] = useState(false);

  const query = useMemo(() => {
    if (status === 'all') return 'pending,approved,rejected';
    return status;
  }, [status]);

  async function load() {
    setLoading(true);
    const [opt, res, settings] = await Promise.all([
      api.get<{ options: Options }>('/api/admin/options'),
      api.get<{ items: SubmissionItem[] }>(`/api/admin/submissions?status=${encodeURIComponent(query)}`),
      api.get<{ settings: NotificationSettings }>('/api/admin/notification-settings')
    ]);
    setOptions(opt.options);
    setItems(res.items);
    setNotif(settings.settings);
    setNotifEnabled(Boolean(settings.settings.submissionEmailEnabled));
    setNotifRecipients((settings.settings.submissionEmailRecipients || []).join(', '));
    setPublicSiteUrl(settings.settings.publicSiteUrl || '');
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [query]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">Submissions</h1>
          <p className="text-base text-vanillaCustard/85">Review community submissions.</p>
        </div>

        <label className="grid gap-1">
          <span className="text-sm font-bold text-vanillaCustard">Show</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-semibold text-vanillaCustard"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </label>
      </header>

      {notif ? (
        <section className="grid gap-3 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft" aria-label="Submission email notifications">
          <div className="text-lg font-extrabold text-vanillaCustard">Email notifications</div>
          <div className="text-base text-vanillaCustard/85">
            Send an email when someone submits a resource. The email will link to the admin submissions page.
          </div>

          <label className="flex flex-wrap items-center gap-3">
            <input
              type="checkbox"
              checked={notifEnabled}
              onChange={(e) => setNotifEnabled(e.target.checked)}
              className="h-5 w-5"
            />
            <span className="text-base font-bold text-vanillaCustard">Enable notifications</span>
          </label>

          <label className="grid gap-2">
            <span className="text-base font-bold text-vanillaCustard">Recipient emails (comma-separated)</span>
            <input
              value={notifRecipients}
              onChange={(e) => setNotifRecipients(e.target.value)}
              placeholder="admin1@example.com, admin2@example.com"
              className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-base font-bold text-vanillaCustard">Public site URL</span>
            <input
              value={publicSiteUrl}
              onChange={(e) => setPublicSiteUrl(e.target.value)}
              placeholder="https://ftbend-community-resources.netlify.app"
              className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
              inputMode="url"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl bg-powderBlush px-4 py-3 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-60"
              disabled={notifSaving}
              onClick={async () => {
                setNotifSaving(true);
                setNotifError('');
                setNotifSaved(false);
                try {
                  const emails = notifRecipients
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean);

                  const res = await api.patch<{ settings: NotificationSettings }>('/api/admin/notification-settings', {
                    submissionEmailEnabled: notifEnabled,
                    submissionEmailRecipients: emails,
                    publicSiteUrl: publicSiteUrl.trim()
                  });

                  setNotif(res.settings);
                  setNotifEnabled(Boolean(res.settings.submissionEmailEnabled));
                  setNotifRecipients((res.settings.submissionEmailRecipients || []).join(', '));
                  setPublicSiteUrl(res.settings.publicSiteUrl || '');
                  setNotifSaved(true);
                } catch (e: any) {
                  setNotifError(e?.status === 403 ? 'Only admins can change notification settings.' : 'Save failed.');
                } finally {
                  setNotifSaving(false);
                }
              }}
            >
              Save notification settings
            </button>

            {notifSaved ? <div className="text-sm font-bold text-vanillaCustard/85">Saved.</div> : null}
          </div>

          {notifError ? <div className="rounded-2xl bg-graphite/70 p-4 text-base text-vanillaCustard">{notifError}</div> : null}
        </section>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">Loading…</div>
      ) : !options ? (
        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">Could not load options.</div>
      ) : (
        <div className="grid gap-4">
          {items.map((s) => (
            <SubmissionCard key={s._id} item={s} options={options} onUpdated={load} />
          ))}

          {!items.length ? (
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">No submissions.</div>
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

function SubmissionCard(args: { item: SubmissionItem; options: Options; onUpdated: () => void }) {
  const { item, options, onUpdated } = args;

  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const [description, setDescription] = useState(item.notes || 'Submitted by community member.');
  const [locations, setLocations] = useState<Set<string>>(toSet(['Fort Bend']));
  const [types, setTypes] = useState<Set<string>>(toSet(['Community']));
  const [audiences, setAudiences] = useState<Set<string>>(toSet(['All']));
  const [tags, setTags] = useState('submitted');

  const tagList = useMemo(
    () =>
      tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    [tags]
  );

  async function approve() {
    setWorking(true);
    setError('');
    try {
      await api.post<{ resourceId: string }>(`/api/admin/submissions/${item._id}/approve`, {
        resource: {
          description,
          locations: setToList(locations),
          types: setToList(types),
          audiences: setToList(audiences),
          tags: tagList.length ? tagList : ['submitted']
        }
      });
      onUpdated();
    } catch {
      setError('Approve failed.');
    } finally {
      setWorking(false);
    }
  }

  async function reject() {
    setWorking(true);
    setError('');
    try {
      await api.post<void>(`/api/admin/submissions/${item._id}/reject`);
      onUpdated();
    } catch {
      setError('Reject failed.');
    } finally {
      setWorking(false);
    }
  }

  const created = new Date(item.createdAt).toLocaleString();

  return (
    <div className="grid gap-3 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
      <div className="grid gap-1">
        <div className="text-lg font-extrabold text-vanillaCustard">{item.name}</div>
        <div className="text-sm text-vanillaCustard/75 break-all">{item.url}</div>
        <div className="text-sm text-vanillaCustard/75">Submitted: {created}</div>
        <div className="text-sm text-vanillaCustard/75">
          Status: <span className="font-bold">{item.status}</span>
        </div>
      </div>

      {item.status === 'pending' ? (
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-base font-bold text-vanillaCustard">Resource description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-base font-bold text-vanillaCustard">Tags (comma-separated)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <FilterGroup
              title="Locations"
              options={options.locations.map((x) => ({ label: x, value: x }))}
              selected={locations}
              onToggle={(v) => {
                setLocations((prev) => {
                  const next = new Set(prev);
                  if (next.has(v)) next.delete(v);
                  else next.add(v);
                  return next.size ? next : prev;
                });
              }}
            />

            <FilterGroup
              title="Types"
              options={options.types.map((x) => ({ label: x, value: x }))}
              selected={types}
              onToggle={(v) => {
                setTypes((prev) => {
                  const next = new Set(prev);
                  if (next.has(v)) next.delete(v);
                  else next.add(v);
                  return next.size ? next : prev;
                });
              }}
            />

            <FilterGroup
              title="Audiences"
              options={options.audiences.map((x) => ({ label: x, value: x }))}
              selected={audiences}
              onToggle={(v) => {
                setAudiences((prev) => {
                  const next = new Set(prev);
                  if (next.has(v)) next.delete(v);
                  else next.add(v);
                  return next.size ? next : prev;
                });
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl bg-powderBlush px-4 py-3 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-60"
              disabled={working}
              onClick={approve}
            >
              Approve + publish
            </button>

            <button
              type="button"
              className="rounded-xl border border-vanillaCustard/20 bg-graphite/60 px-4 py-3 text-base font-bold text-vanillaCustard hover:border-vanillaCustard/35 disabled:opacity-60"
              disabled={working}
              onClick={reject}
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div className="rounded-2xl bg-graphite/70 p-4 text-base text-vanillaCustard">{error}</div> : null}
    </div>
  );
}
