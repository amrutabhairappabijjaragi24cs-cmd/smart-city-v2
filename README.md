# 🏙️ Smart City Monitoring System v2.0

Full-stack real-time IoT monitoring dashboard — production-ready, zero-config startup.

---

## ⚡ Quick Start

### Windows
```
Double-click setup.bat  →  then run both terminals below
```

### Linux / Mac
```bash
bash setup.sh
```

### Manual (any OS)
```bash
# Terminal 1 — Backend
cd server
npm install
cp .env.example .env
npm run dev

# Terminal 2 — Frontend
cd client
npm install --legacy-peer-deps
npm run dev
```

Open → **http://localhost:5173**

Register an account → Dashboard loads with live sensor data in ~4 seconds ✓

---

## ✅ What works out of the box (no config needed)

| Feature | Status |
|---|---|
| JWT Login / Register | ✅ Works |
| Live sensor simulation | ✅ Works (5 sensors, every 4s) |
| Real-time WebSocket updates | ✅ Works |
| Dashboard charts | ✅ Works |
| Leaflet city map (Bengaluru) | ✅ Works |
| Anomaly detection (rule-based) | ✅ Works |
| Alert history + acknowledge | ✅ Works |
| In-memory fallback (no MongoDB) | ✅ Works |

---

## 🔧 Optional Services

### MongoDB (for persistent data)
Without MongoDB the app uses **in-memory storage** — everything works, data resets on restart.

To enable persistence, install [MongoDB Community](https://www.mongodb.com/try/download/community) locally, then your `.env` default `MONGODB_URI=mongodb://localhost:27017/smart-city` will connect automatically.

### ML Microservice (Isolation Forest)
```bash
cd ml-service
pip install -r requirements.txt
python main.py
```
Runs on port 8000. Without it, ML scores show as `0.000` — no crash.

### WhatsApp Alerts (Twilio)
Add to `server/.env`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+91XXXXXXXXXX
```
Without credentials, alerts are logged to the backend console instead.

---

## 📁 Project Structure

```
smart-city-v2/
├── setup.bat / setup.sh       One-click install
├── server/
│   ├── index.js               Express + Socket.io entry
│   ├── .env.example           Copy this to .env
│   ├── models/                User, SensorData, Alert schemas
│   ├── routes/                auth, sensors, analytics, alerts, anomaly
│   ├── controllers/           authController
│   ├── middleware/             JWT protect, adminOnly
│   └── utils/
│       ├── sensorSimulator.js IoT simulation (5 Bengaluru sensors)
│       ├── anomalyDetector.js Rule-based threshold detection
│       └── whatsappService.js Twilio WhatsApp (optional)
├── client/
│   └── src/
│       ├── App.jsx            Router + protected routes
│       ├── context/           AuthContext, SocketContext
│       ├── pages/             Dashboard, Map, Analytics, Alerts, Sensors, Auth
│       └── components/        Layout, SensorCard, LiveChart, AlertFeed
└── ml-service/
    ├── main.py                FastAPI + Isolation Forest
    └── requirements.txt
```

---

## 🌐 API Endpoints

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET    /api/sensors
GET    /api/sensors/latest
GET    /api/sensors/map
POST   /api/sensors
DELETE /api/sensors/:id

GET /api/analytics/summary
GET /api/analytics/trend
GET /api/analytics/by-location

GET   /api/alerts
PATCH /api/alerts/:id/acknowledge
DELETE /api/alerts/:id   (admin only)

POST /api/anomaly/detect
GET  /api/anomaly/ml-status
```

---

## ☁️ Deploy to Cloud (Free)

**Backend → Render.com**
1. Push `server/` to GitHub
2. New Web Service → `npm install` / `node index.js`
3. Add env vars in Render dashboard

**Frontend → Vercel**
1. Push `client/` to GitHub
2. Import to Vercel → Framework: Vite
3. Done ✓

---

## 🔐 Security
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiry
- Rate limiting in production mode
- Helmet.js security headers
- CORS restricted to frontend origin
- Input validation on all auth routes

---

*VTU Semester IV CSE — Smart City IoT Project 2024*
