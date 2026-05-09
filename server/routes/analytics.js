const express    = require('express');
const router     = express.Router();
const SensorData = require('../models/SensorData');
const Alert      = require('../models/Alert');
const { protect } = require('../middleware/auth');
const { sensorBuffer } = require('../utils/sensorSimulator');

// GET /api/analytics/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 86400000); // 24h

    const [totalReadings, criticalCount, alertCount, agg] = await Promise.all([
      SensorData.countDocuments({ timestamp: { $gte: since } }),
      SensorData.countDocuments({ status: 'critical', timestamp: { $gte: since } }),
      Alert.countDocuments({ timestamp: { $gte: since } }),
      SensorData.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: {
            _id: null,
            avgTemp:    { $avg: '$temperature' },
            avgAQI:     { $avg: '$airQualityIndex' },
            avgNoise:   { $avg: '$noiseLevel' },
            avgTraffic: { $avg: '$trafficDensity' },
            avgPower:   { $avg: '$powerConsumption' },
            avgMl:      { $avg: '$mlScore' },
            maxTemp:    { $max: '$temperature' },
            maxAQI:     { $max: '$airQualityIndex' },
        }},
      ]),
    ]);

    const a = agg[0] || {};
    res.json({
      success: true,
      data: {
        totalReadings,
        criticalCount,
        alertCount,
        normalCount: Math.max(0, totalReadings - criticalCount),
        averages: {
          temperature:      +(a.avgTemp    || 0).toFixed(1),
          airQualityIndex:  +(a.avgAQI     || 0).toFixed(0),
          noiseLevel:       +(a.avgNoise   || 0).toFixed(0),
          trafficDensity:   +(a.avgTraffic || 0).toFixed(0),
          powerConsumption: +(a.avgPower   || 0).toFixed(0),
          mlScore:          +(a.avgMl      || 0).toFixed(3),
        },
        peaks: {
          maxTemperature: +(a.maxTemp || 0).toFixed(1),
          maxAQI:         +(a.maxAQI  || 0).toFixed(0),
        },
      },
    });
  } catch {
    // In-memory fallback
    const b   = sensorBuffer.slice(-100);
    const avg = (k) => b.length ? b.reduce((s, d) => s + (d[k] || 0), 0) / b.length : 0;
    res.json({
      success: true,
      data: {
        totalReadings:    b.length,
        criticalCount:    b.filter(d => d.status === 'critical').length,
        alertCount:       b.filter(d => (d.anomalies || []).length > 0).length,
        normalCount:      b.filter(d => d.status === 'normal').length,
        averages: {
          temperature:      +avg('temperature').toFixed(1),
          airQualityIndex:  +avg('airQualityIndex').toFixed(0),
          noiseLevel:       +avg('noiseLevel').toFixed(0),
          trafficDensity:   +avg('trafficDensity').toFixed(0),
          powerConsumption: +avg('powerConsumption').toFixed(0),
          mlScore:          0,
        },
        peaks: {},
        source: 'memory',
      },
    });
  }
});

// GET /api/analytics/trend
router.get('/trend', protect, async (req, res) => {
  try {
    const hours = +(req.query.hours || 6);
    const since = new Date(Date.now() - hours * 3600000);

    const data = await SensorData.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            $subtract: [
              { $toLong: '$timestamp' },
              { $mod: [{ $toLong: '$timestamp' }, 900000] }, // 15-min buckets
            ],
          },
          avgTemp:    { $avg: '$temperature' },
          avgAQI:     { $avg: '$airQualityIndex' },
          avgTraffic: { $avg: '$trafficDensity' },
          avgNoise:   { $avg: '$noiseLevel' },
          avgMlScore: { $avg: '$mlScore' },
          timestamp:  { $first: '$timestamp' },
        },
      },
      { $sort: { timestamp: 1 } },
      { $limit: 100 },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/by-location
router.get('/by-location', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 86400000);
    const data  = await SensorData.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id:          '$location',
          avgTemp:      { $avg: '$temperature' },
          avgAQI:       { $avg: '$airQualityIndex' },
          avgTraffic:   { $avg: '$trafficDensity' },
          criticalCount: { $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] } },
          totalReadings: { $sum: 1 },
        },
      },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
