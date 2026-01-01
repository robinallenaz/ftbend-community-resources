import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        server: './src/entry-server.tsx'
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    target: 'es2015',
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false
    }
  },
  ssr: {
    noExternal: ['react-router-dom', 'express', 'http-proxy-middleware']
  }
});
