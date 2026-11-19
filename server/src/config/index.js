module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiKey: process.env.API_KEY,
  staleAfterMs: parseInt(process.env.STALE_AFTER_MS || '5000', 10),
  rateLimit: parseInt(process.env.RATE_LIMIT || '100', 10),
  logLevel: process.env.LOG_LEVEL || 'info'
};
