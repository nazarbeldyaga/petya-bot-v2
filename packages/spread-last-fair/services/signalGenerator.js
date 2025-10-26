const axios = require('axios');
const config = require('../config');
const logger = require('../logs/logger');
const { calculateSpread } = require('./spreadCalculator');
const telegramChannel = require('../channels/telegram');

const ALL_TICKERS_URL = 'https://contract.mexc.com/api/v1/contract/ticker';

class SignalGenerator {
  constructor() {
    this.signalState = {};
  }

  async checkForSignals() {
    // logger.log('[ANALYSIS] Starting new check cycle for ALL symbols...');
    let allTickers = [];

    try {
      const response = await axios.get(ALL_TICKERS_URL);
      if (!response.data || !response.data.success || !response.data.data) {
        logger.warn('[API] Received invalid data structure from MEXC ticker API.');
        return;
      }
      allTickers = response.data.data;
    } catch (error) {
      logger.error(`[API] Failed to fetch tickers: ${error.message}`);
      return;
    }

    let processedCount = 0;
    const now = Date.now();

    for (const ticker of allTickers) {
      const volume24h = parseFloat(ticker.amount24);
      if (volume24h < config.bot.minVolumeUsdt) {
        continue;
      }

      if (!ticker.lastPrice || !ticker.fairPrice || !ticker.symbol) {
        continue;
      }

      processedCount++;

      const symbol = ticker.symbol.replace('_USDT', '');
      const lastPrice = ticker.lastPrice;
      const fairPrice = ticker.fairPrice;

      const result = calculateSpread(lastPrice, fairPrice);
      const lastState = this.signalState[symbol];

      if (result.spread > config.bot.minSpreadPercent) {
        const currentState = result.direction;

        if (!lastState || currentState !== lastState.direction) {
          this.handleSignal(symbol, result);
          this.signalState[symbol] = {
            direction: currentState,
            lastAlertTime: now,
          };
        } else if (lastState) {
          const timeSinceLastAlert = now - lastState.lastAlertTime;

          if (timeSinceLastAlert > config.bot.reAlertMs) {
            this.handleSpreadUpdate(symbol, result);
            this.signalState[symbol].lastAlertTime = now;
          } else {
          }
        }
      } else if (result.spread <= config.bot.spreadEndThreshold) {
        if (lastState) {
          this.handleSpreadEnd(symbol, result, lastState.direction);
          this.signalState[symbol] = null;
        }
      } else {
        if (lastState) {
          logger.log(`[STATE] ${symbol} is in neutral zone. Spread: ${result.spread.toFixed(2)}%`);
        }
      }
    }

    // logger.log(
    //   `[ANALYSIS] Received ${allTickers.length} symbols. Analyzed ${processedCount} symbols with volume > ${config.bot.minVolumeUsdt} USDT. Cycle complete.`
    // );
  }

  handleSignal(symbol, result) {
    const spreadFormatted = result.spread.toFixed(3);
    const symbolPair = `${symbol}`;
    const directionEmoji = result.direction === 'LONG' ? '🟢' : '🔴';

    const message = `
*${directionEmoji}${directionEmoji} ${result.direction} ${directionEmoji}${directionEmoji}*

\`${symbolPair}\`
\`${symbolPair}\`
\`${symbolPair}\`

*Spread:* \`${spreadFormatted}%\`

*Details:* ${result.details}
        `;

    logger.log(
      `[SIGNAL] Found spread for ${symbolPair}! Spread: ${spreadFormatted}% (${result.direction})`
    );
    telegramChannel.sendMessage(message);
  }

  handleSpreadUpdate(symbol, result) {
    const spreadFormatted = result.spread.toFixed(3);
    const symbolPair = `${symbol}`;
    const directionEmoji = result.direction === 'ЛОНГ' ? '📈' : '📉';

    const message = `
🔄 *Spread ACTIVE: ${result.direction} ${directionEmoji}* 🔄

*Pair:* \`${symbolPair}\`
*Spread:* \`${spreadFormatted}%\`

*Details:* ${result.details}
        `;

    logger.log(`[SIGNAL] Re-alerting for ${symbolPair}. Spread: ${spreadFormatted}%`);
    telegramChannel.sendMessage(message);
  }
  handleSpreadEnd(symbol, result) {
    const symbolPair = `${symbol}`;
    const spreadFormatted = result.spread.toFixed(3);

    logger.log(`[STATE] Spread for ${symbolPair} ended. Current: ${spreadFormatted}%`);

    const message = `
✅ *Spread ENDED* ✅

\`${symbolPair}\`
\`${symbolPair}\`
\`${symbolPair}\`

*Current Spread:* \`${spreadFormatted}%\` (below the treshhold of ${config.bot.minSpreadPercent}%)

*Last Details:* ${result.details}
        `;
    telegramChannel.sendMessage(message);
  }
  run() {
    logger.log(`Starting Last/Fair price tracker for ALL symbols.`);

    logger.log(`Starting analysis loop with interval: ${config.bot.checkIntervalMs}ms`);

    this.checkForSignals();

    setInterval(() => this.checkForSignals(), config.bot.checkIntervalMs);
  }
}

module.exports = new SignalGenerator();
