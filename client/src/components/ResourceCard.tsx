import type { Resource } from '../types';
import Tag from './Tag';
import { getTagColor, type TagTone } from '../utils/tagColors';

export default function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <article className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-xl font-extrabold text-vanillaCustard">
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg outline-none hover:underline focus-visible:underline"
            >
              {resource.name}
            </a>
          </h3>
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-powderBlush px-4 py-2 text-base font-bold text-pitchBlack transition hover:brightness-95"
          >
            Visit
          </a>
        </div>

        <p className="text-base text-vanillaCustard/90">{resource.description}</p>

        <div className="flex flex-wrap gap-2" aria-label="Resource tags">
          {resource.locations.map((x) => (
            <Tag key={`loc-${x}`} tone={getTagColor(x, 'location')}>
              {x}
            </Tag>
          ))}
          {resource.types.map((x) => (
            <Tag key={`type-${x}`} tone={getTagColor(x, 'type')}>
              {x}
            </Tag>
          ))}
          {resource.audiences
            .filter((x) => x !== 'All')
            .map((x) => (
              <Tag key={`aud-${x}`} tone={getTagColor(x, 'audience')}>
                {x}
              </Tag>
            ))}
        </div>
      </div>
    </article>
  );
}
