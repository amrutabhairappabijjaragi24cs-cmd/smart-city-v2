// Rule-based anomaly detection (Isolation-Forest scores added by ML service)

const THRESHOLDS = {
  temperature:      { warning: 35, critical: 42 },
  airQualityIndex:  { warning: 100, critical: 200 },
  noiseLevel:       { warning: 70,  critical: 90  },
  trafficDensity:   { warning: 70,  critical: 90  },
  humidity:         { warning: 85,  critical: 95  },
  powerConsumption: { warning: 180, critical: 220 },
};

const check = (value, warnT, critT, type, unit, location) => {
  if (value >= critT) return { type, severity: 'critical',
    message: `🔴 CRITICAL ${type}: ${value.toFixed(1)}${unit} at ${location}`,
    value, threshold: critT };
  if (value >= warnT) return { type, severity: 'high',
    message: `🟠 HIGH ${type}: ${value.toFixed(1)}${unit} at ${location}`,
    value, threshold: warnT };
  return null;
};

const detectAnomalies = (data) => {
  const loc = data.location;
  const results = [
    check(data.temperature,      35,  42,  'temperature', '°C',  loc),
    check(data.airQualityIndex,  100, 200, 'pollution',   ' AQI', loc),
    check(data.noiseLevel,       70,  90,  'noise',       ' dB',  loc),
    check(data.trafficDensity,   70,  90,  'traffic',     '%',    loc),
    check(data.powerConsumption, 180, 220, 'power',       ' kW',  loc),
  ].filter(Boolean);
  return results;
};

module.exports = { detectAnomalies, THRESHOLDS };
