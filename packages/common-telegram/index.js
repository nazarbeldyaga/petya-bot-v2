const TelegramBot = require('node-telegram-bot-api');

class TelegramChannel {
  constructor(botToken, chatId, logger = console) {
    this.chatId = chatId;
    this.logger = logger;
    this.bot = null;

    if (!botToken || !chatId) {
      this.logger.warn(
        'Telegram botToken or chatId не предоставлены. Уведомления будут отключены.'
      );
      return;
    }

    try {
      this.bot = new TelegramBot(botToken);
      this.logger.log('Telegram channel: экземпляр бота успешно создан.');
    } catch (error) {
      this.logger.error(
        `Telegram channel: не удалось создать экземпляр бота. Ошибка: ${error.message}`
      );
    }
  }

  async sendMessage(message, customChatId = null) {
    const targetChatId = customChatId || this.chatId;

    if (!this.bot || !targetChatId) {
      this.logger.error(
        'Telegram channel: не могу отправить сообщение. Бот не инициализирован или отсутствует chatId.'
      );
      return;
    }

    try {
      await this.bot.sendMessage(targetChatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error(
        `Telegram channel: не удалось отправить сообщение в чат ${targetChatId}. Ошибка: ${error.message}`
      );
    }
  }
}

module.exports = TelegramChannel;
