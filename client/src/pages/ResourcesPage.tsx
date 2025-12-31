import { useState } from 'react';
import ResourceExplorer from '../components/ResourceExplorer';

export default function ResourcesPage() {
  const [showShareMenu, setShowShareMenu] = useState(false);

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

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-extrabold text-vanillaCustard">Resources</h1>
            <p className="text-base text-vanillaCustard/85">
              Search by what you need. Narrow results by location, type, and audience.
            </p>
          </div>
          <div className="relative">
            <button
              className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-sm font-extrabold text-vanillaCustard shadow-soft transition hover:brightness-95"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              Share Resources
            </button>
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-2 shadow-soft z-50">
                <div className="grid gap-1">
                  <a
                    href={shareUrl('facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-3 py-2 text-sm text-vanillaCustard hover:bg-pitchBlack/70 transition"
                  >
                    Facebook
                  </a>
                  <a
                    href={shareUrl('twitter')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-3 py-2 text-sm text-vanillaCustard hover:bg-pitchBlack/70 transition"
                  >
                    Twitter
                  </a>
                  <a
                    href={shareUrl('linkedin')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-3 py-2 text-sm text-vanillaCustard hover:bg-pitchBlack/70 transition"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={shareUrl('email')}
                    className="block rounded-xl px-3 py-2 text-sm text-vanillaCustard hover:bg-pitchBlack/70 transition"
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
