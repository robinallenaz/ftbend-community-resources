import { useState, useRef, useEffect } from 'react';
import type { Resource } from '../types';
import Tag from './Tag';
import { getTagColor, type TagTone } from '../utils/tagColors';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (descriptionRef.current) {
        // Check if the content height is greater than the line-clamp height
        const lineHeight = parseInt(window.getComputedStyle(descriptionRef.current).lineHeight);
        const maxHeight = lineHeight * 3; // 3 lines
        setIsTruncated(descriptionRef.current.scrollHeight > maxHeight);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [resource.description]);

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

        <div className="flex flex-col gap-2">
          <p 
            ref={descriptionRef}
            id={`description-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}
            className={`text-base text-vanillaCustard/90 whitespace-pre-wrap transition-all ${
              isExpanded ? '' : 'line-clamp-3'
            }`}
            aria-live="polite"
            aria-expanded={isExpanded}
          >
            {resource.description}
          </p>
          {isTruncated && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }
              }}
              className="text-sm font-bold text-vanillaCustard/90 hover:text-vanillaCustard focus:text-vanillaCustard focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack rounded transition-colors self-start"
              aria-expanded={isExpanded}
              aria-controls={`description-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'} full description for {resource.name}: </span>
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

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
