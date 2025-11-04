const axios = require('axios');
const config = require('../config');
const logger = require('../logs/logger');
const telegramChannel = require('../channels/telegram');

// Ендпоінт, що повертає ціни на ВСІ ф'ючерсні пари
const ALL_TICKERS_URL = 'https://contract.mexc.com/api/v1/contract/ticker';

class PumpScanner {
  constructor() {
    // Тут ми будемо зберігати історію цін
    // 'BTC': [100, 95, 90] (три останні ціни: поточна, попередня, перед-попередня)
    this.priceHistory = new Map();

    // Тут ми зберігаємо стан алерту, щоб не спамити
    // 'BTC': 'PUMP' або 'DUMP'
    this.alertState = new Map();
  }

  /**
   * Головний цикл перевірки
   */
  async checkForPumps() {
    logger.log('[ANALYSIS] Starting new check cycle for ALL symbols...');
    let allTickers = [];

    try {
      // 1. Отримуємо всі тікери одним запитом
      const response = await axios.get(ALL_TICKERS_URL);
      if (!response.data || !response.data.success || !response.data.data) {
        logger.warn('[API] Received invalid data structure from MEXC.');
        return;
      }
      allTickers = response.data.data;
    } catch (error) {
      logger.error(`[API] Failed to fetch tickers: ${error.message}`);
      return; // Пропускаємо цей цикл, якщо сталася помилка
    }

    let processedCount = 0;

    for (const ticker of allTickers) {
      // 2. Фільтр обсягу (дуже важливо для пампів)
      const volume24h = parseFloat(ticker.amount24);
      if (volume24h < config.bot.minVolumeUsdt) {
        continue; // Пропускаємо неліквід
      }

      // Перевіряємо наявність даних
      if (!ticker.lastPrice || !ticker.symbol) {
        continue;
      }

      processedCount++;
      const symbol = ticker.symbol.replace('_USDT', '');
      const currentPrice = parseFloat(ticker.lastPrice);

      // 3. Оновлення історії цін
      if (!this.priceHistory.has(symbol)) {
        this.priceHistory.set(symbol, []); // Ініціалізуємо, якщо бачимо вперше
      }
      const history = this.priceHistory.get(symbol);
      history.unshift(currentPrice); // Додаємо нову ціну на початок

      // Тримаємо в історії тільки 3 останні ціни
      if (history.length > 3) {
        history.pop(); // Видаляємо найстарішу (четверту)
      }

      // 4. Аналіз (починаємо тільки коли маємо 3 записи)
      if (history.length < 3) {
        continue; // Ще збираємо дані
      }

      const current = history[0]; // P(t) - поточна
      // const previous = history[1]; // P(t-1) - попередня
      const oldest = history[2]; // P(t-2) - перед-попередня

      // Розраховуємо зміну від P(t-2) до P(t)
      const percentageChange = (current / oldest - 1) * 100;

      const lastAlert = this.alertState.get(symbol);

      // 5. Логіка Алерту
      const threshold = config.bot.pumpDumpPercent;

      // ПАМП 📈
      if (percentageChange >= threshold) {
        if (lastAlert !== 'PUMP') {
          this.handleAlert(symbol, percentageChange, current, oldest, 'PUMP');
          this.alertState.set(symbol, 'PUMP');
        }
      }
      // ДАМП 📉
      else if (percentageChange <= -threshold) {
        if (lastAlert !== 'DUMP') {
          this.handleAlert(symbol, percentageChange, current, oldest, 'DUMP');
          this.alertState.set(symbol, 'DUMP');
        }
      }
      // ПОВЕРНЕННЯ ДО НОРМИ (нижче порогу "скидання")
      else if (Math.abs(percentageChange) < config.bot.resetThresholdPercent) {
        if (lastAlert) {
          this.handleResetAlert(symbol, percentageChange);
          this.alertState.set(symbol, null);
        }
      }
    }

    logger.log(
      `[ANALYSIS] Received ${allTickers.length} symbols. Analyzed ${processedCount} symbols with volume > ${config.bot.minVolumeUsdt} USDT. Cycle complete.`
    );
  }

  /**
   * Надсилає алерт про ПАМП/ДАМП
   */
  handleAlert(symbol, change, current, oldest, type) {
    const changeFormatted = change.toFixed(2);
    const emoji = type === 'PUMP' ? '📈' : '📉';
    const title = type === 'PUMP' ? '🔥 PUMP' : '💀 DUMP';

    const message = `
${emoji} *${title} ALERT* ${emoji}

*Token:* \`${symbol}\`
*Price movement:* \`${changeFormatted}%\`

*Details:*
- Current price: \`${current}\`
- Old price: \`${oldest}\`
        `;

    logger.log(`[SIGNAL] ${type} for ${symbol}! Change: ${changeFormatted}%`);
    telegramChannel.sendMessage(message);
  }

  /**
   * Надсилає алерт про повернення до норми
   */
  handleResetAlert(symbol, change) {
    const message = `
✅ *${symbol} returned to normal* ✅

Current movement: \`${change.toFixed(2)}%\` (below the threshold ${config.bot.resetThresholdPercent}%)
        `;

    logger.log(`[STATE] ${symbol} reset to neutral.`);
    telegramChannel.sendMessage(message);
  }

  /**
   * Головний метод запуску
   */
  run() {
    logger.log(`Starting Pump/Dump scanner...`);
    logger.log(`Alert Threshold: ${config.bot.pumpDumpPercent}%`);
    logger.log(`Check Interval: ${config.bot.checkIntervalMs}ms`);

    // Запускаємо перший раз одразу
    this.checkForPumps();

    // Запускаємо аналізатор по інтервалу
    setInterval(() => this.checkForPumps(), config.bot.checkIntervalMs);
  }
}

module.exports = new PumpScanner();
