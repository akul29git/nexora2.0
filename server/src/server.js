require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const config = require('./config');

let server;

const startServer = () => {
  server = app.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`, {
      env: config.env,
      port: config.port
    });
  });

  server.on('error', (err) => {
    logger.error('Server error', { error: err.message });
    process.exit(1);
  });
};

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = server;
