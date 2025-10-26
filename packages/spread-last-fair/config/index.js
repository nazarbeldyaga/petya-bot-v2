require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const config = {
  mexc: {
    apiKey: process.env.MEXC_API_KEY,
    secret: process.env.MEXC_API_SECRET,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  bot: {
    minSpreadPercent: parseFloat(process.env.MIN_SPREAD_PERCENT || '5.0'),
    spreadEndThreshold: parseFloat(process.env.SPREAD_END_THRESHOLD || '1.0'),
    minVolumeUsdt: parseFloat(process.env.MIN_VOLUME_USDT || '1000000'),
    reAlertMs: parseInt(process.env.RE_ALERT_MS || '120000', 10),
    checkIntervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '3000', 10),
  },
};

module.exports = config;
