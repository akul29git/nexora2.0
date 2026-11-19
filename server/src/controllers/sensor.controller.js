const sensorStore = require('../services/sensorStore.service');
const { validateSensorData } = require('../validators/sensor.schema');
const logger = require('../utils/logger');

/**
 * POST /api/sensors - Receive sensor data from ESP32
 */
const postSensorData = (req, res, next) => {
  try {
    // Validate incoming data against schema
    const isValid = validateSensorData(req.body);

    if (!isValid) {
      const errors = validateSensorData.errors;
      logger.warn('Invalid sensor data received', { errors });
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Sensor data does not match required schema',
        details: errors
      });
    }

    // Additional validation: reject NaN and Infinity
    const checkForNaN = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkForNaN(obj[key])) {
            return true;
          }
        } else if (typeof obj[key] === 'number') {
          if (isNaN(obj[key]) || !isFinite(obj[key])) {
            return true;
          }
        }
      }
      return false;
    };

    if (checkForNaN(req.body)) {
      logger.warn('Invalid sensor data: contains NaN or Infinity');
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Sensor data contains NaN or Infinity values'
      });
    }

    // Update store with valid reading
    sensorStore.updateReading(req.body);

    logger.info('Sensor data received successfully', {
      deviceId: req.body.deviceId,
      deviceTimestamp: req.body.deviceTimestamp
    });

    res.status(200).json({
      message: 'Data received successfully',
      status: 'ok'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sensors - Get latest sensor data
 */
const getLatestSensorData = (req, res) => {
  const data = sensorStore.getLatestReading();
  res.status(200).json(data);
};

/**
 * GET /api/health - Get health status
 */
const getHealthStatus = (req, res) => {
  const health = sensorStore.getHealthStatus();
  res.status(200).json(health);
};

module.exports = {
  postSensorData,
  getLatestSensorData,
  getHealthStatus
};
