const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// In-memory fallback store (shared with authController)
const inMemoryUsers = new Map();

const JWT_SECRET = () => process.env.JWT_SECRET || 'smartcity_dev_secret_change_in_prod';

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided.' });

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET());

    let user;
    // Try MongoDB first
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch {
      user = null;
    }

    // Fallback to in-memory
    if (!user) user = inMemoryUsers.get(decoded.id);

    if (!user)
      return res.status(401).json({ success: false, message: 'User not found.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

module.exports = { protect, adminOnly, inMemoryUsers };
