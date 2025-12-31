import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type SeoConfig = {
  title: string;
  description: string;
  structuredData?: Record<string, any>;
};

const DEFAULT_TITLE = 'Fort Bend County LGBTQIA+ Community';
const DEFAULT_DESCRIPTION = 'Community-maintained LGBTQIA+ resources and events for Fort Bend County and nearby areas.';
const SITE_URL = 'https://ftbend-community-resources.netlify.app';

function getSeo(pathname: string): SeoConfig {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/resources?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
    };
  }

  if (path === '/resources') {
    return {
      title: `Resources | ${DEFAULT_TITLE}`,
      description: 'Search LGBTQIA+ resources by location, type, audience, and tags. Find support groups, healthcare providers, legal services, and more.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'LGBTQIA+ Resources',
        description: 'Search LGBTQIA+ resources by location, type, audience, and tags.',
        url: `${SITE_URL}/resources`
      }
    };
  }

  if (path === '/events') {
    return {
      title: `Events | ${DEFAULT_TITLE}`,
      description: 'Monthly community events and meetups in Fort Bend County and nearby areas. Join our inclusive LGBTQIA+ gatherings.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'EventSeries',
        name: 'Fort Bend LGBTQIA+ Community Events',
        description: 'Monthly community events and meetups in Fort Bend County and nearby areas.',
        url: `${SITE_URL}/events`
      }
    };
  }

  if (path === '/about') {
    return {
      title: `About | ${DEFAULT_TITLE}`,
      description: 'Learn about the Fort Bend County LGBTQIA+ Community Resources project and our mission to connect and support our community.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Fort Bend LGBTQIA+ Community Resources',
        description: 'About the Fort Bend County LGBTQIA+ Community Resources project.',
        url: `${SITE_URL}/about`
      }
    };
  }

  if (path === '/submit') {
    return {
      title: `Submit a Resource | ${DEFAULT_TITLE}`,
      description: 'Share LGBTQIA+ resources with our community. Submit organizations, services, events, and support groups for Fort Bend County.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Submit a Resource',
        description: 'Submit a resource for review so we can help the community find it.',
        url: `${SITE_URL}/submit`
      }
    };
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION
  };
}

function setMetaByName(name: string, content: string) {
  const el = document.querySelector(`meta[name="${name}"]`);
  if (el) el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string) {
  const el = document.querySelector(`meta[property="${property}"]`);
  if (el) el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setStructuredData(data: Record<string, any>) {
  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) existing.remove();

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export default function Seo() {
  const location = useLocation();

  useEffect(() => {
    const { title, description, structuredData } = getSeo(location.pathname);

    document.title = title;

    setMetaByName('description', description);

    setMetaByProperty('og:title', title);
    setMetaByProperty('og:description', description);
    setMetaByProperty('og:image', `${SITE_URL}/ftbend-lgbtqia-logo.jpg`);
    setMetaByProperty('og:image:alt', 'Fort Bend County LGBTQIA+ Community Logo');
    setMetaByProperty('og:image:width', '1200');
    setMetaByProperty('og:image:height', '630');

    setMetaByName('twitter:title', title);
    setMetaByName('twitter:description', description);
    setMetaByName('twitter:image', `${SITE_URL}/ftbend-lgbtqia-logo.jpg`);
    setMetaByName('twitter:image:alt', 'Fort Bend County LGBTQIA+ Community Logo');

    const url = window.location.href;
    setMetaByProperty('og:url', url);
    setCanonical(url);

    if (structuredData) {
      setStructuredData(structuredData);
    }
  }, [location.pathname]);

  return null;
}
