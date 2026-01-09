import fs from 'fs';
import path from 'path';

// Page configuration with their content sources
const pageConfig = [
  {
    url: 'https://ftbend-lgbtqia-community.org/',
    source: 'src/pages/HomePage.tsx',
    changefreq: 'daily'
  },
  {
    url: 'https://ftbend-lgbtqia-community.org/resources/',
    source: 'src/pages/ResourcesPage.tsx',
    changefreq: 'weekly'
  },
  {
    url: 'https://ftbend-lgbtqia-community.org/events/',
    source: 'src/pages/EventsPage.tsx',
    changefreq: 'weekly'
  },
  {
    url: 'https://ftbend-lgbtqia-community.org/about/',
    source: 'src/pages/AboutPage.tsx',
    changefreq: 'monthly'
  },
  {
    url: 'https://ftbend-lgbtqia-community.org/submit/',
    source: 'src/pages/SubmitPage.tsx',
    changefreq: 'monthly'
  }
];

// Get file modification time
function getFileModTime(filePath: string): Date {
  try {
    const fullPath = path.resolve(filePath);
    const stats = fs.statSync(fullPath);
    return stats.mtime;
  } catch (error) {
    console.warn(`Could not get mod time for ${filePath}:`, error);
    return new Date(); // Fallback to current time
  }
}

// Get latest modification from multiple sources
function getLatestModTime(sources: string[]): Date {
  const dates = sources.map(source => getFileModTime(source));
  return new Date(Math.max(...dates.map(d => d.getTime())));
}

// Format date for sitemap (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Generate sitemap XML
function generateSitemap(): string {
  const urls = pageConfig.map(page => {
    const lastmod = formatDate(getFileModTime(page.source));
    
    return `  <url>
    <loc>${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// Write sitemap to public directory
function writeSitemap(): void {
  const sitemap = generateSitemap();
  const outputPath = path.resolve('public/sitemap.xml');
  
  try {
    fs.writeFileSync(outputPath, sitemap, 'utf8');
    console.log('✅ Sitemap generated successfully:', outputPath);
    console.log('📅 Lastmod dates updated based on file modification times');
  } catch (error) {
    console.error('❌ Error writing sitemap:', error);
  }
}

// Export for use in build scripts
export { generateSitemap, writeSitemap };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  writeSitemap();
}
