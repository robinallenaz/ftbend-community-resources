 import { useEffect, useState } from 'react';
 
 type EventItem = {
   _id: string;
   name: string;
   schedule: string;
   url: string;
   locationHint: string;
 };

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">Events</h1>
        <p className="text-base text-vanillaCustard/85">Monthly community events and meetups.</p>
      </header>

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
              <h2 className="text-2xl font-extrabold text-vanillaCustard">{e.name}</h2>
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
