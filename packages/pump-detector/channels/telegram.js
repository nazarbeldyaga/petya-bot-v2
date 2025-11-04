const TelegramChannel = require('@petya-bot-v2/common-telegram');
const config = require('../config');
const logger = require('../logs/logger');

const telegramChannel = new TelegramChannel(
  config.telegram.botToken,
  config.telegram.chatId,
  logger
);

module.exports = telegramChannel;
