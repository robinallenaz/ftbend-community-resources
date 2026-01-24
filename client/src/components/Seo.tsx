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
      title: `Fort Bend County LGBTQIA+ Community Resources | Support & Events`,
      description: 'Find LGBTQIA+ resources, healthcare providers, legal services, and community events in Fort Bend County, Texas. Connect with support groups and inclusive organizations.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Fort Bend County LGBTQIA+ Community Resources',
        description: 'LGBTQIA+ resources, healthcare, legal services, and community events in Fort Bend County, Texas',
        url: SITE_URL
      }
    };
  }

  if (path === '/resources') {
    return {
      title: `LGBTQIA+ Resources Fort Bend County | Healthcare, Legal & Support`,
      description: 'Search LGBTQIA+ resources in Fort Bend County and Texas. Find healthcare providers, legal services, support groups, and community organizations.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'LGBTQIA+ Resources Fort Bend County',
        description: 'Search LGBTQIA+ resources by location, type, audience, and tags in Fort Bend County, Texas.',
        url: `${SITE_URL}/resources`
      }
    };
  }

  if (path === '/events') {
    return {
      title: `LGBTQIA+ Events Fort Bend County | Community Meetups & Gatherings`,
      description: 'Join LGBTQIA+ community events and meetups in Fort Bend County, Texas. Monthly inclusive gatherings and support group meetings.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'EventSeries',
        name: 'Fort Bend LGBTQIA+ Community Events',
        description: 'Monthly LGBTQIA+ community events and meetups in Fort Bend County, Texas.',
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
    setMetaByProperty('og:image', 'https://res.cloudinary.com/dpus8jzix/image/upload/v1769212019/ftbend-lgbtqia-logo_erkzpu.jpg');
    setMetaByProperty('og:image:alt', 'Fort Bend County LGBTQIA+ Community Logo');
    setMetaByProperty('og:image:width', '1200');
    setMetaByProperty('og:image:height', '630');

    setMetaByName('twitter:title', title);
    setMetaByName('twitter:description', description);
    setMetaByName('twitter:image', 'https://res.cloudinary.com/dpus8jzix/image/upload/v1769212019/ftbend-lgbtqia-logo_erkzpu.jpg');
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
