require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { startSensorSimulation } = require('./utils/sensorSimulator');

const app    = express();
const server = http.createServer(app);

// ── Socket.io — allow all origins for local network access ─────
const io = new Server(server, {
  cors: {
   origin: [
  'http://localhost:5173',
  'https://smart-city-v2-live.vercel.app',
  'https://smart-city-v2-six.vercel.app',
  'https://smart-city-v2-five.vercel.app',
  'https://smart-city-v2-p26tnn5oo.vercel.app'
],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

app.use(cors({
  origin: [
  'http://localhost:5173',
  'https://smart-city-v2-live.vercel.app',
  'https://smart-city-v2-six.vercel.app',
  'https://smart-city-v2-five.vercel.app',
  'https://smart-city-v2-p26tnn5oo.vercel.app'
],
  credentials: true
}));

// ── Middleware ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS — allow all origins so mobile/other devices can connect

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests.' },
});
app.use('/api/', limiter);

app.use((req, _res, next) => { req.io = io; next(); });

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/sensors',   require('./routes/sensors'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/alerts',    require('./routes/alerts'));
app.use('/api/anomaly',   require('./routes/anomaly'));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date(), version: '2.0.0' })
);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Socket.io ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[Socket] Disconnected: ${socket.id}`));
});

// ── MongoDB ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-city')
  .then(() => { console.log('[DB] MongoDB connected'); startSensorSimulation(io); })
  .catch((err) => { console.warn('[DB] In-memory mode:', err.message); startSensorSimulation(io); });

// ── Listen on ALL network interfaces ─────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  // Get local network IP
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address;
        break;
      }
    }
  }
  console.log('\n🏙️  SmartCity API started!');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
  console.log(`\n📱 Share this with mobile/other laptops on same WiFi:`);
  console.log(`   http://${localIP}:${PORT}\n`);
});

module.exports = { app, io };
