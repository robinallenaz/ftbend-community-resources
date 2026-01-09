import type { Plugin } from 'vite';
import { writeSitemap } from './src/utils/generateSitemap.js';

export function sitemapPlugin(): Plugin {
  return {
    name: 'sitemap-generator',
    buildStart() {
      console.log('🗺️ Generating sitemap...');
    },
    writeBundle() {
      // Generate sitemap after build is complete
      writeSitemap();
    },
    handleHotUpdate({ file }) {
      // Regenerate sitemap when page files change
      if (file.includes('/pages/') && file.endsWith('.tsx')) {
        console.log('📅 Page file updated, regenerating sitemap...');
        writeSitemap();
      }
    }
  };
}
