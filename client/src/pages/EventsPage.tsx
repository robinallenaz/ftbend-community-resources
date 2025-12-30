import { events } from '../data/events';

export default function EventsPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">Events</h1>
        <p className="text-base text-vanillaCustard/85">Monthly community events and meetups.</p>
      </header>

      <section className="grid gap-4" aria-label="Event listings">
        {events.map((e) => (
          <article key={e.id} className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-5 shadow-soft">
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
