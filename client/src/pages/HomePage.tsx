import { Link } from 'react-router-dom';
import ResourceExplorer from '../components/ResourceExplorer';

export default function HomePage() {
  return (
    <div className="grid gap-10">
      <section
        className="relative overflow-hidden rounded-2xl border border-vanillaCustard/15 bg-pitchBlack shadow-soft"
        aria-label="Welcome"
      >
        <div className="absolute inset-0 opacity-25">
          <img src="/pride-flag-banner.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative grid gap-5 p-6 md:p-10">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
            <img
              src="/ftbend-lgbtqia-logo.jpg"
              alt="Fort Bend County LGBTQIA+ Community logo"
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div>
              <h1 className="text-3xl font-extrabold text-vanillaCustard md:text-4xl">
                Fort Bend County LGBTQIA+ Community Resources
              </h1>
              <p className="mt-2 text-lg text-vanillaCustard/90">
                There is no community without unity 🏳️‍⚧️🏳️‍🌈
              </p>
              <p className="mt-2 text-base text-vanillaCustard/85">
                Find healthcare providers, legal services, support groups, and inclusive events in Fort Bend County, Texas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/resources"
              className="rounded-xl bg-powderBlush px-4 py-3 text-lg font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95"
            >
              Browse LGBTQIA+ Resources
            </Link>
            <Link
              to="/events"
              className="rounded-xl bg-paleAmber px-4 py-3 text-lg font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95"
            >
              View Community Events
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6" aria-label="Resource search">
        <ResourceExplorer />
      </section>

      <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
        <h2 className="text-2xl font-extrabold text-vanillaCustard mb-4">Community Events & Meetups</h2>
        <p className="text-base text-vanillaCustard/90 mb-4">
          Join inclusive LGBTQIA+ community events, support group meetings, and social gatherings in Fort Bend County and nearby areas.
        </p>
        <Link to="/events" className="inline-flex rounded-xl bg-paleAmber px-4 py-2 text-base font-bold text-pitchBlack transition hover:brightness-95">
          View Upcoming Events
        </Link>
      </section>
    </div>
  );
}
