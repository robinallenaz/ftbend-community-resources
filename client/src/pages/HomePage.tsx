import { Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const ResourceExplorer = lazy(() => import('../components/ResourceExplorer'));

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://ftbend-lgbtqia-community.org/#website",
        "name": "Fort Bend County LGBTQIA+ Community Resources",
        "description": "Find healthcare providers, legal services, support groups, and inclusive events in Fort Bend County, Texas and surrounding areas.",
        "url": "https://ftbend-lgbtqia-community.org",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://ftbend-lgbtqia-community.org/resources?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "publisher": {
          "@id": "https://ftbend-lgbtqia-community.org/#organization"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://ftbend-lgbtqia-community.org/#organization",
        "name": "Fort Bend County LGBTQIA+ Community Resources",
        "url": "https://ftbend-lgbtqia-community.org",
        "logo": {
          "@type": "ImageObject",
          "url": "https://res.cloudinary.com/dpus8jzix/image/upload/v1769212019/ftbend-lgbtqia-logo_erkzpu.jpg",
          "width": 1200,
          "height": 630
        },
        "description": "Community-maintained LGBTQIA+ resources and events for Fort Bend County and nearby areas.",
        "sameAs": [
          "https://instagram.com/ftbend_lgbtqia",
          "https://www.facebook.com/share/16a6rc4XjY/?mibextid=wwXIfr"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "community support",
          "availableLanguage": "English",
          "email": "ryancreates94@gmail.com"
        },
        "areaServed": {
          "@type": "Place",
          "name": "Fort Bend County, Texas and surrounding areas",
          "address": {
            "@type": "PostalAddress",
            "addressRegion": "TX",
            "addressLocality": "Fort Bend County"
          }
        }
      },
      {
        "@type": "EventSeries",
        "@id": "https://ftbend-lgbtqia-community.org/#events",
        "name": "Fort Bend LGBTQIA+ Community Events",
        "description": "Monthly community meetups and support groups for LGBTQIA+ individuals in Fort Bend County",
        "url": "https://ftbend-lgbtqia-community.org/events",
        "startDate": "2024-01-01",
        "endDate": "2025-12-31",
        "location": {
          "@type": "Place",
          "name": "Fort Bend County, Texas",
          "address": {
            "@type": "PostalAddress",
            "addressRegion": "TX",
            "addressLocality": "Fort Bend County"
          }
        },
        "organizer": {
          "@id": "https://ftbend-lgbtqia-community.org/#organization"
        }
      }
    ]
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="grid gap-10">
      <section
        className="relative overflow-hidden rounded-2xl border border-vanillaCustard/15 bg-pitchBlack shadow-soft"
        aria-label="Welcome"
      >
        <div className="absolute inset-0 opacity-25">
          <picture>
            <source type="image/webp" srcSet="https://res.cloudinary.com/dpus8jzix/image/upload/v1769209299/pride-flag-banner_b1zdiz.webp" />
            <img 
              src="https://res.cloudinary.com/dpus8jzix/image/upload/v1769209208/pride-flag-banner_r7z55k.jpg" 
              srcSet="https://res.cloudinary.com/dpus8jzix/image/upload/v1769209208/pride-flag-banner_r7z55k.jpg&w=400 400w, https://res.cloudinary.com/dpus8jzix/image/upload/v1769209208/pride-flag-banner_r7z55k.jpg&w=800 800w, https://res.cloudinary.com/dpus8jzix/image/upload/v1769209208/pride-flag-banner_r7z55k.jpg&w=1200 1200w"
              sizes="100vw"
              alt="Pride flag banner with rainbow colors representing LGBTQIA+ community" 
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          </picture>
        </div>
        <div className="relative grid gap-5 p-6 md:p-10">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
            <picture>
              <source type="image/webp" srcSet="https://res.cloudinary.com/dpus8jzix/image/upload/v1769212033/ftbend-lgbtqia-logo_y4sgtp.webp" />
              <img 
                src="https://res.cloudinary.com/dpus8jzix/image/upload/v1769212019/ftbend-lgbtqia-logo_erkzpu.jpg"
                srcSet="https://res.cloudinary.com/dpus8jzix/image/upload/v1769212019/ftbend-lgbtqia-logo_erkzpu.jpg&w=64 64w, https://res.cloudinary.com/dpus8jzix/image/upload/v1769212019/ftbend-lgbtqia-logo_erkzpu.jpg&w=128 128w"
                sizes="(max-width: 768px) 64px, 128px"
                alt="Fort Bend County LGBTQIA+ Community logo"
                className="h-16 w-16 rounded-2xl object-cover"
              />
            </picture>
            <div>
              <h1 className="text-3xl font-extrabold text-vanillaCustard md:text-4xl">
                Fort Bend County LGBTQIA+ Community Resources
              </h1>
              <p className="mt-2 text-lg text-vanillaCustard/90">
                There is no community without unity 🏳️‍⚧️🏳️‍🌈
              </p>
              <p className="mt-2 text-base text-vanillaCustard/85">
                Find healthcare providers, legal services, support groups, and inclusive events in Fort Bend County, Texas and surrounding areas.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
            <Link
              to="/resources"
              className="rounded-xl bg-powderBlush px-6 py-4 text-lg font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              Browse LGBTQIA+ Resources
            </Link>
            <Link
              to="/events"
              className="rounded-xl bg-paleAmber px-6 py-4 text-lg font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              View Community Events
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6" aria-label="Resource search">
        <Suspense fallback={<div className="text-vanillaCustard/60">Loading resource search...</div>}>
          <ResourceExplorer />
        </Suspense>
      </section>

      <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
        <h2 className="text-2xl font-extrabold text-vanillaCustard mb-4">Community Events & Meetups</h2>
        <p className="text-base text-vanillaCustard/90 mb-4">
          Join inclusive LGBTQIA+ community events, support group meetings, and social gatherings in Fort Bend County and nearby areas.
        </p>
        <Link to="/events" className="inline-flex rounded-xl bg-paleAmber px-6 py-4 text-lg font-bold text-pitchBlack shadow-soft transition hover:brightness-95 min-h-[48px] min-w-[48px] items-center justify-center">
          View Upcoming Events
        </Link>
      </section>
    </div>
    </>
  );
}
