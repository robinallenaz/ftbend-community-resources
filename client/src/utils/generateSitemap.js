import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
function getFileModTime(filePath) {
  try {
    const fullPath = path.resolve(__dirname, '../../..', filePath);
    const stats = fs.statSync(fullPath);
    return stats.mtime;
  } catch (error) {
    console.warn(`Could not get mod time for ${filePath}:`, error);
    return new Date(); // Fallback to current time
  }
}

// Format date for sitemap (YYYY-MM-DD)
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Generate sitemap XML
function generateSitemap() {
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
function writeSitemap() {
  const sitemap = generateSitemap();
  const outputPath = path.resolve(__dirname, '../../..', 'public/sitemap.xml');
  
  try {
    fs.writeFileSync(outputPath, sitemap, 'utf8');
    console.log('✅ Sitemap generated successfully:', outputPath);
    console.log('📅 Lastmod dates updated based on file modification times');
    
    // Show the generated sitemap
    console.log('\n🗺️ Generated sitemap:');
    console.log(sitemap);
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
