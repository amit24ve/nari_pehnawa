const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const User = require('../models/User');

/**
 * Middleware to authenticate requests via JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, keys.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found or deleted.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {string[]} roles 
 */
const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. Authenticate first.' });
    }

    if (req.user.is_admin || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden. You do not have permission for this resource.' });
  };
};

// Aliases for common roles
const requireAdmin = requireRoles(['admin']);
const requireManager = requireRoles(['admin', 'manager']);
const requireWarehouse = requireRoles(['admin', 'manager', 'warehouse']);

module.exports = {
  authenticate,
  requireRoles,
  requireAdmin,
  requireManager,
  requireWarehouse
};
