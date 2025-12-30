const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');

const { connectToDb } = require('./lib/db');
const { buildCorsOptions } = require('./lib/cors');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  const status = Number(err.status) || 500;
  const message = typeof err.message === 'string' ? err.message : 'Server error';
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message });
});

async function start() {
  await connectToDb();

  const port = Number(process.env.PORT) || 8080;
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

start().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
