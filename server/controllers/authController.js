const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User   = require('../models/User');
const { inMemoryUsers } = require('../middleware/auth');

const inMemByEmail = new Map();
const JWT_SECRET   = () => process.env.JWT_SECRET || 'smartcity_dev_secret_change_in_prod';
const sign         = (id) => jwt.sign({ id }, JWT_SECRET(), { expiresIn: process.env.JWT_EXPIRE || '7d' });
const userPayload  = (u) => ({
  id: u._id?.toString() || u.id,
  name: u.name, email: u.email, role: u.role,
  phone: u.phone || '', zone: u.zone || '',
  alertsEnabled: u.alertsEnabled !== false,
});

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, role, phone, zone } = req.body;
  try {
    let user, dbError = false;
    try {
      if (await User.findOne({ email: email.toLowerCase() }))
        return res.status(400).json({ success: false, message: 'Email already registered.' });
      user = await User.create({
        name: name.trim(), email: email.toLowerCase().trim(),
        password, role: role === 'admin' ? 'admin' : 'user',
        phone: phone || '', zone: zone || '', loginCount: 1, isOnline: true,
      });
    } catch {
      dbError = true;
      const emailKey = email.toLowerCase().trim();
      if (inMemByEmail.has(emailKey))
        return res.status(400).json({ success: false, message: 'Email already registered.' });
      const id = `mem_${Date.now()}`;
      const hashed = await bcrypt.hash(password, 12);
      user = { _id: id, id, name: name.trim(), email: emailKey, password: hashed,
               role: role === 'admin' ? 'admin' : 'user', phone: phone || '',
               zone: zone || '', alertsEnabled: true, isOnline: true, loginCount: 1 };
      inMemoryUsers.set(id, user);
      inMemByEmail.set(emailKey, user);
    }
    if (dbError) console.log('[Auth] In-memory registration');
    res.status(201).json({ success: true, token: sign(user._id?.toString() || user.id), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  const emailKey = email.toLowerCase().trim();
  try {
    let user = null, valid = false;
    try {
      user  = await User.findOne({ email: emailKey }).select('+password');
      if (user) valid = await user.comparePassword(password);
    } catch {
      user  = inMemByEmail.get(emailKey);
      if (user) valid = await bcrypt.compare(password, user.password);
    }
    if (!user || !valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    // Mark online + increment login count
    try {
      await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date(), $inc: { loginCount: 1 } });
    } catch {
      if (inMemoryUsers.has(user.id || user._id)) {
        const u = inMemoryUsers.get(user.id || user._id);
        u.isOnline = true; u.lastSeen = new Date(); u.loginCount = (u.loginCount || 0) + 1;
      }
    }
    res.json({ success: true, token: sign(user._id?.toString() || user.id), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = (req, res) => res.json({ success: true, user: userPayload(req.user) });

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
  } catch {
    const u = inMemoryUsers.get(req.user.id || req.user._id);
    if (u) { u.isOnline = false; u.lastSeen = new Date(); }
  }
  res.json({ success: true, message: 'Logged out' });
};

exports.updateProfile = async (req, res) => {
  const { phone, zone, alertsEnabled, name } = req.body;
  try {
    let user;
    try {
      user = await User.findByIdAndUpdate(req.user._id,
        { phone, zone, alertsEnabled, name }, { new: true });
    } catch {
      const u = inMemoryUsers.get(req.user.id || req.user._id);
      if (u) { if (phone !== undefined) u.phone = phone; if (zone !== undefined) u.zone = zone;
               if (alertsEnabled !== undefined) u.alertsEnabled = alertsEnabled; if (name) u.name = name; user = u; }
    }
    res.json({ success: true, user: userPayload(user || req.user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
