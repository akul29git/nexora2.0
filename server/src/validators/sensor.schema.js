const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, strict: false });

const sensorSchema = {
  type: 'object',
  properties: {
    device_id: { type: 'string', minLength: 1 },
    uptime_ms: { type: 'number', minimum: 0 },
    mpu6050: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        accel_x: { type: 'number', minimum: -160, maximum: 160 },
        accel_y: { type: 'number', minimum: -160, maximum: 160 },
        accel_z: { type: 'number', minimum: -160, maximum: 160 },
        accel_magnitude: { type: 'number', minimum: 0 },
        pitch_deg: { type: 'number' },
        roll_deg: { type: 'number' },
        tilt_deg: { type: 'number', minimum: 0 }
      },
      required: ['ok', 'accel_x', 'accel_y', 'accel_z', 'accel_magnitude', 'pitch_deg', 'roll_deg', 'tilt_deg'],
      additionalProperties: false
    },
    ultrasonic: {
      type: 'object',
      properties: {
        distance_cm: { type: 'number', minimum: -1 },
        obstacle_detected: { type: 'boolean' }
      },
      required: ['distance_cm', 'obstacle_detected'],
      additionalProperties: false
    },
    sharp_ir: {
      type: 'object',
      properties: {
        voltage: { type: 'number', minimum: 0, maximum: 5 },
        distance_cm: { type: 'number', minimum: -1 }
      },
      required: ['voltage', 'distance_cm'],
      additionalProperties: false
    },
    gps_valid: { type: 'boolean' },
    gps_fallback: { type: 'boolean' },
    latitude: { type: 'number', minimum: -90, maximum: 90 },
    longitude: { type: 'number', minimum: -180, maximum: 180 },
    gps_speed_kmph: { type: 'number', minimum: 0 },
    emergency_button: { type: 'boolean' },
    crash_detected: { type: 'boolean' },
    wifi_rssi_dbm: { type: 'integer' }
  },
  required: ['device_id', 'uptime_ms', 'mpu6050', 'ultrasonic', 'sharp_ir', 'gps_valid', 'gps_fallback', 'latitude', 'longitude', 'gps_speed_kmph', 'emergency_button', 'crash_detected', 'wifi_rssi_dbm'],
  additionalProperties: false
};

const validateSensorData = ajv.compile(sensorSchema);

module.exports = {
  validateSensorData,
  sensorSchema
};