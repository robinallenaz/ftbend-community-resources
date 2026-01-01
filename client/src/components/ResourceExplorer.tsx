import { useEffect, useMemo, useRef, useState } from 'react';
import type { AudienceTag, Resource, ResourceLocation, ResourceType } from '../types';
import FilterGroup from './FilterGroup';
import ResourceCard from './ResourceCard';

const RESOURCE_CACHE_KEY = 'ftbend_resources_cache_v1';
const RESOURCE_CACHE_TTL_MS = 1000 * 60 * 30;

const LOCATION_OPTIONS: { label: string; value: ResourceLocation }[] = [
  { label: 'Fort Bend', value: 'Fort Bend' },
  { label: 'Houston', value: 'Houston' },
  { label: 'Virtual', value: 'Virtual' },
  { label: 'South TX', value: 'South TX' },
  { label: 'TX', value: 'TX' }
];

const TYPE_OPTIONS: { label: string; value: ResourceType }[] = [
  { label: 'Mental Health', value: 'Mental Health' },
  { label: 'Legal', value: 'Legal' },
  { label: 'Self Care', value: 'Self Care' },
  { label: 'Faith', value: 'Faith' },
  { label: 'Business', value: 'Business' },
  { label: 'Community', value: 'Community' },
  { label: 'Pride Orgs', value: 'Pride Orgs' },
  { label: 'Arts', value: 'Arts' },
  { label: 'Youth', value: 'Youth' },
  { label: 'Family', value: 'Family' },
  { label: 'Events', value: 'Events' },
  { label: 'Medical', value: 'Medical' }
];

const AUDIENCE_OPTIONS: { label: string; value: AudienceTag }[] = [
  { label: 'Trans', value: 'Trans' },
  { label: 'Youth', value: 'Youth' },
  { label: 'Seniors', value: 'Seniors' },
  { label: 'Families', value: 'Families' }
];

function toSortedArray(set: Set<string>) {
  return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

export default function ResourceExplorer(args: { initialQuery?: string }) {
  const [query, setQuery] = useState(args.initialQuery ?? '');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedAudiences, setSelectedAudiences] = useState<Set<string>>(new Set());

  const prevQueryRef = useRef<string | null>(null);

  const [items, setItems] = useState<Resource[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const q = query.trim();

        const params = new URLSearchParams();
        if (q) params.set('q', q);

        const locations = Array.from(selectedLocations);
        const types = Array.from(selectedTypes);
        const audiences = Array.from(selectedAudiences);

        if (locations.length) params.set('locations', locations.join(','));
        if (types.length) params.set('types', types.join(','));
        if (audiences.length) params.set('audiences', audiences.join(','));

        const url = `/api/public/resources${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Failed to load resources (${res.status})`);
        }

        const json: unknown = await res.json();
        const rawItems = (json as { items?: unknown[] }).items;
        if (!Array.isArray(rawItems)) {
          throw new Error('Unexpected response from server');
        }

        const mapped: Resource[] = rawItems
          .map((r) => {
            const item = r as {
              _id?: string;
              name?: string;
              description?: string;
              url?: string;
              locations?: string[];
              types?: string[];
              audiences?: string[];
              tags?: string[];
            };

            return {
              id: item._id ? String(item._id) : '',
              name: item.name || '',
              description: item.description || '',
              url: item.url || '',
              locations: (item.locations || []) as ResourceLocation[],
              types: (item.types || []) as ResourceType[],
              audiences: (item.audiences || []) as AudienceTag[],
              tags: item.tags || []
            };
          })
          .filter((r) => Boolean(r.id) && Boolean(r.name) && Boolean(r.description) && Boolean(r.url));

        if (!cancelled) {
          setItems(mapped);

          const shouldCache = !q && locations.length === 0 && types.length === 0 && audiences.length === 0;
          if (shouldCache) {
            try {
              sessionStorage.setItem(
                RESOURCE_CACHE_KEY,
                JSON.stringify({ ts: Date.now(), items: mapped })
              );
            } catch {
              // ignore cache failures
            }
          }
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : 'Failed to load resources';
        setLoadError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const q = query.trim();
    const locations = Array.from(selectedLocations);
    const types = Array.from(selectedTypes);
    const audiences = Array.from(selectedAudiences);

    const shouldHydrateFromCache =
      !q && locations.length === 0 && types.length === 0 && audiences.length === 0 && items === null;

    if (shouldHydrateFromCache) {
      try {
        const raw = sessionStorage.getItem(RESOURCE_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { ts?: unknown; items?: unknown };
          if (
            typeof parsed.ts === 'number' &&
            Date.now() - parsed.ts < RESOURCE_CACHE_TTL_MS &&
            Array.isArray(parsed.items)
          ) {
            setItems(parsed.items as Resource[]);
          }
        }
      } catch {
        // ignore cache failures
      }
    }

    const debounceMs = prevQueryRef.current !== null && prevQueryRef.current !== q ? 250 : 0;
    prevQueryRef.current = q;
    const t = window.setTimeout(load, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      controller.abort();
    };
  }, [query, selectedLocations, selectedTypes, selectedAudiences]);

  const filtered = useMemo(() => {
    return (items || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const activeFilters = useMemo(() => {
    return {
      locations: toSortedArray(selectedLocations),
      types: toSortedArray(selectedTypes),
      audiences: toSortedArray(selectedAudiences)
    };
  }, [selectedLocations, selectedTypes, selectedAudiences]);

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function clearAll() {
    setQuery('');
    setSelectedLocations(new Set());
    setSelectedTypes(new Set());
    setSelectedAudiences(new Set());
  }

  const hasActive = query.trim().length > 0 || selectedLocations.size > 0 || selectedTypes.size > 0 || selectedAudiences.size > 0;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft">
        <div className="grid gap-3">
          <label className="grid gap-2" htmlFor="resource-search">
            <h2 className="text-lg font-extrabold text-vanillaCustard">Search resources</h2>
            <span className="text-sm text-vanillaCustard/75">
              Type what you need. Results update as you type. Example: "trans", "Fort Bend", "counseling", "youth".
            </span>
          </label>

          <input
            id="resource-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard placeholder:text-vanillaCustard/60"
            inputMode="search"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-base text-vanillaCustard/85" aria-live="polite">
              Showing <span className="font-extrabold text-vanillaCustard">{filtered.length}</span> result
              {filtered.length === 1 ? '' : 's'}
            </div>
            <button
              type="button"
              onClick={clearAll}
              disabled={!hasActive}
              className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-bold text-vanillaCustard/90 disabled:opacity-50"
            >
              Clear search & filters
            </button>
          </div>

          {isLoading ? (
            <div className="text-sm text-vanillaCustard/75" aria-live="polite">
              Loading updated resources…
            </div>
          ) : null}

          {loadError ? (
            <div className="rounded-2xl bg-graphite/70 p-4 text-sm text-vanillaCustard/90" role="status">
              Live updates are temporarily unavailable. Please refresh in a moment.
            </div>
          ) : null}

          {hasActive ? (
            <div className="rounded-2xl bg-graphite/70 p-4 text-base text-vanillaCustard/90">
              <div className="font-extrabold text-vanillaCustard">Active filters</div>
              <div className="mt-2 grid gap-1">
                <div>
                  <span className="font-bold">Location:</span> {activeFilters.locations.length ? activeFilters.locations.join(', ') : 'Any'}
                </div>
                <div>
                  <span className="font-bold">Type:</span> {activeFilters.types.length ? activeFilters.types.join(', ') : 'Any'}
                </div>
                <div>
                  <span className="font-bold">Audience:</span> {activeFilters.audiences.length ? activeFilters.audiences.join(', ') : 'Any'}
                </div>
              </div>
              <div className="mt-3 text-sm text-vanillaCustard/75">Can’t find what you need? Try adjusting your filters.</div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-1">
          <FilterGroup
            title="Location"
            description="Choose one or more."
            options={LOCATION_OPTIONS}
            selected={selectedLocations}
            onToggle={(v) => toggle(setSelectedLocations, v)}
          />
          <FilterGroup
            title="Resource Type"
            description="Choose one or more."
            options={TYPE_OPTIONS}
            selected={selectedTypes}
            onToggle={(v) => toggle(setSelectedTypes, v)}
          />
          <FilterGroup
            title="Audience"
            description="Choose one or more."
            options={AUDIENCE_OPTIONS}
            selected={selectedAudiences}
            onToggle={(v) => toggle(setSelectedAudiences, v)}
          />
        </div>

        <section className="grid gap-4 lg:col-span-2" aria-label="Search results">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 text-base text-vanillaCustard/90">
              <div className="text-lg font-extrabold text-vanillaCustard">No matches</div>
              <div className="mt-2">Try a shorter search, or clear some filters.</div>
            </div>
          ) : null}

          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </section>
      </div>
    </div>
  );
}
