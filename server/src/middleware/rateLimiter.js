const rateLimit = require('express-rate-limit');
const config = require('../config');

const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.rateLimit,
  message: {
    error: 'Too many requests, please try again later.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = rateLimiter;
