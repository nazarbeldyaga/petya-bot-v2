function logMessage(level, message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

  if (level === 'error') {
    console.error(formattedMessage);
  } else {
    console.log(formattedMessage);
  }
}

const logger = {
  log: (message) => logMessage('info', message),
  warn: (message) => logMessage('warn', message),
  error: (message) => logMessage('error', message),
};

module.exports = logger;
