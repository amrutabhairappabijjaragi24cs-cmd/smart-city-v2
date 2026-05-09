const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const { register, login, getMe, logout, updateProfile } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const { inMemoryUsers } = require('../middleware/auth');

router.post('/register', [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.get('/me',             protect, getMe);
router.post('/logout',        protect, logout);
router.put('/profile',        protect, updateProfile);

// ── Admin: list all users with online status ───────────────────
router.get('/admin/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch {
    // In-memory fallback
    const users = [...inMemoryUsers.values()].map(u => ({
      id: u.id || u._id, name: u.name, email: u.email, role: u.role,
      phone: u.phone, zone: u.zone, isOnline: u.isOnline || false,
      lastSeen: u.lastSeen, loginCount: u.loginCount || 0, alertsEnabled: u.alertsEnabled,
    }));
    res.json({ success: true, count: users.length, data: users });
  }
});

// ── Admin: online users count ──────────────────────────────────
router.get('/admin/online', protect, adminOnly, async (req, res) => {
  try {
    const total  = await User.countDocuments({});
    const online = await User.countDocuments({ isOnline: true });
    const byZone = await User.aggregate([
      { $group: { _id: '$zone', count: { $sum: 1 }, online: { $sum: { $cond: ['$isOnline', 1, 0] } } } }
    ]);
    res.json({ success: true, data: { total, online, offline: total - online, byZone } });
  } catch {
    const all    = [...inMemoryUsers.values()];
    const online = all.filter(u => u.isOnline).length;
    res.json({ success: true, data: { total: all.length, online, offline: all.length - online, byZone: [] } });
  }
});

// ── Admin: send manual alert to user ──────────────────────────
router.post('/admin/alert-user', protect, adminOnly, async (req, res) => {
  const { userId, message } = req.body;
  try {
    let user;
    try { user = await User.findById(userId); }
    catch { user = inMemoryUsers.get(userId); }
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.phone) return res.status(400).json({ success: false, message: 'User has no phone number' });

    const { sendWhatsApp, sendSMS } = require('../utils/whatsappService');
    const msg = `🏙️ SmartCity Admin Alert\n\nDear ${user.name},\n${message}\n\n⏰ ${new Date().toLocaleString('en-IN')}`;
    await sendWhatsApp(user.phone, msg);
    await sendSMS(user.phone, msg);
    res.json({ success: true, message: `Alert sent to ${user.name}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
