import { useEffect, useMemo, useRef, useState } from 'react';
import type { AudienceTag, Resource, ResourceLocation, ResourceType, Coordinates } from '../types';
import FilterGroup from './FilterGroup';
import ResourceCard from './ResourceCard';
import { filterResourcesByDistance } from '../utils/locationUtils';
import { trackResourceSearch } from '../utils/analytics-simple';
import { useAllTaxonomy } from '../hooks/useTaxonomy';

const RESOURCE_CACHE_KEY = 'ftbend_resources_cache_v2';
const RESOURCE_CACHE_TTL_MS = 1000 * 60 * 30;
const MAX_CACHE_SIZE = 1024 * 1024; // 1MB limit
const API_LIMIT = 50;
const LOCATION_FILTER_RADIUS = 50; // miles
const TEXT_ENCODER = new TextEncoder(); // Create once for performance

function toSortedArray(set: Set<string>) {
  return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

export default function ResourceExplorer(args: { initialQuery?: string; userLocation?: Coordinates | null }) {
  const { initialQuery, userLocation } = args;
  const [query, setQuery] = useState(initialQuery ?? '');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedAudiences, setSelectedAudiences] = useState<Set<string>>(new Set());

  // Get dynamic taxonomy data
  const { locations, resourceTypes, audiences, isLoading: taxonomyLoading } = useAllTaxonomy();

  const prevSearchKeyRef = useRef<string | null>(null);
  const cacheHydrationAttemptedRef = useRef(false);

  const [items, setItems] = useState<Resource[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

  const searchParams = useMemo(() => {
    const q = query.trim();
    const locations = Array.from(selectedLocations).filter(loc => loc.trim().length > 0).sort();
    const types = Array.from(selectedTypes).filter(type => type.trim().length > 0).sort();
    const audiences = Array.from(selectedAudiences).filter(aud => aud.trim().length > 0).sort();
    
    return { q, locations, types, audiences };
  }, [query, selectedLocations, selectedTypes, selectedAudiences]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      if (cancelled) return;
      
      setIsLoading(true);
      setLoadError(null);

      try {
        const q = searchParams.q;
        const locations = searchParams.locations;
        const types = searchParams.types;
        const audiences = searchParams.audiences;

        // Check if we should hydrate from cache (only for initial empty search)
        const shouldHydrateFromCache =
          !q && locations.length === 0 && types.length === 0 && audiences.length === 0 && 
          items === null && !isCacheHydrated && !cacheHydrationAttemptedRef.current;

        if (shouldHydrateFromCache) {
          cacheHydrationAttemptedRef.current = true;
          
          try {
            const raw = sessionStorage.getItem(RESOURCE_CACHE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw) as { ts?: unknown; items?: unknown; version?: string };
              if (
                typeof parsed.ts === 'number' &&
                Date.now() - parsed.ts <= RESOURCE_CACHE_TTL_MS &&
                Array.isArray(parsed.items) &&
                (parsed.version === undefined || parsed.version === 'v2')
              ) {
                setItems(parsed.items as Resource[]);
                setIsCacheHydrated(true);
                setIsLoading(false);
                return; // Skip API call when cache is valid
              }
            }
          } catch {
            // Ignore cache errors and proceed with API call
          }
        }

        // Proceed with API call
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        params.set('limit', API_LIMIT.toString());

        if (locations.length) params.set('locations', locations.join(','));
        if (types.length) params.set('types', types.join(','));
        if (audiences.length) params.set('audiences', audiences.join(','));

        const url = `/api/public/resources${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Failed to load resources (${res.status})`);
        }

        const json: unknown = await res.json();
        const responseData = json as { items?: unknown[]; success?: boolean; error?: string };
        
        if (responseData.success === false && responseData.error) {
          throw new Error(`Server error: ${responseData.error}`);
        }
        
        const rawItems = responseData.items;
        
        if (!Array.isArray(rawItems)) {
          throw new Error('Unexpected response from server');
        }

        const mapped: Resource[] = rawItems
          .map((r) => {
            if (cancelled) return null;
            
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

            // Validate required fields
            if (!item._id || typeof item._id !== 'string' || 
                !item.name || typeof item.name !== 'string' || 
                !item.description || typeof item.description !== 'string' || 
                !item.url || typeof item.url !== 'string') {
              return null;
            }

            // Validate URL format
            try {
              new URL(item.url);
            } catch {
              return null;
            }

            // Validate enum values using dynamic taxonomy
            // Fallback to empty arrays if taxonomy is still loading or failed to load
            const validLocations = taxonomyLoading ? [] : locations.map(loc => loc.value);
            const validTypes = taxonomyLoading ? [] : resourceTypes.map(type => type.value);
            const validAudiences = taxonomyLoading ? [] : audiences.map(aud => aud.value);

            // If taxonomy is loading, keep original values for now
            // They will be filtered when taxonomy loads successfully
            const itemLocations = taxonomyLoading 
              ? (item.locations || [])
              : (item.locations || []).filter(loc => validLocations.includes(loc));
            const itemTypes = taxonomyLoading 
              ? (item.types || [])
              : (item.types || []).filter(type => validTypes.includes(type));
            const itemAudiences = taxonomyLoading 
              ? (item.audiences || [])
              : (item.audiences || []).filter(aud => validAudiences.includes(aud));

            return {
              id: item._id,
              name: item.name,
              description: item.description,
              url: item.url,
              locations: itemLocations,
              types: itemTypes,
              audiences: itemAudiences,
              tags: Array.isArray(item.tags) ? item.tags : []
            };
          })
          .filter((r): r is Resource => r !== null);

        if (!cancelled) {
          setItems(mapped);

          // Track analytics for resource searches
          const hasSearchQuery = q.length > 0;
          const hasFilters = locations.length > 0 || types.length > 0 || audiences.length > 0;
          
          if (hasSearchQuery || hasFilters) {
            const primaryType = types.length > 0 ? types[0] : undefined;
            const primaryAudience = audiences.length > 0 ? audiences[0] : undefined;
            trackResourceSearch(primaryType, primaryAudience);
          }

          // Cache results for empty searches only
          const shouldCache = !q && locations.length === 0 && types.length === 0 && audiences.length === 0;
          if (shouldCache) {
            try {
              const cacheData = JSON.stringify({ version: 'v2', ts: Date.now(), items: mapped });
              // Use pre-created TextEncoder for accurate UTF-8 byte counting
              const byteSize = TEXT_ENCODER.encode(cacheData).length;
              if (byteSize < MAX_CACHE_SIZE) {
                sessionStorage.setItem(RESOURCE_CACHE_KEY, cacheData);
              }
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
        // Always ensure loading state is reset
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    // Create a stable key for all search parameters to detect any changes
    const searchKey = JSON.stringify({
      q: searchParams.q,
      locations: searchParams.locations,
      types: searchParams.types,
      audiences: searchParams.audiences
    });
    const prevSearchKey = prevSearchKeyRef.current;
    prevSearchKeyRef.current = searchKey;
    
    // Apply debounce when any search parameter changes
    const debounceTimeMs = prevSearchKey !== null && prevSearchKey !== searchKey ? 250 : 0;

    const t = window.setTimeout(load, debounceTimeMs);

    return () => {
      controller.abort();
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [searchParams, isCacheHydrated]);

  const filtered = useMemo(() => {
    let filteredItems = items || [];
    
    // Apply location-based filtering if user location is available
    if (userLocation) {
      filteredItems = filterResourcesByDistance(filteredItems, userLocation, LOCATION_FILTER_RADIUS);
    }
    
    // Sort by name
    return filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  }, [items, userLocation]);

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

  const [showFilters, setShowFilters] = useState(false);
  const hasActive = query.trim().length > 0 || selectedLocations.size > 0 || selectedTypes.size > 0 || selectedAudiences.size > 0;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft">
        <div className="grid gap-3">
          <label className="grid gap-2" htmlFor="resource-search">
            <h2 className="text-lg font-extrabold text-vanillaCustard flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search resources
            </h2>
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
              <>Showing <span className="font-extrabold text-vanillaCustard">{filtered.length}</span> result{filtered.length === 1 ? '' : 's'}</>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-bold text-vanillaCustard/90 flex items-center gap-2"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={!hasActive}
                className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-bold text-vanillaCustard/90 disabled:opacity-50"
              >
                Clear search & filters
              </button>
            </div>
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
              <div className="mt-3 text-sm text-vanillaCustard/75">Can't find what you need? Try adjusting your filters.</div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Filters - Hidden on mobile, visible on desktop */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
          <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-vanillaCustard">Filter Resources</h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="lg:hidden rounded-xl border border-vanillaCustard/20 bg-graphite p-2 text-vanillaCustard/90"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <FilterGroup
                title="Location"
                description="Choose one or more."
                options={locations.map(item => ({ label: item.label, value: item.value }))}
                selected={selectedLocations}
                onToggle={(v) => toggle(setSelectedLocations, v)}
                shortcutKey="L"
              />
              <FilterGroup
                title="Resource Type"
                description="Choose one or more."
                options={resourceTypes.map(item => ({ label: item.label, value: item.value }))}
                selected={selectedTypes}
                onToggle={(v) => toggle(setSelectedTypes, v)}
                shortcutKey="T"
              />
              <FilterGroup
                title="Audience"
                description="Choose one or more."
                options={audiences.map(item => ({ label: item.label, value: item.value }))}
                selected={selectedAudiences}
                onToggle={(v) => toggle(setSelectedAudiences, v)}
                shortcutKey="A"
              />
            </div>
          </div>
        </div>

        {/* Results - Full width on mobile, 2 cols on desktop */}
        <section className="grid gap-4 lg:col-span-2" aria-label="Search results">
          {filtered.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 text-base text-vanillaCustard/90">
              <div className="text-lg font-extrabold text-vanillaCustard">No matches</div>
              <div className="mt-2">Try a shorter search, or clear some filters.</div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 text-base text-vanillaCustard/90">
              <div className="text-lg font-extrabold text-vanillaCustard">Loading resources...</div>
            </div>
          ) : null}

          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} userLocation={userLocation} />
          ))}
        </section>
      </div>
    </div>
  );
}
