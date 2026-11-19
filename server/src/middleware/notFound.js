const notFound = (req, res, _next) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route ' + req.originalUrl + ' not found'
  });
};

module.exports = notFound;
