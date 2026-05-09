const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type:     { type: String, required: true, enum: ['temperature','pollution','traffic','noise','power','system','ml'] },
  severity: { type: String, required: true, enum: ['low','medium','high','critical'] },
  message:  { type: String, required: true },
  sensorId: { type: String, required: true },
  location: { type: String, default: 'Unknown' },
  coordinates: { lat: Number, lng: Number },
  value:     Number,
  threshold: Number,
  mlScore:   Number,
  acknowledged:   { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  whatsappSent:   { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

alertSchema.index({ timestamp: -1 });
alertSchema.index({ acknowledged: 1, severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);
