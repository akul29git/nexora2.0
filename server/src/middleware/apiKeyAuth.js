const config = require('../config');

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required',
      message: 'Missing x-api-key header'
    });
  }

  if (apiKey !== config.apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  next();
};

module.exports = apiKeyAuth;
