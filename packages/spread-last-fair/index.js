const signalGenerator = require('./services/signalGenerator');
const logger = require('./logs/logger');
const config = require('./config');

async function main() {
  logger.log('====================================');
  logger.log('Starting petya-bot-v2 (spread-last-fair)');
  logger.log(`Minimum spread threshold: ${config.bot.minSpreadPercent}%`);
  logger.log('====================================');

  try {
    signalGenerator.run();
  } catch (error) {
    logger.error(`Bot startup error: ${error.message}`);
    process.exit(1);
  }
}

main();
