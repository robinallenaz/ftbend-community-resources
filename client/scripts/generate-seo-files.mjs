import fs from 'node:fs';
import path from 'node:path';

function normalizeBasePath(input) {
  const raw = (input || '/').trim();
  if (!raw || raw === '/') return '';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.replace(/\/+$/, '');
}

function joinPath(basePath, routePath) {
  const route = routePath === '/' ? '/' : routePath.replace(/^\/+/, '/');
  if (!basePath) return route;
  if (route === '/') return `${basePath}/`;
  return `${basePath}${route}`;
}

const publicDir = path.resolve(process.cwd(), 'public');
const distDir = path.resolve(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  throw new Error(`Dist directory not found: ${distDir} (did you run "vite build" first?)`);
}

const siteUrlRaw = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:5173';
const siteUrl = siteUrlRaw.replace(/\/+$/, '');
const basePath = normalizeBasePath(process.env.BASE_PATH);

// Static routes
const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/resources', changefreq: 'weekly', priority: '0.9' },
  { path: '/events', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/submit', changefreq: 'monthly', priority: '0.6' }
];

// Generate dynamic routes for resources and events
async function generateDynamicRoutes() {
  try {
    // Try to fetch data from the API
    const baseUrl = process.env.API_URL || 'https://ftbend-community-resources.onrender.com';
    
    const [resourcesRes, eventsRes] = await Promise.all([
      fetch(`${baseUrl}/api/public/resources`),
      fetch(`${baseUrl}/api/public/events`)
    ]);

    const dynamicRoutes = [];

    if (resourcesRes.ok) {
      const resourcesData = await resourcesRes.json();
      if (resourcesData.items) {
        resourcesData.items.forEach(resource => {
          dynamicRoutes.push({
            path: `/resources/${resource._id}`,
            changefreq: 'monthly',
            priority: '0.7'
          });
        });
      }
    }

    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      if (eventsData.items) {
        eventsData.items.forEach(event => {
          dynamicRoutes.push({
            path: `/events/${event._id}`,
            changefreq: 'weekly',
            priority: '0.7'
          });
        });
      }
    }

    return dynamicRoutes;
  } catch (error) {
    console.warn('Could not fetch dynamic routes for sitemap:', error.message);
    return [];
  }
}

const lastmod = new Date().toISOString().split('T')[0];

// Generate sitemap with both static and dynamic routes
async function generateSitemap() {
  const dynamicRoutes = await generateDynamicRoutes();
  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  const urls = allRoutes
    .map((r) => {
      const locPath = joinPath(basePath, r.path);
      const loc = `${siteUrl}${locPath}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');

  console.log(`Wrote ${sitemapPath} with ${allRoutes.length} URLs`);
}

// Generate robots.txt
function generateRobots() {
  const robotsSitemapUrl = `${siteUrl}${basePath}/sitemap.xml`;
  const robots = `User-agent: *\nAllow: /\n\n# Social media crawlers\nUser-agent: facebookexternalhit\nAllow: /\n\nUser-agent: Twitterbot\nAllow: /\n\nUser-agent: LinkedInBot\nAllow: /\n\nSitemap: ${robotsSitemapUrl}\n`;
  const robotsPath = path.join(distDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robots, 'utf8');

  console.log(`Wrote ${robotsPath}`);
}

// Generate .txt file for easy sharing
function generateShareText() {
  const shareText = `Fort Bend County LGBTQIA+ Community Resources

Find local LGBTQIA+ resources, events, and support in Fort Bend County and surrounding areas.

🌐 Website: ${siteUrl}
📚 Resources: ${siteUrl}/resources
📅 Events: ${siteUrl}/events
📝 Submit resources: ${siteUrl}/submit

#LGBTQIA #FortBend #Texas #CommunityResources`;
  
  const sharePath = path.join(distDir, 'share.txt');
  fs.writeFileSync(sharePath, shareText, 'utf8');
  console.log(`Wrote ${sharePath}`);
}

// Run all generators
async function main() {
  await generateSitemap();
  generateRobots();
  generateShareText();
}

main().catch(console.error);
