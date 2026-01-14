 import { useEffect, useState } from 'react';

type EventItem = {
  _id: string;
  name: string;
  schedule: string;
  url: string;
  locationHint: string;
  instagramPost?: string;
  facebookEvent?: string;
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

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="grid gap-3">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">LGBTQIA+ Community Events</h1>
          <p className="text-base text-vanillaCustard/90">Monthly community events and meetups in Fort Bend County and nearby areas.</p>
        </div>
      </header>

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

              {(e.instagramPost || e.facebookEvent) && (
                <div className="flex gap-2 pt-2">
                  {e.instagramPost && (
                    <a
                      href={e.instagramPost}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-sm font-bold text-vanillaCustard transition hover:border-vanillaCustard/35"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.849.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069 3.204 0 3.584.012 4.849.069 3.26.149 4.771 1.699 4.919 4.92.058 1.265.07 1.645.07 4.849 0 3.204-.013 3.583-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.645.07-4.849.07zm-4.204 17.69h-.004c-1.074 0-1.528-.012-2.655-.07a3.726 3.726 0 01-1.733-.641 3.726 3.726 0 01-.641-1.733c-.058-1.127-.07-1.581-.07-2.655v-.004c0-1.074.012-1.528.07-2.655a3.726 3.726 0 01.641-1.733 3.726 3.726 0 011.733-.641c1.127-.058 1.581-.07 2.655-.07h.004c1.074 0 1.528.012 2.655.07a3.726 3.726 0 011.733.641 3.726 3.726 0 01.641 1.733c.058 1.127.07 1.581.07 2.655v.004c0 1.074-.012 1.528-.07 2.655a3.726 3.726 0 01-.641 1.733 3.726 3.726 0 01-1.733.641c-1.127.058-1.581.07-2.655.07zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                      </svg>
                      Instagram
                    </a>
                  )}
                  {e.facebookEvent && (
                    <a
                      href={e.facebookEvent}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-sm font-bold text-vanillaCustard transition hover:border-vanillaCustard/35"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook Event
                    </a>
                  )}
                </div>
              )}
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
