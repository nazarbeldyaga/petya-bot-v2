const pumpScanner = require('./services/pumpScanner');
const logger = require('./logs/logger');
const config = require('./config');
const telegramChannel = require('./channels/telegram');

async function main() {
  logger.log('====================================');
  logger.log('Starting petya-bot-v2 (pump-detector)');
  logger.log(`Alert Threshold: ${config.bot.pumpDumpPercent}%`);
  logger.log('====================================');

  try {
    pumpScanner.run();
  } catch (error) {
    logger.error(`Bot startup error: ${error.message}`);
    await telegramChannel.sendMessage(
      `❌ *FATAL ERROR:* Bot failed to start. Reason: ${error.message}`
    );
    process.exit(1);
  }
}

main();
