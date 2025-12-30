function buildCorsOptions() {
  const raw = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const allowlist = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  return {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowlist.includes(origin)) return cb(null, true);
      return cb(new Error('CORS blocked'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
}

module.exports = { buildCorsOptions };
