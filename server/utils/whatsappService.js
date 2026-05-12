let client = null;

const init = () => {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token && sid.startsWith('AC')) {
    try {
      client = require('twilio')(sid, token);
      console.log('[Twilio] WhatsApp/SMS service ready');
    } catch (e) {
      console.warn('[Twilio] Init failed:', e.message);
    }
  } else {
    console.log('[Twilio] Not configured — alerts logged to console only');
  }
};
init();

// Send WhatsApp to a specific phone number
let lastWhatsAppSent = 0;
const sendWhatsApp = async (toPhone, message) => {
const now = Date.now();

  // 30 second cooldown
  if (now - lastWhatsAppSent < 30000) {
    return {
      success: false,
      message: "WhatsApp cooldown active"
    };
  }
  lastWhatsAppSent = now;
  if (!client) { console.log(`[WhatsApp MOCK] To ${toPhone}: ${message}`); return { success: false }; }
  try {
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      to: toPhone.startsWith('whatsapp:')
  ? toPhone
  : `whatsapp:${toPhone}`,
    });
    console.log(`[WhatsApp] Sent to ${toPhone}: ${msg.sid}`);
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.error(`[WhatsApp] Failed to ${toPhone}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Send SMS to a specific phone number
const sendSMS = async (toPhone, message) => {
  if (!client) { console.log(`[SMS MOCK] To ${toPhone}: ${message}`); return { success: false }; }
  try {
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER,
      to:   toPhone,
    });
    console.log(`[SMS] Sent to ${toPhone}: ${msg.sid}`);
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.error(`[SMS] Failed to ${toPhone}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Build alert message
const buildAlertMessage = (user, alert, sensorData) => `
🏙️ SmartCity DANGER ALERT
━━━━━━━━━━━━━━━━━━━━
👤 Dear ${user.name},
⚠️ SEVERITY: ${alert.severity?.toUpperCase()}
📍 Location: ${alert.location}
🔔 Type: ${alert.type?.toUpperCase()}
💬 ${alert.message}
━━━━━━━━━━━━━━━━━━━━
📊 Current Readings:
🌡 Temp: ${sensorData?.temperature?.toFixed(1)}°C
💨 AQI:  ${sensorData?.airQualityIndex?.toFixed(0)}
🔊 Noise: ${sensorData?.noiseLevel?.toFixed(0)} dB
🚦 Traffic: ${sensorData?.trafficDensity?.toFixed(0)}%
━━━━━━━━━━━━━━━━━━━━
⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Stay safe! - SmartCity Monitor
`.trim();

// Alert all users in the affected zone
const alertUsersInZone = async (zone, alert, sensorData, usersInMemory) => {
  const User = require('../models/User');
  let users  = [];

  try {
    // Match users in same zone OR nearby zones OR with alertsEnabled
    users = await User.find({
      alertsEnabled: true,
      phone: { $ne: '' },
      $or: [
        { zone: zone },
        { zone: '' },  // users who haven't set zone get all alerts
      ],
    });
  } catch {
    // In-memory fallback
    users = [...usersInMemory.values()].filter(
      u => u.alertsEnabled !== false && u.phone
    );
  }

  const message = buildAlertMessage({ name: 'Resident' }, alert, sensorData);

  for (const user of users) {
    if (!user.phone) continue;
    const personalMsg = buildAlertMessage(user, alert, sensorData);
    // Send both WhatsApp and SMS for critical alerts
    if (alert.severity === 'critical') {
      await sendWhatsApp(user.phone, personalMsg);
      await sendSMS(user.phone, personalMsg);
    } else if (alert.severity === 'high') {
      await sendWhatsApp(user.phone, personalMsg);
    }
    console.log(`[Alert] Notified ${user.name} (${user.phone}) about ${alert.type} in ${zone}`);
  }

  return users.length;
};

// Alert admin
const sendAdminAlert = async (alert, sensorData) => {
  const adminPhone = process.env.TWILIO_WHATSAPP_TO;
  if (!adminPhone) return;
  const msg = buildAlertMessage({ name: 'Admin' }, alert, sensorData);
  await sendWhatsApp(adminPhone.replace('whatsapp:', ''), msg);
};

module.exports = { sendWhatsApp, sendSMS, alertUsersInZone, sendAdminAlert, buildAlertMessage };
