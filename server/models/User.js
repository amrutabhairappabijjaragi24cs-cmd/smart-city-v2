const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, minlength: 6, select: false },
  role:          { type: String, enum: ['admin', 'user'], default: 'user' },
  phone:         { type: String, default: '' },  // +91XXXXXXXXXX
  zone:          { type: String, default: '' },  // area they live in
  alertsEnabled: { type: Boolean, default: true },
  isOnline:      { type: Boolean, default: false },
  lastSeen:      { type: Date, default: Date.now },
  loginCount:    { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (c) {
  return bcrypt.compare(c, this.password);
};

module.exports = mongoose.model('User', userSchema);
