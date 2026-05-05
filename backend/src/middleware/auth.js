const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

// Extract token from HttpOnly cookie or Authorization header
const getTokenFromRequest = (req) => {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

const authRequired = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const secret = process.env.JWT_SECRET || 'default_secret_change_in_production';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('authRequired error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  next();
};

module.exports = {
  authRequired,
  requireRole,
};

