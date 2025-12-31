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
  throw new Error(`Dist directory not found: ${distDir} (did you run \"vite build\" first?)`);
}

const siteUrlRaw = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:5173';
const siteUrl = siteUrlRaw.replace(/\/+$/, '');
const basePath = normalizeBasePath(process.env.BASE_PATH);

const routes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/resources', changefreq: 'weekly', priority: '0.9' },
  { path: '/events', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/submit', changefreq: 'monthly', priority: '0.6' }
];

const lastmod = new Date().toISOString().split('T')[0];
const urls = routes
  .map((r) => {
    const locPath = joinPath(basePath, r.path);
    const loc = `${siteUrl}${locPath}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`;
  })
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
const sitemapPath = path.join(distDir, 'sitemap.xml');
fs.writeFileSync(sitemapPath, sitemap, 'utf8');

const robotsSitemapUrl = `${siteUrl}${basePath}/sitemap.xml`;
const robots = `User-agent: *\nAllow: /\nSitemap: ${robotsSitemapUrl}\n`;
const robotsPath = path.join(distDir, 'robots.txt');
fs.writeFileSync(robotsPath, robots, 'utf8');

console.log(`Wrote ${sitemapPath}`);
console.log(`Wrote ${robotsPath}`);
