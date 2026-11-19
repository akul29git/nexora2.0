const sensorController = require('../controllers/sensor.controller');
const apiKeyAuth = require('../middleware/apiKeyAuth');

const router = require('express').Router();

// POST /api/sensors - receive sensor data from ESP32 (requires API key)
router.post('/sensors', apiKeyAuth, sensorController.postSensorData);

// GET /api/sensors - get latest sensor data
router.get('/sensors', sensorController.getLatestSensorData);

// GET /api/health - get health status
router.get('/health', sensorController.getHealthStatus);

module.exports = router;
