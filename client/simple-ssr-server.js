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

// Create SEO-friendly HTML with semantic structure and real content
function createSSRHTML(url) {
  const isHomePage = url === '/' || url === '';
  const isResourcesPage = url.startsWith('/resources');
  const isEventsPage = url.startsWith('/events');
  const isAboutPage = url.startsWith('/about');
  const isSubmitPage = url.startsWith('/submit');

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Fort Bend County LGBTQIA+ Community Resources",
    "url": "https://ftbend-lgbtqia-community.org",
    "logo": "https://ftbend-lgbtqia-community.org/ftbend-lgbtqia-logo.jpg",
    "description": "Community-maintained LGBTQIA+ resources and events for Fort Bend County and nearby areas.",
    "sameAs": [
      "https://instagram.com/ftbend_lgbtqia",
      "https://www.facebook.com/share/16a6rc4XjY/?mibextid=wwXIfr"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "community support",
      "availableLanguage": "English"
    }
  };

  let title = 'Fort Bend County LGBTQIA+ Community Resources | Support & Events';
  let h1Content = 'Fort Bend County LGBTQIA+ Community Resources';
  let description = 'Find healthcare providers, legal services, support groups, and inclusive events in Fort Bend County, Texas.';
  let structuredContent = '';

  if (isResourcesPage) {
    title = 'LGBTQIA+ Resources Fort Bend County | Healthcare, Legal & Support';
    h1Content = 'LGBTQIA+ Resources';
    description = 'Search LGBTQIA+ resources in Fort Bend County and Texas. Find healthcare providers, legal services, support groups, and community organizations.';
    structuredContent = `
      <section>
        <p>Search by what you need. Narrow results by location, type, and audience.</p>
        <div style="margin: 2rem 0;">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Featured Resources</h2>
          <div style="display: grid; gap: 1rem;">
            <article style="background: #343130; border: 1px solid rgba(209, 218, 156, 0.15); border-radius: 20px; padding: 1.5rem;">
              <h3 style="color: #D1DA9C; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">The Montrose Center</h3>
              <p style="color: rgba(209, 218, 156, 0.9); margin-bottom: 1rem;">Houston's LGBTQ+ community center offering programs, services, and activities for the community.</p>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                <span style="background: #D2DC76; color: #0C0805; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">Houston</span>
                <span style="background: #F7A3A1; color: #0C0805; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">Community</span>
                <span style="background: #87CEEB; color: #0C0805; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">All</span>
              </div>
              <a href="https://www.montrosecenter.org" target="_blank" style="background: #F7A3A1; color: #0C0805; padding: 0.5rem 1rem; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Visit</a>
            </article>
            <article style="background: #343130; border: 1px solid rgba(209, 218, 156, 0.15); border-radius: 20px; padding: 1.5rem;">
              <h3 style="color: #D1DA9C; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">HATCH Youth</h3>
              <p style="color: rgba(209, 218, 156, 0.9); margin-bottom: 1rem;">Houston's LGBTQ+ youth organization providing safe spaces and support for young people.</p>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                <span style="background: #D2DC76; color: #0C0805; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">Houston</span>
                <span style="background: #F7A3A1; color: #0C0805; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">Youth</span>
                <span style="background: #98FF98; color: #0C0805; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">Support</span>
              </div>
              <a href="https://hatchyouth.org" target="_blank" style="background: #F7A3A1; color: #0C0805; padding: 0.5rem 1rem; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Visit</a>
            </article>
          </div>
        </div>
      </section>
    `;
  } else if (isEventsPage) {
    title = 'LGBTQIA+ Events Fort Bend County | Community Meetups & Gatherings';
    h1Content = 'LGBTQIA+ Community Events';
    description = 'Join LGBTQIA+ community events and meetups in Fort Bend County, Texas. Monthly inclusive gatherings and support group meetings.';
    structuredContent = `
      <section>
        <p>Monthly community events and meetups.</p>
        <div style="margin: 2rem 0;">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Upcoming Events</h2>
          <div style="display: grid; gap: 1rem;">
            <article style="background: #343130; border: 1px solid rgba(209, 218, 156, 0.15); border-radius: 20px; padding: 1.5rem;">
              <h3 style="color: #D1DA9C; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Monthly Community Meetup</h3>
              <div style="color: rgba(209, 218, 156, 0.9); margin-bottom: 0.5rem;">
                <strong>Schedule:</strong> First Thursday of each month, 6:30 PM - 8:30 PM
              </div>
              <div style="color: rgba(209, 218, 156, 0.9); margin-bottom: 1rem;">
                <strong>Where:</strong> Sugar Land Town Square, Sugar Land, TX
              </div>
              <a href="#" style="background: #F7A3A1; color: #0C0805; padding: 0.5rem 1rem; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">View details</a>
            </article>
            <article style="background: #343130; border: 1px solid rgba(209, 218, 156, 0.15); border-radius: 20px; padding: 1.5rem;">
              <h3 style="color: #D1DA9C; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Trans Support Group</h3>
              <div style="color: rgba(209, 218, 156, 0.9); margin-bottom: 0.5rem;">
                <strong>Schedule:</strong> Second Wednesday of each month, 7:00 PM - 9:00 PM
              </div>
              <div style="color: rgba(209, 218, 156, 0.9); margin-bottom: 1rem;">
                <strong>Where:</strong> Virtual via Zoom
              </div>
              <a href="#" style="background: #F7A3A1; color: #0C0805; padding: 0.5rem 1rem; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">View details</a>
            </article>
          </div>
        </div>
      </section>
    `;
  } else if (isAboutPage) {
    title = 'About | Fort Bend County LGBTQIA+ Community Resources';
    h1Content = 'About Fort Bend LGBTQIA+ Community Resources';
    description = 'Learn about the Fort Bend County LGBTQIA+ Community Resources project and our mission to connect and support our community.';
    structuredContent = `
      <section>
        <p>A community-first resource hub for LGBTQIA+ folks in and around Fort Bend County, Texas.</p>
        <div style="margin: 2rem 0;">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Our Mission</h2>
          <p style="margin-bottom: 2rem;">This site exists to make LGBTQIA+ resources easier to find—especially when you're tired, stressed, or just need a clear answer. We connect community members with healthcare providers, legal services, support groups, and inclusive events throughout Fort Bend County and across Texas.</p>
          
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">What You'll Find</h2>
          <ul style="color: rgba(209, 218, 156, 0.9); line-height: 1.8;">
            <li><a href="/resources" style="color: #D2DC76;">LGBTQIA+ Resources</a> - Healthcare providers, legal services, and support organizations</li>
            <li><a href="/events" style="color: #D2DC76;">Community Events</a> - Monthly meetups and inclusive gatherings</li>
            <li><a href="/submit" style="color: #D2DC76;">Resource Submissions</a> - Share helpful services with our community</li>
          </ul>
        </div>
      </section>
    `;
  } else if (isSubmitPage) {
    title = 'Submit a Resource | Fort Bend County LGBTQIA+ Community';
    h1Content = 'Submit a Resource';
    description = 'Share LGBTQIA+ resources with our community. Submit organizations, services, events, and support groups for Fort Bend County.';
    structuredContent = `
      <section>
        <p>Know a resource that should be listed here? Share it with our community!</p>
        <div style="margin: 2rem 0;">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">What We're Looking For</h2>
          <ul style="color: rgba(209, 218, 156, 0.9); line-height: 1.8;">
            <li>Healthcare providers and mental health services</li>
            <li>Legal aid and advocacy organizations</li>
            <li>Support groups and community centers</li>
            <li>Social events and meetups</li>
            <li>Educational resources and workshops</li>
          </ul>
        </div>
      </section>
    `;
  } else {
    structuredContent = `
      <section style="margin-bottom: 2rem;">
        <p>Find healthcare providers, legal services, support groups, and inclusive events in Fort Bend County, Texas.</p>
      </section>
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Quick Links</h2>
        <nav style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <a href="/resources" style="color: #D2DC76; text-decoration: none; font-weight: 600;">
            🏥 LGBTQIA+ Resources
          </a>
          <a href="/events" style="color: #D2DC76; text-decoration: none; font-weight: 600;">
            📅 Community Events
          </a>
          <a href="/about" style="color: #D2DC76; text-decoration: none; font-weight: 600;">
            ℹ️ About Us
          </a>
          <a href="/submit" style="color: #D2DC76; text-decoration: none; font-weight: 600;">
            ➕ Submit a Resource
          </a>
        </nav>
      </section>
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Featured Resources</h2>
        <div style="display: grid; gap: 1rem;">
          <article style="background: #343130; border: 1px solid rgba(209, 218, 156, 0.15); border-radius: 20px; padding: 1.5rem;">
            <h3 style="color: #D1DA9C; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">The Montrose Center</h3>
            <p style="color: rgba(209, 218, 156, 0.9); margin-bottom: 1rem;">Houston's LGBTQ+ community center offering programs, services, and activities.</p>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
              <span style="background: #D2DC76; color: #0C0805; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">Houston</span>
              <span style="background: #F7A3A1; color: #0C0805; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">Community</span>
            </div>
            <a href="/resources" style="background: #F7A3A1; color: #0C0805; padding: 0.5rem 1rem; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Browse Resources</a>
          </article>
        </div>
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
              "name": "Fort Bend County LGBTQIA+ Community Resources",
              "description": "Community-maintained LGBTQIA+ resources and events for Fort Bend County and nearby areas.",
              "url": "https://ftbend-community-resources.netlify.app",
              "logo": "https://ftbend-community-resources.netlify.app/ftbend-lgbtqia-logo.jpg",
              "sameAs": [
                "https://instagram.com/ftbend_lgbtqia",
                "https://www.facebook.com/share/16a6rc4XjY/?mibextid=wwXIfr"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "community support",
                "availableLanguage": "English"
              },
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
          /* Clean, semantic CSS matching your site */
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background: #0C0805;
            color: #D1DA9C;
            line-height: 1.6;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
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
          h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #D1DA9C;
          }
          p {
            margin-bottom: 1rem;
            color: rgba(209, 218, 156, 0.85);
          }
          a {
            color: #D2DC76;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s;
          }
          a:hover {
            color: #F7A3A1;
          }
          article {
            background: #343130;
            border: 1px solid rgba(209, 218, 156, 0.15);
            border-radius: 20px;
            padding: 1.5rem;
            box-shadow: 0 10px 35px rgba(0,0,0,0.35);
          }
          .tag {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            margin: 0.25rem;
          }
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-size: 1.2rem;
            color: rgba(209, 218, 156, 0.7);
          }
          @media (min-width: 768px) {
            .container {
              padding: 3rem;
            }
            h1 {
              font-size: 2.5rem;
            }
          }
        </style>
      </head>
      <body>
        <div id="root">
          <div class="container">
            <header>
              <h1>${h1Content}</h1>
              <p>${description}</p>
            </header>
            <main>
              ${structuredContent}
            </main>
            <footer style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(209, 218, 156, 0.15);">
              <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Quick Links</h3>
                <nav style="display: grid; gap: 0.5rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                  <a href="/resources">LGBTQIA+ Resources</a>
                  <a href="/events">Community Events</a>
                  <a href="/about">About Us</a>
                  <a href="/submit">Submit a Resource</a>
                </nav>
              </div>
              <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #D1DA9C;">Connect With Us</h3>
                <nav style="display: grid; gap: 0.5rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                  <a href="https://instagram.com/ftbend_lgbtqia" target="_blank" style="color: #D2DC76;">Instagram</a>
                  <a href="https://www.facebook.com/share/16a6rc4XjY/?mibextid=wwXIfr" target="_blank" style="color: #D2DC76;">Facebook</a>
                </nav>
              </div>
              <div style="font-size: 0.875rem; color: rgba(209, 218, 156, 0.7);">
                <p>If you need support right now, call The LGBT National Hotline: (888) 843-4564 or Trans Lifeline: (877) 565-8860.</p>
              </div>
            </footer>
          </div>
          <div class="loading">Loading interactive content...</div>
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
