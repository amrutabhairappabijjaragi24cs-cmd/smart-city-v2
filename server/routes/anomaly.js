const express = require('express');
const router  = express.Router();
const http    = require('http');
const https   = require('https');
const { protect } = require('../middleware/auth');
const { detectAnomalies } = require('../utils/anomalyDetector');

// Simple HTTP helper (no axios dependency)
const httpPost = (url, body) => new Promise((resolve, reject) => {
  const urlObj = new URL(url);
  const lib    = urlObj.protocol === 'https:' ? https : http;
  const data   = JSON.stringify(body);

  const req = lib.request({
    hostname: urlObj.hostname,
    port:     urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path:     urlObj.pathname,
    method:   'POST',
    headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  }, (res) => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { reject(e); } });
  });
  req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
  req.on('error', reject);
  req.write(data);
  req.end();
});

const httpGet = (url) => new Promise((resolve, reject) => {
  const urlObj = new URL(url);
  const lib    = urlObj.protocol === 'https:' ? https : http;
  const req = lib.get({ hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname }, (res) => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { reject(e); } });
  });
  req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
  req.on('error', reject);
});

// POST /api/anomaly/detect
router.post('/detect', protect, async (req, res) => {
  try {
    const data           = req.body;
    const ruleAnomalies  = detectAnomalies(data);
    const ML_URL         = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    let mlResult = { anomaly_score: 0, is_anomaly: false, method: 'offline' };
    try {
      const r = await httpPost(`${ML_URL}/predict`, {
        temperature:       data.temperature,
        humidity:          data.humidity,
        air_quality_index: data.airQualityIndex,
        noise_level:       data.noiseLevel,
        traffic_density:   data.trafficDensity,
        power_consumption: data.powerConsumption,
      });
      mlResult = { ...r, method: 'isolation_forest' };
    } catch {
      mlResult.method = 'offline_fallback';
    }

    res.json({
      success: true,
      ruleBasedAnomalies: ruleAnomalies,
      mlResult,
      combinedSeverity:
        ruleAnomalies.some(a => a.severity === 'critical') || mlResult.is_anomaly
          ? 'critical'
          : ruleAnomalies.length > 0 ? 'warning' : 'normal',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/anomaly/ml-status
router.get('/ml-status', protect, async (req, res) => {
  const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  try {
    const data = await httpGet(`${ML_URL}/health`);
    res.json({ success: true, online: true, data });
  } catch {
    res.json({ success: true, online: false, message: 'ML service offline — using rule-based fallback' });
  }
});

module.exports = router;
