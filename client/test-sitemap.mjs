import { writeSitemap } from './src/utils/generateSitemap.js';

console.log('🧪 Testing sitemap generation with blog posts...');
writeSitemap().then(() => {
  console.log('✅ Test completed successfully!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
