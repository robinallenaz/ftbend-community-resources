import { useState, useEffect } from 'react';
import ResourceExplorer from '../components/ResourceExplorer';
import LocationButton from '../components/LocationButton';
import LocationInfo from '../components/LocationInfo';
import type { Coordinates } from '../types';

// Feature flag - only enable when you have enough resources with exact coordinates
// This is hardcoded and not exposed to users for security
const ENABLE_LOCATION_FEATURES = false; // Change to true when ready

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
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  // Add structured data when component mounts
  useEffect(() => {
    addResourcesStructuredData();
  }, []);

  const handleLocationFound = (location: Coordinates) => {
    setUserLocation(location);
  };

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3">
            <h1 className="text-3xl font-extrabold text-vanillaCustard">LGBTQIA+ Resources</h1>
            <p className="text-base text-vanillaCustard/90">
              Search by what you need. Narrow results by location, type, and audience.
            </p>
            {ENABLE_LOCATION_FEATURES && userLocation && <LocationInfo />}
          </div>
          <div className="flex flex-col items-end gap-3">
            {ENABLE_LOCATION_FEATURES && <LocationButton onLocationFound={handleLocationFound} />}
          </div>
        </div>
      </header>

      <ResourceExplorer userLocation={ENABLE_LOCATION_FEATURES ? userLocation : null} />
    </div>
  );
}
