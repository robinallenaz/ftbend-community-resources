function buildCorsOptions() {
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  return {
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
}

module.exports = { buildCorsOptions };
