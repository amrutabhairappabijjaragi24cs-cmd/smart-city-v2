const express    = require('express');
const router     = express.Router();
const SensorData = require('../models/SensorData');
const { protect } = require('../middleware/auth');
const { detectAnomalies } = require('../utils/anomalyDetector');
const { sensorBuffer } = require('../utils/sensorSimulator');

// GET /api/sensors/latest  ← must be BEFORE /:id
router.get('/latest', protect, async (req, res) => {
  try {
    const latest = await SensorData.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$sensorId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);
    res.json({ success: true, data: latest });
  } catch {
    const map = new Map();
    sensorBuffer.forEach((d) => { if (!map.has(d.sensorId)) map.set(d.sensorId, d); });
    res.json({ success: true, data: [...map.values()], source: 'memory' });
  }
});

// GET /api/sensors/map  ← must be BEFORE /:id
router.get('/map', protect, async (req, res) => {
  try {
    const latest = await SensorData.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$sensorId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $project: { sensorId: 1, location: 1, coordinates: 1, status: 1,
                    temperature: 1, airQualityIndex: 1, trafficDensity: 1,
                    noiseLevel: 1, mlScore: 1, timestamp: 1 } },
    ]);
    res.json({ success: true, data: latest });
  } catch {
    const map = new Map();
    sensorBuffer.forEach((d) => { if (!map.has(d.sensorId)) map.set(d.sensorId, d); });
    res.json({ success: true, data: [...map.values()], source: 'memory' });
  }
});

// GET /api/sensors
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, sensorId } = req.query;
    const filter = sensorId ? { sensorId } : {};
    const data = await SensorData.find(filter).sort({ timestamp: -1 }).limit(+limit);
    res.json({ success: true, count: data.length, data });
  } catch {
    const data = sensorBuffer.slice(-50).reverse();
    res.json({ success: true, count: data.length, data, source: 'memory' });
  }
});

// POST /api/sensors
router.post('/', protect, async (req, res) => {
  try {
    const anomalies = detectAnomalies(req.body);
    const status    = anomalies.some((a) => a.severity === 'critical') ? 'critical'
      : anomalies.some((a) => a.severity === 'high') ? 'warning' : 'normal';
    const doc = await SensorData.create({ ...req.body, anomalies, status });
    req.io.emit('sensor_update', [doc]);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/sensors/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const doc = await SensorData.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sensors/history/:sensorId
router.get('/history/:sensorId', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - (+(req.query.hours || 1)) * 3600000);
    const data  = await SensorData
      .find({ sensorId: req.params.sensorId, timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .limit(200);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
