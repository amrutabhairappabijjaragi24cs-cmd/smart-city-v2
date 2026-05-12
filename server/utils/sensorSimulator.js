const sendTelegramAlert = require("./sendTelegramAlert");
const SensorData = require('../models/SensorData');
const Alert      = require('../models/Alert');
const { detectAnomalies }  = require('./anomalyDetector');
const { alertUsersInZone, sendAdminAlert } = require('./whatsappService');
const { SENSORS } = require('./bengaluruSensors');
const { inMemoryUsers }    = require('../middleware/auth');

const sensorBuffer = [];
const alertBuffer  = [];
const MAX_BUF = 1000;
let interval  = null;

const rnd   = (min, max) => min + Math.random() * (max - min);
const spike = () => Math.random() < 0.09;

const generate = (sensor) => ({
  sensorId:         sensor.id,
  location:         sensor.location,
  zone:             sensor.zone,
  coordinates:      { lat: sensor.lat, lng: sensor.lng },
  temperature:      spike() ? rnd(40, 52) : rnd(22, 35),
  humidity:         rnd(40, 80),
  airQualityIndex:  spike() ? rnd(180, 320) : rnd(25, 95),
  noiseLevel:       spike() ? rnd(88, 115) : rnd(38, 68),
  trafficDensity:   spike() ? rnd(82, 100) : rnd(10, 70),
  powerConsumption: rnd(60, 200),
  timestamp:        new Date(),
});

const callML = (data) => new Promise((resolve) => {
  try {
    const body = JSON.stringify({
      temperature: data.temperature,
      humidity: data.humidity,
      air_quality_index: data.airQualityIndex,
      noise_level: data.noiseLevel,
      traffic_density: data.trafficDensity,
      power_consumption: data.powerConsumption,
    });

    const url = new URL(
      (process.env.ML_SERVICE_URL || 'http://localhost:8000') + '/predict'
    );

    const lib = url.protocol === 'https:' ? require('https') : require('http');

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: '/predict',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let r = '';

        res.on('data', c => r += c);

        res.on('end', () => {
          try {
            resolve(JSON.parse(r).anomaly_score ?? 0);
          } catch {
            resolve(0);
          }
        });
      }
    );

    req.setTimeout(1500, () => {
      req.destroy();
      resolve(0);
    });

    req.on('error', () => resolve(0));

    req.write(body);
    req.end();

  } catch {
    resolve(0);
  }
});

// Rotate through sensors
let sensorIndex = 0;

const startSensorSimulation = (io) => {

  if (interval) clearInterval(interval);

  console.log(
    `[Simulator] Started — ${SENSORS.length} Bengaluru sensors`
  );

  // Initial sensor load
  setTimeout(() => {
    const initial = SENSORS.map(s => ({
      ...generate(s),
      anomalies: [],
      status: 'normal',
      mlScore: 0
    }));

    io.emit('sensor_update', initial);

  }, 1000);

  interval = setInterval(async () => {

    const batch = [];

    for (let i = 0; i < 50; i++) {
      batch.push(SENSORS[sensorIndex % SENSORS.length]);
      sensorIndex++;
    }

    const readings = [];

    for (const sensor of batch) {

      const data      = generate(sensor);
      const anomalies = detectAnomalies(data);
      const mlScore   = await callML(data);

      const status =
        anomalies.some(a => a.severity === 'critical')
          ? 'critical'
          : anomalies.some(a => a.severity === 'high')
            ? 'warning'
            : 'normal';

      const doc = {
        ...data,
        anomalies,
        status,
        mlScore
      };

      readings.push(doc);

      try {
        await SensorData.create(doc);

      } catch {

        sensorBuffer.push(doc);

        if (sensorBuffer.length > MAX_BUF) {
          sensorBuffer.shift();
        }
      }

      // Handle anomalies
      for (const anomaly of anomalies) {

        const alertDoc = {
          ...anomaly,
          sensorId: sensor.id,
          location: sensor.location,
          zone: sensor.zone,
          coordinates: {
            lat: sensor.lat,
            lng: sensor.lng
          },
          mlScore,
        };

        try {

          const saved = await Alert.create(alertDoc);

          const alertObj = saved.toObject();

          io.emit('new_alert', {
            ...alertObj,
            sensorData: data
          });

          // High/Critical Alerts
          if (['high', 'critical'].includes(anomaly.severity)) {

            // WhatsApp alerts
            alertUsersInZone(
              sensor.zone,
              alertObj,
              data,
              inMemoryUsers
            ).catch(() => {});

            sendAdminAlert(
              alertObj,
              data
            ).catch(() => {});

            // Telegram alert
            sendTelegramAlert(
`🚨 Smart City Alert

📍 Zone: ${sensor.zone}
📌 Location: ${sensor.location}

⚠️ Type: ${anomaly.type}
🔥 Severity: ${anomaly.severity}

🌡 Temperature: ${data.temperature.toFixed(1)}°C
🌫 AQI: ${data.airQualityIndex.toFixed(0)}
🚗 Traffic Density: ${data.trafficDensity.toFixed(0)}%

🕒 Time: ${new Date().toLocaleString()}`
            ).catch(() => {});
          }

        } catch {

          const mem = {
            _id: `mem_${Date.now()}`,
            ...alertDoc,
            acknowledged: false,
            timestamp: new Date()
          };

          alertBuffer.push(mem);

          if (alertBuffer.length > 200) {
            alertBuffer.shift();
          }

          io.emit('new_alert', {
            ...mem,
            sensorData: data
          });

          if (['high', 'critical'].includes(anomaly.severity)) {

            alertUsersInZone(
              sensor.zone,
              mem,
              data,
              inMemoryUsers
            ).catch(() => {});

            // Telegram alert
            sendTelegramAlert(
`🚨 Smart City Alert

📍 Zone: ${sensor.zone}
📌 Location: ${sensor.location}

⚠️ Type: ${anomaly.type}
🔥 Severity: ${anomaly.severity}

🌡 Temperature: ${data.temperature.toFixed(1)}°C
🌫 AQI: ${data.airQualityIndex.toFixed(0)}
🚗 Traffic Density: ${data.trafficDensity.toFixed(0)}%

🕒 Time: ${new Date().toLocaleString()}`
            ).catch(() => {});
          }
        }
      }
    }

    io.emit('sensor_update', readings);

  }, 5000);
};

module.exports = {
  startSensorSimulation,
  sensorBuffer,
  alertBuffer,
  SENSORS
};