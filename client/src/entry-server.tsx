import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import Seo from './components/Seo';

export function render(url: string) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );

  return { html };
}

export function createDocument({ html }: { html: string }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0C0805" />
        
        <!-- SEO Meta Tags -->
        <meta name="description" content="Find LGBTQIA+ resources, healthcare providers, legal services, and community events in Fort Bend County, Texas." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fort Bend County LGBTQIA+ Community" />
        <meta property="og:title" content="Fort Bend County LGBTQIA+ Community Resources" />
        <meta property="og:description" content="Find LGBTQIA+ resources, healthcare providers, legal services, and community events in Fort Bend County, Texas." />
        <meta property="og:url" content="https://ftbend-community-resources.netlify.app" />
        <meta property="og:image" content="https://res.cloudinary.com/dpus8jzix/image/upload/q_auto,f_auto,w_1200/ftbend-lgbtqia-logo_erkzpu.jpg" />
        <meta property="og:image:alt" content="Fort Bend County LGBTQIA+ Community Logo" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fort Bend County LGBTQIA+ Community Resources" />
        <meta name="twitter:description" content="Find LGBTQIA+ resources, healthcare providers, legal services, and community events in Fort Bend County, Texas." />
        <meta name="twitter:image" content="https://res.cloudinary.com/dpus8jzix/image/upload/q_auto,f_auto,w_1200/ftbend-lgbtqia-logo_erkzpu.jpg" />
        <meta name="twitter:image:alt" content="Fort Bend County LGBTQIA+ Community Logo" />
        
        <!-- Structured Data -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://ftbend-community-resources.netlify.app/#website",
              "name": "Fort Bend County LGBTQIA+ Community Resources",
              "description": "Find LGBTQIA+ resources, healthcare providers, legal services, and community events in Fort Bend County, Texas.",
              "url": "https://ftbend-community-resources.netlify.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://ftbend-community-resources.netlify.app/resources?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@id": "https://ftbend-community-resources.netlify.app/#organization"
              }
            },
            {
              "@type": "Organization",
              "@id": "https://ftbend-community-resources.netlify.app/#organization",
              "name": "Fort Bend County LGBTQIA+ Community",
              "description": "A community-maintained directory of LGBTQIA+ resources, events, and support services for Fort Bend County and surrounding areas.",
              "url": "https://ftbend-community-resources.netlify.app",
              "areaServed": {
                "@type": "Place",
                "name": "Fort Bend County, Texas"
              }
            }
          ]
        }
        </script>
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="google-site-verification" content="Ewa93UDatdmLdwjSzVyE84GYllgP46klOg5z_hQhyEg" />
        
        <title>Fort Bend County LGBTQIA+ Community Resources | Support & Events</title>
        
        <style>
          /* Critical CSS for immediate rendering */
          body {
            margin: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background: #0C0805;
            color: #D1DA9C;
          }
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <div id="root">${html}</div>
        <div id="root-loading" class="loading">Loading...</div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
  `;
}
