import { useState, useEffect, useRef } from 'react';
import ResourceExplorer from '../components/ResourceExplorer';

// Add structured data for Resources page
function addResourcesStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://ftbend-community-resources.netlify.app/resources/#collectionpage',
    name: 'LGBTQIA+ Resources - Fort Bend County',
    description: 'Search LGBTQIA+ resources by location, type, and audience. Find support groups, healthcare providers, legal services, and more.',
    url: 'https://ftbend-community-resources.netlify.app/resources',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://ftbend-community-resources.netlify.app/#website'
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Fort Bend County LGBTQIA+ Community Resources',
      description: 'Comprehensive directory of LGBTQIA+ resources including healthcare, legal services, support groups, and community organizations.',
      numberOfItems: 0, // This would be dynamically updated
      itemListElement: [] // This would be populated with actual resources
    },
    about: [
      'LGBTQIA+ Support',
      'Community Resources',
      'Healthcare Services',
      'Legal Aid',
      'Mental Health',
      'Social Services'
    ],
    audience: 'LGBTQIA+ Community and Allies',
    inLanguage: 'en-US'
  };

  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"][data-page="resources"]');
  if (existing) existing.remove();

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-page', 'resources');
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

export default function ResourcesPage() {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Add structured data when component mounts
  useEffect(() => {
    addResourcesStructuredData();
  }, []);

  const shareUrl = (platform: string) => {
    const url = window.location.href;
    const title = 'Fort Bend County LGBTQIA+ Resources';
    const description = 'Search LGBTQIA+ resources by location, type, and audience. Find support groups, healthcare providers, and more.';

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDesc = encodeURIComponent(description);

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=ftbend_lgbtqia`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`;
      default:
        return url;
    }
  };

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          shareButtonRef.current && !shareButtonRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowShareMenu(false);
        shareButtonRef.current?.focus();
      }
    }

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showShareMenu]);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-extrabold text-vanillaCustard">LGBTQIA+ Resources</h1>
            <p className="text-base text-vanillaCustard/85">
              Search by what you need. Narrow results by location, type, and audience.
            </p>
          </div>
          <div className="relative">
            <button
              ref={shareButtonRef}
              className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-sm font-extrabold text-vanillaCustard shadow-soft transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-graphite"
              onClick={() => setShowShareMenu(!showShareMenu)}
              aria-expanded={showShareMenu}
              aria-haspopup="true"
            >
              Share Resources
            </button>
            {showShareMenu && (
              <div 
                ref={menuRef}
                className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-2 shadow-soft z-50"
                role="menu"
              >
                <div className="grid gap-1">
                  <a
                    href={shareUrl('facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-3 py-2 text-sm text-vanillaCustard hover:bg-pitchBlack/70 transition focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-1 focus:ring-offset-pitchBlack"
                    role="menuitem"
                  >
                    Facebook
                  </a>
                  <a
                    href={shareUrl('twitter')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-3 py-2 text-sm text-vanillaCustard hover:bg-pitchBlack/70 transition focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-1 focus:ring-offset-pitchBlack"
                    role="menuitem"
                  >
                    Twitter
                  </a>
                  <a
                    href={shareUrl('linkedin')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-3 py-2 text-sm text-vanillaCustard hover:bg-pitchBlack/70 transition focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-1 focus:ring-offset-pitchBlack"
                    role="menuitem"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={shareUrl('email')}
                    className="block rounded-xl px-3 py-2 text-sm text-vanillaCustard hover:bg-pitchBlack/70 transition focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-1 focus:ring-offset-pitchBlack"
                    role="menuitem"
                  >
                    Email
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ResourceExplorer />
    </div>
  );
}
