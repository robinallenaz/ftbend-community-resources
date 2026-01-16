import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🚀 Sitemap script started!');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Page configuration with their content sources
const staticPageConfig = [
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
    url: 'https://ftbend-lgbtqia-community.org/blog/',
    source: 'src/pages/BlogPage.tsx',
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

// Fetch blog posts from API
async function fetchBlogPosts() {
  try {
    // Use the same API endpoint that your blog page uses
    const response = await fetch('https://ftbend-lgbtqia-community.org/api/public/blog-posts');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    const posts = Array.isArray(data) ? data : (data.blogPosts || data.posts || []);
    
    return posts.map(post => ({
      url: `https://ftbend-lgbtqia-community.org/blog/${post.slug}`,
      lastmod: formatDate(new Date(post.updatedAt || post.createdAt || post.publishedAt)),
      changefreq: 'monthly'
    }));
  } catch (error) {
    console.warn('Could not fetch blog posts for sitemap:', error.message);
    return []; // Return empty array if API fails
  }
}

// Get file modification time
function getFileModTime(filePath) {
  try {
    // Fix path resolution - go up one level from utils to client directory
    const fullPath = path.resolve(__dirname, '..', filePath);
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
async function generateSitemap() {
  console.log('🔍 Starting sitemap generation...');
  
  // Generate static page URLs
  const staticUrls = staticPageConfig.map(page => {
    console.log(`📄 Processing page: ${page.url} from ${page.source}`);
    const lastmod = formatDate(getFileModTime(page.source));
    
    return `  <url>
    <loc>${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
  </url>`;
  }).join('\n');

  // Fetch blog posts and generate their URLs
  console.log('🌐 Fetching blog posts from API...');
  const blogPosts = await fetchBlogPosts();
  console.log(`📝 Found ${blogPosts.length} blog posts`);
  const blogUrls = blogPosts.map(post => {
    return `  <url>
    <loc>${post.url}</loc>
    <lastmod>${post.lastmod}</lastmod>
    <changefreq>${post.changefreq}</changefreq>
  </url>`;
  }).join('\n');

  // Combine all URLs
  const allUrls = staticUrls + '\n' + blogUrls;

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`;
}

// Write sitemap to public directory
async function writeSitemap() {
  console.log('📝 Starting writeSitemap function...');
  try {
    console.log('🔄 Generating sitemap content...');
    const sitemap = await generateSitemap();
    // Fix output path - go up two levels from utils to client/public
    const outputPath = path.resolve(__dirname, '../../public/sitemap.xml');
    
    console.log('💾 Writing sitemap to:', outputPath);
    fs.writeFileSync(outputPath, sitemap, 'utf8');
    console.log('✅ Sitemap generated successfully:', outputPath);
    console.log('📅 Lastmod dates updated based on file modification times');
    console.log('📝 Blog posts fetched from API and included in sitemap');
    
    // Show the generated sitemap
    console.log('\n🗺️ Generated sitemap:');
    console.log(sitemap);
  } catch (error) {
    console.error('❌ Error writing sitemap:', error);
    throw error;
  }
}

// Export for use in build scripts
export { generateSitemap, writeSitemap };

// Run if called directly
console.log('🔍 Checking if script is run directly...');

// Convert both paths to the same format for comparison
const importPath = import.meta.url.replace(/\\/g, '/').replace('file:///', '');
const argvPath = process.argv[1].replace(/\\/g, '/');
const normalizedImportPath = importPath.startsWith('/') ? importPath.slice(1) : importPath;

console.log('🔍 import.meta.url:', import.meta.url);
console.log('🔍 process.argv[1]:', process.argv[1]);
console.log('🔍 normalized importPath:', normalizedImportPath);
console.log('🔍 normalized argvPath:', argvPath);

if (normalizedImportPath === argvPath || import.meta.url.includes(argvPath)) {
  console.log('✅ Script is being run directly');
  console.log('🎯 Running sitemap generation...');
  writeSitemap().catch(error => {
    console.error('❌ Sitemap generation failed:', error);
    process.exit(1);
  });
} else {
  console.log('❌ Script is not being run directly');
  console.log('🔍 This might be the issue');
}
