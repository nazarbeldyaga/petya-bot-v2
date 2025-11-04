require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  bot: {
    pumpDumpPercent: parseFloat(process.env.PUMP_DUMP_PERCENT || '50.0'),
    minVolumeUsdt: parseFloat(process.env.MIN_VOLUME_USDT || '1000000'),
    resetThresholdPercent: parseFloat(process.env.RESET_THRESHOLD_PERCENT || '10.0'),
    checkIntervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '60000', 10),
  },
};

module.exports = config;
