 import { useEffect, useState } from 'react';

type EventItem = {
  _id: string;
  name: string;
  schedule: string;
  url: string;
  locationHint: string;
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
