import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FilterGroup from '../components/FilterGroup';
import { api } from '../admin/api';
import { useAuth } from '../admin/auth';

type Options = { locations: string[]; types: string[]; audiences: string[] };

type ResourceDoc = {
  _id: string;
  name: string;
  description: string;
  url: string;
  locations: string[];
  types: string[];
  audiences: string[];
  tags: string[];
  status: 'active' | 'archived';
};

function toSet(list: string[]) {
  return new Set(list);
}

function setToList(s: Set<string>) {
  return Array.from(s.values());
}

export default function AdminResourceEditorPage() {
  const params = useParams();
  const id = params.id || '';
  const isNew = id === 'new';

  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Options | null>(null);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [locations, setLocations] = useState<Set<string>>(toSet(['Fort Bend']));
  const [types, setTypes] = useState<Set<string>>(toSet(['Community']));
  const [audiences, setAudiences] = useState<Set<string>>(toSet(['All']));
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [error, setError] = useState('');

  const tagList = useMemo(
    () =>
      tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    [tags]
  );

  async function load() {
    setLoading(true);
    setError('');

    try {
      const opt = await api.get<{ options: Options }>('/api/admin/options');
      setOptions(opt.options);

      if (!isNew) {
        const res = await api.get<{ item: ResourceDoc }>(`/api/admin/resources/${id}`);
        const item = res.item;
        setName(item.name);
        setUrl(item.url);
        setDescription(item.description);
        setLocations(toSet(item.locations));
        setTypes(toSet(item.types));
        setAudiences(toSet(item.audiences));
        setTags(item.tags.join(', '));
        setStatus(item.status);
      }
    } catch {
      setError('Could not load resource.');
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
      url,
      description,
      locations: setToList(locations),
      types: setToList(types),
      audiences: setToList(audiences),
      tags: tagList.length ? tagList : ['general']
    };

    try {
      if (isNew) {
        await api.post<{ id: string }>('/api/admin/resources', payload);
      } else {
        const patch: any = { ...payload };
        if (user?.role === 'admin') patch.status = status;
        await api.patch<{ id: string }>(`/api/admin/resources/${id}`, patch);
      }
      navigate('/admin/resources');
    } catch {
      setError('Save failed. Please check required fields.');
    }
  }

  async function archive() {
    setError('');
    try {
      await api.post<void>(`/api/admin/resources/${id}/archive`);
      navigate('/admin/resources');
    } catch {
      setError('Archive failed.');
    }
  }

  async function unarchive() {
    setError('');
    try {
      await api.post<void>(`/api/admin/resources/${id}/unarchive`);
      navigate('/admin/resources');
    } catch {
      setError('Unarchive failed.');
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">Loading…</div>;
  }

  if (!options) {
    return <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">Could not load options.</div>;
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">{isNew ? 'Add resource' : 'Edit resource'}</h1>
          <p className="text-base text-vanillaCustard/85">Simple form—no markdown.</p>
        </div>

        <Link
          to="/admin/resources"
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
          <span className="text-base font-bold text-vanillaCustard">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Tags (comma-separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
            placeholder="community, youth, support"
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
