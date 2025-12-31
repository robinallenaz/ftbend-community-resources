import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type SeoConfig = {
  title: string;
  description: string;
};

const DEFAULT_TITLE = 'Fort Bend County LGBTQIA+ Community';
const DEFAULT_DESCRIPTION = 'Community-maintained LGBTQIA+ resources and events for Fort Bend County and nearby areas.';

function getSeo(pathname: string): SeoConfig {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION
    };
  }

  if (path === '/resources') {
    return {
      title: `Resources | ${DEFAULT_TITLE}`,
      description: 'Search LGBTQIA+ resources by location, type, audience, and tags.'
    };
  }

  if (path === '/events') {
    return {
      title: `Events | ${DEFAULT_TITLE}`,
      description: 'Monthly community events and meetups in Fort Bend County and nearby areas.'
    };
  }

  if (path === '/about') {
    return {
      title: `About | ${DEFAULT_TITLE}`,
      description: 'About the Fort Bend County LGBTQIA+ Community Resources project.'
    };
  }

  if (path === '/submit') {
    return {
      title: `Submit a Resource | ${DEFAULT_TITLE}`,
      description: 'Submit a resource for review so we can help the community find it.'
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

export default function Seo() {
  const location = useLocation();

  useEffect(() => {
    const { title, description } = getSeo(location.pathname);

    document.title = title;

    setMetaByName('description', description);

    setMetaByProperty('og:title', title);
    setMetaByProperty('og:description', description);

    setMetaByName('twitter:title', title);
    setMetaByName('twitter:description', description);

    const url = window.location.href;
    setMetaByProperty('og:url', url);
    setCanonical(url);
  }, [location.pathname]);

  return null;
}
