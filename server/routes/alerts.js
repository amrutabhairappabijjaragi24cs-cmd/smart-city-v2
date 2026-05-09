const express = require('express');
const router  = express.Router();
const Alert   = require('../models/Alert');
const { protect, adminOnly } = require('../middleware/auth');
const { alertBuffer } = require('../utils/sensorSimulator');

// GET /api/alerts/stats  ← must be BEFORE /:id
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      { $group: {
          _id: '$severity',
          count: { $sum: 1 },
          unacknowledged: { $sum: { $cond: ['$acknowledged', 0, 1] } },
      }},
    ]);
    res.json({ success: true, data: stats });
  } catch {
    res.json({ success: true, data: [] });
  }
});

// GET /api/alerts
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 100, acknowledged, severity } = req.query;
    const filter = {};
    if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';
    if (severity) filter.severity = severity;

    const data = await Alert.find(filter).sort({ timestamp: -1 }).limit(+limit);
    res.json({ success: true, count: data.length, data });
  } catch {
    let data = [...alertBuffer].reverse();
    if (req.query.severity) data = data.filter(a => a.severity === req.query.severity);
    if (req.query.acknowledged !== undefined)
      data = data.filter(a => String(a.acknowledged) === req.query.acknowledged);
    res.json({ success: true, count: data.length, data: data.slice(0, 100), source: 'memory' });
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', protect, async (req, res) => {
  try {
    // Handle in-memory alerts
    if (req.params.id.startsWith('mem_')) {
      const alert = alertBuffer.find(a => a._id === req.params.id);
      if (alert) { alert.acknowledged = true; alert.acknowledgedBy = req.user._id || req.user.id; }
      return res.json({ success: true, data: alert || {} });
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { acknowledged: true, acknowledgedBy: req.user._id },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
