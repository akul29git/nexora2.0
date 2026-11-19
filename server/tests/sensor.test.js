process.env.API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('Sensor API', () => {
  const apiKey = 'test-api-key';

  test('GET /api/health should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('uptime');
  });

  test('GET /api/sensors should return fallback when no data', async () => {
    const res = await request(app).get('/api/sensors');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('source');
    expect(res.body.status).toBe('fallback');
    expect(res.body.source).toBe('fallback');
  });

  test('POST /api/sensors without API key should return 401', async () => {
    const res = await request(app)
      .post('/api/sensors')
      .send({ device_id: 'test', uptime_ms: 123 });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/sensors with invalid API key should return 401', async () => {
    const res = await request(app)
      .post('/api/sensors')
      .set('x-api-key', 'wrong-key')
      .send({ device_id: 'test', uptime_ms: 123 });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/sensors with invalid payload should return 400', async () => {
    const res = await request(app)
      .post('/api/sensors')
      .set('x-api-key', apiKey)
      .send({ invalid: 'data' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/sensors with valid payload should return 200', async () => {
    const validPayload = {
      device_id: 'esp32-01',
      uptime_ms: 123456,
      mpu6050: {
        ok: true,
        accel_x: 0.1,
        accel_y: -0.2,
        accel_z: 9.81,
        accel_magnitude: 9.81,
        pitch_deg: 0.5,
        roll_deg: -0.3,
        tilt_deg: 0.6
      },
      ultrasonic: {
        distance_cm: 45.2,
        obstacle_detected: false
      },
      sharp_ir: {
        voltage: 1.234,
        distance_cm: 44.8
      },
      gps_valid: true,
      gps_fallback: false,
      latitude: 28.7975,
      longitude: 77.5389,
      gps_speed_kmph: 5.2,
      emergency_button: false,
      crash_detected: false,
      wifi_rssi_dbm: -45
    };
    const res = await request(app)
      .post('/api/sensors')
      .set('x-api-key', apiKey)
      .send(validPayload);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/sensors after valid post should return ok status', async () => {
    const res = await request(app).get('/api/sensors');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.source).toBe('esp32');
  });
});