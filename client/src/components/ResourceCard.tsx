import { useState, useRef, useEffect } from 'react';
import type { Resource, Coordinates } from '../types';
import Tag from './Tag';
import { getTagColor, type TagTone } from '../utils/tagColors';
import { getResourceDistance, formatDistance, getAccuracyLevel } from '../utils/locationUtils';

// Function to parse URLs and markdown-style links to clickable links
function parseLinks(text: string): (string | JSX.Element)[] {
  // Match markdown-style links [text](url) first
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  // Then match raw URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const elements: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  
  // Process markdown links first
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    
    const [, linkText, url] = match;
    elements.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-paleAmber hover:text-vanillaCustard underline transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {linkText}
      </a>
    );
    
    lastIndex = markdownLinkRegex.lastIndex;
  }
  
  // Add remaining text after last markdown link
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    
    // Process any raw URLs in the remaining text
    const urlParts = remainingText.split(urlRegex);
    urlParts.forEach((part, index) => {
      if (part.match(urlRegex)) {
        elements.push(
          <a
            key={`url-${lastIndex}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-paleAmber hover:text-vanillaCustard underline transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      } else if (part) {
        elements.push(part);
      }
    });
  }
  
  return elements;
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
  const [isHovered, setIsHovered] = useState(false);
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
    <article 
      className="rounded-2xl border border-vanillaCustard/15 bg-gradient-to-br from-pitchBlack via-pitchBlack/95 to-pitchBlack/90 p-5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4),0_12px_24px_-8px_rgba(0,0,0,0.3),0_8px_16px_-6px_rgba(0,0,0,0.2),0_4px_8px_-4px_rgba(0,0,0,0.15)] transition-all duration-700 ease-out hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_15px_30px_-8px_rgba(0,0,0,0.4),0_10px_20px_-6px_rgba(0,0,0,0.3),0_6px_12px_-4px_rgba(0,0,0,0.2),0_2px_4px_-2px_rgba(0,0,0,0.1)] hover:border-vanillaCustard/20 hover:scale-[1.005] hover:-translate-y-0.5 relative overflow-hidden group backdrop-blur-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label={`Resource: ${resource.name}. ${resource.description.substring(0, 100)}${resource.description.length > 100 ? '...' : ''}. ${resource.locations.join(', ')}. ${resource.types.join(', ')}. ${resource.audiences.filter(x => x !== 'All').join(', ')}`}
    >
      {/* Enhanced drop shadow for depth */}
      <div className="absolute -bottom-2 -left-2 -right-2 h-4 bg-gradient-to-t from-black/20 to-transparent rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" aria-hidden="true" />
      
      {/* Ambient shadow from sides */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(0,0,0,0.05)] opacity-30 group-hover:opacity-50 transition-opacity duration-700" aria-hidden="true" />
      
      {/* Very subtle card texture overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-vanillaCustard/3 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-1000" aria-hidden="true" />
      
      {/* Gentle edge highlight */}
      <div className="absolute inset-0 rounded-2xl border border-vanillaCustard/15 opacity-0 group-hover:opacity-50 transition-opacity duration-1000" aria-hidden="true" />
      
      <div className="relative flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-extrabold text-vanillaCustard">
              {resource.name}
            </h3>
            {distance !== null && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-vanillaCustard/70 group-hover:text-vanillaCustard/60 transition-colors duration-700">
                  {formatDistance(distance, accuracyLevel === 'precise')}
                </span>
                {accuracyLevel === 'approximate' && (
                  <span 
                    className="text-xs text-vanillaCustard/50 cursor-help group-hover:text-vanillaCustard/40 transition-colors duration-700"
                    title="Distance to general area center, not exact location"
                    role="tooltip"
                    aria-label="Approximate distance - distance to general area center, not exact location"
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
                className="rounded-xl bg-gradient-to-br from-paleAmber to-paleAmber/90 px-4 py-2 text-base font-bold text-pitchBlack transition-all duration-700 hover:brightness-105 hover:scale-[1.01] hover:shadow-[0_8px_16px_rgba(250,204,173,0.3),0_4px_8px_rgba(250,204,173,0.2)] focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack"
                aria-label={`Call ${resource.name} at ${resource.phone}`}
              >
                Call
              </a>
            )}
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-gradient-to-br from-powderBlush to-powderBlush/90 px-4 py-2 text-base font-bold text-pitchBlack transition-all duration-700 hover:brightness-105 hover:scale-[1.01] hover:shadow-[0_8px_16px_rgba(251,207,232,0.3),0_4px_8px_rgba(251,207,232,0.2)]"
              aria-label={`Visit ${resource.name} website (opens in new tab)`}
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
              className={`text-base text-vanillaCustard/90 whitespace-pre-wrap transition-all duration-700 ${
                isExpanded ? '' : 'line-clamp-3'
              } ${isHovered ? 'text-vanillaCustard' : ''}`}
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
              className="text-sm font-bold text-vanillaCustard/90 hover:text-vanillaCustard/70 focus:text-vanillaCustard focus:outline-none focus:ring-1 focus:ring-paleAmber/30 focus:ring-offset-1 focus:ring-offset-pitchBlack transition-all duration-300 self-start relative"
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} resource description`}
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
