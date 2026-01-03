 import { useEffect, useState } from 'react';

type EventItem = {
  _id: string;
  name: string;
  schedule: string;
  url: string;
  locationHint: string;
};

type GalleryItem = {
  _id: string;
  filename: string;
  originalName: string;
  caption: string;
  order: number;
};

// Add structured data for Events page
function addEventsStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    '@id': 'https://ftbend-community-resources.netlify.app/events/#eventseries',
    name: 'Fort Bend LGBTQIA+ Community Events',
    description: 'Monthly community events, meetups, and support gatherings for the LGBTQIA+ community in Fort Bend County and surrounding areas.',
    url: 'https://ftbend-community-resources.netlify.app/events',
    organizer: {
      '@type': 'Organization',
      '@id': 'https://ftbend-community-resources.netlify.app/#organization',
      name: 'Fort Bend County LGBTQIA+ Community'
    },
    location: {
      '@type': 'Place',
      name: 'Fort Bend County, Texas',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'TX',
        addressLocality: 'Fort Bend County'
      }
    },
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    typicalAgeRange: '18-',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    about: [
      'LGBTQIA+ Community',
      'Social Events',
      'Support Groups',
      'Community Building',
      'Fort Bend County'
    ],
    audience: 'LGBTQIA+ Community and Allies'
  };

  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"][data-page="events"]');
  if (existing) existing.remove();

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-page', 'events');
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryLoading, setGalleryLoading] = useState(true);

  // Add structured data when component mounts
  useEffect(() => {
    addEventsStructuredData();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/public/events', { credentials: 'include' });
        if (!res.ok) throw new Error('Request failed');
        const json = (await res.json()) as { items: EventItem[] };
        if (!cancelled) setItems(Array.isArray(json.items) ? json.items : []);
      } catch {
        if (!cancelled) setError('Could not load events.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadGallery() {
      setGalleryLoading(true);
      try {
        const res = await fetch('/api/public/gallery', { credentials: 'include' });
        if (!res.ok) throw new Error('Request failed');
        const json = (await res.json()) as { items: GalleryItem[] };
        if (!cancelled) setGalleryItems(Array.isArray(json.items) ? json.items : []);
      } catch {
        console.error('Could not load gallery images');
      } finally {
        if (!cancelled) setGalleryLoading(false);
      }
    }

    load();
    loadGallery();
    return () => {
      cancelled = true;
    };
  }, []);

  function nextImage() {
    setCurrentImageIndex((prev) => (prev + 1) % galleryItems.length);
  }

  function previousImage() {
    setCurrentImageIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">LGBTQIA+ Community Events</h1>
        <p className="text-base text-vanillaCustard/85">Monthly community events and meetups in Fort Bend County and nearby areas.</p>
      </header>

      {/* Gallery Carousel */}
      {galleryItems.length > 0 && (
        <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
          <h2 className="text-xl font-extrabold text-vanillaCustard mb-6">Community Moments</h2>
          <div className="relative group">
            <div className="aspect-video overflow-hidden rounded-xl bg-graphite shadow-inner">
              <img
                src={galleryItems[currentImageIndex].filename.startsWith('http') ? galleryItems[currentImageIndex].filename : `/api/public/gallery/${galleryItems[currentImageIndex].filename}`}
                alt={galleryItems[currentImageIndex].caption || galleryItems[currentImageIndex].originalName}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            
            {/* Navigation buttons */}
            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard transition-all hover:bg-pitchBlack hover:scale-110 opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-pitchBlack/90 backdrop-blur-sm p-3 text-vanillaCustard transition-all hover:bg-pitchBlack hover:scale-110 opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Caption */}
            {galleryItems[currentImageIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pitchBlack via-pitchBlack/95 to-transparent p-6">
                <p className="text-base font-medium text-vanillaCustard drop-shadow-lg leading-relaxed">{galleryItems[currentImageIndex].caption}</p>
              </div>
            )}

            {/* Image indicators */}
            {galleryItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {galleryItems.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-paleAmber w-8' : 'bg-vanillaCustard/40 hover:bg-vanillaCustard/60'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <h2 className="text-2xl font-extrabold text-vanillaCustard">Upcoming Events</h2>

      <section className="grid gap-4" aria-label="Event listings">
        {loading ? (
          <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">Loading…</div>
        ) : error ? (
          <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">{error}</div>
        ) : !items.length ? (
          <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">No events yet.</div>
        ) : null}

        {items.map((e) => (
          <article key={e._id} className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-extrabold text-vanillaCustard">{e.name}</h3>
              <div className="text-base text-vanillaCustard/90">
                <span className="font-bold">Schedule:</span> {e.schedule}
              </div>
              <div className="text-base text-vanillaCustard/90">
                <span className="font-bold">Where:</span> {e.locationHint}
              </div>
              <div className="pt-2">
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-powderBlush px-4 py-2 text-base font-bold text-pitchBlack transition hover:brightness-95"
                >
                  View details
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 text-base text-vanillaCustard/90">
        <div className="text-lg font-extrabold text-vanillaCustard">Want to host something?</div>
        <div className="mt-2">Send us a message on Facebook or Instagram and we’ll help share it.</div>
      </section>
    </div>
  );
}
