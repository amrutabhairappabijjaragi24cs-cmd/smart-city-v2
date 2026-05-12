const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Store last alert time
let lastSent = 0;

const sendTelegramAlert = async (message) => {

  const now = Date.now();

  // 30 second cooldown
  if (now - lastSent < 10000) {
    return;
  }

  lastSent = now;

  try {

    const url =
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
    });

    console.log("✅ Telegram alert sent");

  } catch (error) {

    console.log(
      "❌ Telegram error:",
      error.response?.data || error.message
    );
  }
};

module.exports = sendTelegramAlert;