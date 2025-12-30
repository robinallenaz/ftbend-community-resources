const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Missing JWT_SECRET');
    err.status = 500;
    throw err;
  }
  return secret;
}

function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '14d' });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice('Bearer '.length);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

function requireAuth(req, _res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    const err = new Error('Not authenticated');
    err.status = 401;
    return next(err);
  }

  try {
    req.auth = verifyToken(token);
    return next();
  } catch {
    const err = new Error('Invalid token');
    err.status = 401;
    return next(err);
  }
}

function requireRole(roles) {
  return (req, _res, next) => {
    const role = req.auth && req.auth.role;
    if (!role || !roles.includes(role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      return next(err);
    }
    return next();
  };
}

module.exports = {
  signToken,
  requireAuth,
  requireRole
};
