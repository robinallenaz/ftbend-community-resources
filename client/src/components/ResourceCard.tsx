import { useState, useRef, useEffect } from 'react';
import type { Resource, Coordinates } from '../types';
import Tag from './Tag';
import { getTagColor, type TagTone } from '../utils/tagColors';
import { getResourceDistance, formatDistance, getAccuracyLevel } from '../utils/locationUtils';

// Function to parse URLs and convert to clickable links
function parseLinks(text: string): (string | JSX.Element)[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function ResourceCard({ 
  resource, 
  userLocation 
}: { 
  resource: Resource; 
  userLocation?: Coordinates | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // Calculate distance and accuracy if user location is available
  const distance = userLocation ? getResourceDistance(resource, userLocation) : null;
  const accuracyLevel = distance !== null ? getAccuracyLevel(resource) : null;

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
          <div className="flex flex-col gap-1">
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
            {distance !== null && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-vanillaCustard/70">
                  {formatDistance(distance, accuracyLevel === 'precise')}
                </span>
                {accuracyLevel === 'approximate' && (
                  <span 
                    className="text-xs text-vanillaCustard/50 cursor-help"
                    title="Distance to general area center, not exact location"
                  >
                    ℹ️
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {resource.phone && (
              <a
                href={`tel:${resource.phone}`}
                className="rounded-xl bg-paleAmber px-4 py-2 text-base font-bold text-pitchBlack transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack"
                aria-label={`Call ${resource.name} at ${resource.phone}`}
              >
                Call
              </a>
            )}
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-powderBlush px-4 py-2 text-base font-bold text-pitchBlack transition hover:brightness-95"
            >
              Visit
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <p 
              ref={descriptionRef}
              id={`description-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}
              className={`text-base text-vanillaCustard/90 whitespace-pre-wrap transition-all ${
                isExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {parseLinks(resource.description)}
            </p>
          </div>
          {isTruncated && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }
              }}
              aria-expanded={isExpanded}
              aria-controls={`description-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-sm font-bold text-vanillaCustard hover:text-vanillaCustard focus:text-vanillaCustard focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack transition-colors self-start"
            >
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
