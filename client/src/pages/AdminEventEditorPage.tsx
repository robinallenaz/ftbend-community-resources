import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../admin/api';
import { useAuth } from '../admin/auth';

type EventDoc = {
  _id: string;
  name: string;
  schedule: string;
  url: string;
  locationHint: string;
  instagramPost?: string;
  facebookEvent?: string;
  status: 'active' | 'archived';
};

export default function AdminEventEditorPage() {
  const params = useParams();
  const id = params.id || '';
  const isNew = id === 'new';

  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [url, setUrl] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [instagramPost, setInstagramPost] = useState('');
  const [facebookEvent, setFacebookEvent] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      if (!isNew) {
        const res = await api.get<{ item: EventDoc }>(`/api/admin/events/${id}`);
        const item = res.item;
        setName(item.name);
        setSchedule(item.schedule);
        setUrl(item.url);
        setLocationHint(item.locationHint);
        setInstagramPost(item.instagramPost || '');
        setFacebookEvent(item.facebookEvent || '');
        setStatus(item.status);
      }
    } catch {
      setError('Could not load event.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError('');

    const payload = {
      name,
      schedule,
      url,
      locationHint,
      instagramPost,
      facebookEvent
    };

    try {
      if (isNew) {
        await api.post<{ id: string }>('/api/admin/events', payload);
      } else {
        const patch: any = { ...payload };
        if (user?.role === 'admin') patch.status = status;
        await api.patch<{ id: string }>(`/api/admin/events/${id}`, patch);
      }
      navigate('/admin/events');
    } catch {
      setError('Save failed. Please check required fields.');
    }
  }

  async function archive() {
    setError('');
    try {
      await api.post<void>(`/api/admin/events/${id}/archive`);
      navigate('/admin/events');
    } catch {
      setError('Archive failed.');
    }
  }

  async function unarchive() {
    setError('');
    try {
      await api.post<void>(`/api/admin/events/${id}/unarchive`);
      navigate('/admin/events');
    } catch {
      setError('Unarchive failed.');
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">Loading…</div>;
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">{isNew ? 'Add event' : 'Edit event'}</h1>
          <p className="text-base text-vanillaCustard/85">Keep it short and clear.</p>
        </div>

        <Link
          to="/admin/events"
          className="rounded-xl border border-vanillaCustard/20 bg-graphite/60 px-3 py-2 text-base font-bold text-vanillaCustard hover:border-vanillaCustard/35"
        >
          Back
        </Link>
      </header>

      <form onSubmit={onSave} className="grid gap-4 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Schedule</span>
          <input
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            required
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
            placeholder="2nd Thursday of the month"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Where</span>
          <input
            value={locationHint}
            onChange={(e) => setLocationHint(e.target.value)}
            required
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
            placeholder="Fort Bend County"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            inputMode="url"
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Instagram Post URL (optional)</span>
          <input
            value={instagramPost}
            onChange={(e) => setInstagramPost(e.target.value)}
            inputMode="url"
            placeholder="https://www.instagram.com/p/..."
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Facebook Event URL (optional)</span>
          <input
            value={facebookEvent}
            onChange={(e) => setFacebookEvent(e.target.value)}
            inputMode="url"
            placeholder="https://www.facebook.com/events/..."
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        {user?.role === 'admin' && !isNew ? (
          <label className="grid gap-2">
            <span className="text-base font-bold text-vanillaCustard">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
              className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-semibold text-vanillaCustard"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl bg-powderBlush px-4 py-3 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95"
          >
            Save
          </button>

          {!isNew && user?.role === 'admin' ? (
            <button
              type="button"
              className="rounded-xl border border-vanillaCustard/20 bg-graphite/60 px-4 py-3 text-base font-bold text-vanillaCustard hover:border-vanillaCustard/35"
              onClick={status === 'archived' ? unarchive : archive}
            >
              {status === 'archived' ? 'Unarchive' : 'Archive'}
            </button>
          ) : null}
        </div>

        {error ? <div className="rounded-2xl bg-graphite/70 p-4 text-base text-vanillaCustard">{error}</div> : null}
      </form>
    </div>
  );
}
