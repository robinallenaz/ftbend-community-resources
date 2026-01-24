import express from 'express';
import { render, createDocument } from './entry-server';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3001;

// Serve static files from dist directory
app.use('/assets', express.static(path.resolve(__dirname, '../dist/assets')));
app.use('/favicon.ico', express.static(path.resolve(__dirname, '../dist/favicon.ico')));
app.use('/favicon-16x16.png', express.static(path.resolve(__dirname, '../dist/favicon-16x16.png')));
app.use('/favicon-32x32.png', express.static(path.resolve(__dirname, '../dist/favicon-32x32.png')));
app.use('/apple-touch-icon.png', express.static(path.resolve(__dirname, '../dist/apple-touch-icon.png')));
app.use('/site.webmanifest', express.static(path.resolve(__dirname, '../dist/site.webmanifest')));

// Simple API proxy
import { createProxyMiddleware } from 'http-proxy-middleware';
app.use('/api', createProxyMiddleware({
  target: 'https://ftbend-community-resources-api.onrender.com',
  changeOrigin: true
}));

// SSR for all routes
app.get('*', async (req, res) => {
  try {
    console.log(`SSR rendering: ${req.url}`);
    const { html } = render(req.url);
    const document = createDocument({ html });
    res.send(document);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`SSR server running on http://localhost:${port}`);
  console.log('Visit http://localhost:3001 to see SSR in action!');
});
