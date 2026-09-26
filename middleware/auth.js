const jwt = require('jsonwebtoken');

// 1. Verify JWT Token
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ message: 'Malformed Authorization header' });
  }
  const token = parts[1];

  jwt.verify(token, process.env.JWT_SECRET || 'marketlink_secret_key', (err, payload) => {
    if (err) {
      return res.status(403).json({ message: 'Token expired or invalid' });
    }

    req.user = payload; // Contains { id, uniqueID, email, role }
    req.token = token;
    next();
  });
}

// 2. Role Authorization Middleware Helper
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions.' });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  authorizeRoles
};