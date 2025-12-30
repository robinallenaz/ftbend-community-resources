import Fuse from 'fuse.js';
import type { Resource } from '../types';

export function buildResourceFuse(resources: Resource[]) {
  return new Fuse(resources, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
      { name: 'name', weight: 0.45 },
      { name: 'description', weight: 0.25 },
      { name: 'tags', weight: 0.15 },
      { name: 'locations', weight: 0.1 },
      { name: 'types', weight: 0.1 },
      { name: 'audiences', weight: 0.1 }
    ]
  });
}

export function applyResourceFilters(args: {
  resources: Resource[];
  query: string;
  selectedLocations: Set<string>;
  selectedTypes: Set<string>;
  selectedAudiences: Set<string>;
}) {
  const { resources, query, selectedLocations, selectedTypes, selectedAudiences } = args;

  const byFacet = resources.filter((r) => {
    if (selectedLocations.size > 0) {
      const ok = r.locations.some((x) => selectedLocations.has(x));
      if (!ok) return false;
    }
    if (selectedTypes.size > 0) {
      const ok = r.types.some((x) => selectedTypes.has(x));
      if (!ok) return false;
    }
    if (selectedAudiences.size > 0) {
      const ok = r.audiences.some((x) => selectedAudiences.has(x));
      if (!ok) return false;
    }
    return true;
  });

  const q = query.trim();
  if (!q) return byFacet;

  const fuse = buildResourceFuse(byFacet);
  return fuse.search(q).map((r) => r.item);
}
