const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensorId:         { type: String, required: true, trim: true },
  location:         { type: String, required: true, default: 'City Center' },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  temperature:      { type: Number, required: true },
  humidity:         { type: Number, required: true },
  airQualityIndex:  { type: Number, required: true },
  noiseLevel:       { type: Number, required: true },
  trafficDensity:   { type: Number, required: true },
  powerConsumption: { type: Number, required: true },
  timestamp:        { type: Date, default: Date.now },
  anomalies: [{
    type:      { type: String },
    severity:  { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    message:   String,
    value:     Number,
    threshold: Number,
  }],
  status: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
  mlScore: { type: Number, default: 0 },  // Isolation Forest anomaly score
});

sensorDataSchema.index({ timestamp: -1 });
sensorDataSchema.index({ sensorId: 1, timestamp: -1 });
sensorDataSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
