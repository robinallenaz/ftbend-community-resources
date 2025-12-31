import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;

// Serve static files
app.use('/assets', express.static(path.resolve(__dirname, 'dist/assets')));
app.use('/favicon.ico', express.static(path.resolve(__dirname, 'dist/favicon.ico')));
app.use('/favicon-16x16.png', express.static(path.resolve(__dirname, 'dist/favicon-16x16.png')));
app.use('/favicon-32x32.png', express.static(path.resolve(__dirname, 'dist/favicon-32x32.png')));
app.use('/apple-touch-icon.png', express.static(path.resolve(__dirname, 'dist/apple-touch-icon.png')));
app.use('/site.webmanifest', express.static(path.resolve(__dirname, 'dist/site.webmanifest')));
app.use('/ftbend-lgbtqia-logo.jpg', express.static(path.resolve(__dirname, 'dist/ftbend-lgbtqia-logo.jpg')));
app.use('/pride-flag-banner.jpg', express.static(path.resolve(__dirname, 'dist/pride-flag-banner.jpg')));

// API proxy
import { createProxyMiddleware } from 'http-proxy-middleware';
app.use('/api', createProxyMiddleware({
  target: 'https://ftbend-community-resources-api.onrender.com',
  changeOrigin: true
}));

// Create SEO-friendly HTML with proper H1/H2 structure
function createSSRHTML(url) {
  const isHomePage = url === '/' || url === '';
  const isResourcesPage = url.startsWith('/resources');
  const isEventsPage = url.startsWith('/events');
  const isAboutPage = url.startsWith('/about');
  const isSubmitPage = url.startsWith('/submit');

  let title = 'Fort Bend County LGBTQIA+ Community Resources | Support & Events';
  let h1Content = 'Fort Bend County LGBTQIA+ Community Resources';
  let description = 'Find LGBTQIA+ resources, healthcare providers, legal services, and community events in Fort Bend County, Texas.';
  let additionalContent = '';

  if (isResourcesPage) {
    title = 'LGBTQIA+ Resources Fort Bend County | Healthcare, Legal & Support';
    h1Content = 'LGBTQIA+ Resources';
    description = 'Search LGBTQIA+ resources in Fort Bend County and Texas. Find healthcare providers, legal services, support groups, and community organizations.';
  } else if (isEventsPage) {
    title = 'LGBTQIA+ Events Fort Bend County | Community Meetups & Gatherings';
    h1Content = 'LGBTQIA+ Community Events';
    description = 'Join LGBTQIA+ community events and meetups in Fort Bend County, Texas. Monthly inclusive gatherings and support group meetings.';
  } else if (isAboutPage) {
    title = 'About | Fort Bend County LGBTQIA+ Community Resources';
    h1Content = 'About Fort Bend LGBTQIA+ Community Resources';
    description = 'Learn about the Fort Bend County LGBTQIA+ Community Resources project and our mission to connect and support our community.';
  } else if (isSubmitPage) {
    title = 'Submit a Resource | Fort Bend County LGBTQIA+ Community';
    h1Content = 'Submit a Resource';
    description = 'Share LGBTQIA+ resources with our community. Submit organizations, services, events, and support groups for Fort Bend County.';
  }

  if (isHomePage) {
    additionalContent = `
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Search LGBTQIA+ Resources & Support Services</h2>
        <p style="margin-bottom: 1rem; color: rgba(209, 218, 156, 0.85);">Find affirming healthcare providers, legal aid, mental health services, and community organizations in Fort Bend County and across Texas.</p>
      </section>
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Healthcare & Medical Services</h2>
        <p style="margin-bottom: 1rem; color: rgba(209, 218, 156, 0.9);">Connect with LGBTQIA+ affirming healthcare providers offering hormone therapy, mental health services, and specialized medical care.</p>
      </section>
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Legal Support & Advocacy</h2>
        <p style="margin-bottom: 1rem; color: rgba(209, 218, 156, 0.9);">Access legal assistance for name changes, discrimination cases, housing rights, and other LGBTQIA+ legal services in Texas.</p>
      </section>
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Community Events & Meetups</h2>
        <p style="margin-bottom: 1rem; color: rgba(209, 218, 156, 0.9);">Join inclusive LGBTQIA+ community events, support group meetings, and social gatherings in Fort Bend County and nearby areas.</p>
      </section>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0C0805" />
        
        <!-- SEO Meta Tags -->
        <meta name="description" content="${description}" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fort Bend County LGBTQIA+ Community" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:url" content="https://ftbend-community-resources.netlify.app${url}" />
        <meta property="og:image" content="https://ftbend-community-resources.netlify.app/ftbend-lgbtqia-logo.jpg" />
        <meta property="og:image:alt" content="Fort Bend County LGBTQIA+ Community Logo" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="https://ftbend-community-resources.netlify.app/ftbend-lgbtqia-logo.jpg" />
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
        
        <title>${title}</title>
        
        <style>
          /* Critical CSS matching your site */
          body {
            margin: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background: #0C0805;
            color: #D1DA9C;
            line-height: 1.6;
          }
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-size: 1.2rem;
          }
          main {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 1rem;
            color: #D1DA9C;
          }
          h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #D1DA9C;
          }
          p {
            margin-bottom: 1rem;
            color: rgba(209, 218, 156, 0.85);
          }
          a {
            color: #D2DC76;
            text-decoration: underline;
          }
          a:hover {
            color: #F7A3A1;
          }
        </style>
      </head>
      <body>
        <div id="root">
          <main>
            <h1>${h1Content}</h1>
            <p>${description}</p>
            ${additionalContent}
            <nav style="margin-bottom: 2rem;">
              <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Quick Links</h2>
              <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 0.5rem;"><a href="/resources">LGBTQIA+ Resources</a></li>
                <li style="margin-bottom: 0.5rem;"><a href="/events">Community Events</a></li>
                <li style="margin-bottom: 0.5rem;"><a href="/about">About Us</a></li>
                <li style="margin-bottom: 0.5rem;"><a href="/submit">Submit a Resource</a></li>
              </ul>
            </nav>
            <div class="loading">Loading interactive content...</div>
          </main>
        </div>
        <script type="module" src="/assets/main-DcgP-_0v.js"></script>
        <script type="module" src="/assets/server-DDjbh460.js"></script>
      </body>
    </html>
  `;
}

// SSR for all routes
app.use((req, res, next) => {
  // Skip static assets and API routes
  if (req.path.startsWith('/assets') || req.path.startsWith('/favicon') || req.path.startsWith('/api')) {
    return next();
  }
  
  try {
    console.log(`SSR rendering: ${req.url}`);
    const html = createSSRHTML(req.url);
    res.send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`🚀 SSR server running on http://localhost:${port}`);
  console.log('✅ Perfect SEO with H1/H2 tags!');
  console.log('🔍 Visit http://localhost:3001 to see SSR in action!');
});
