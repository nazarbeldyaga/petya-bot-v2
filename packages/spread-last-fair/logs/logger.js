const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'bot.txt');
function logMessage(level, message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

  if (level === 'error') {
    console.error(formattedMessage);
  } else {
    console.log(formattedMessage);
  }

  fs.appendFile(logFilePath, formattedMessage + '\n', (err) => {
    if (err) {
      console.error('CRITICAL: Failed to write to log file:', err);
    }
  });
}

const logger = {
  log: (message) => logMessage('info', message),
  warn: (message) => logMessage('warn', message),
  error: (message) => logMessage('error', message),
};

module.exports = logger;
