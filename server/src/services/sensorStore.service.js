const config = require('../config');
const logger = require('../utils/logger');

class SensorStoreService {
  constructor() {
    this.lastValidReading = null;
    this.lastContactTime = null;
    this.lastDeviceTimestamp = null;
    this.deviceRebootedAt = null;
  }

  getFallbackReading() {
    const now = new Date().toISOString();
    return {
      status: 'fallback',
      source: 'fallback',
      deviceId: 'esp32-01',
      timestamp: now,
      deviceTimestamp: 0,
      ageMs: 0,
      device_id: 'esp32-01',
      uptime_ms: 0,
      mpu6050: {
        ok: false,
        accel_x: null,
        accel_y: null,
        accel_z: null,
        accel_magnitude: null,
        pitch_deg: null,
        roll_deg: null,
        tilt_deg: null
      },
      ultrasonic: {
        distance_cm: null,
        obstacle_detected: false
      },
      sharp_ir: {
        voltage: null,
        distance_cm: null
      },
      gps_valid: false,
      gps_fallback: true,
      latitude: 28.7975,
      longitude: 77.5389,
      gps_speed_kmph: 0,
      emergency_button: false,
      crash_detected: false,
      wifi_rssi_dbm: 0
    };
  }

  updateReading(data) {
    const now = Date.now();
    const serverTime = new Date(now).toISOString();

    if (
      this.lastDeviceTimestamp !== null &&
      data.uptime_ms < this.lastDeviceTimestamp
    ) {
      logger.info('Device reboot detected', {
        previous: this.lastDeviceTimestamp,
        current: data.uptime_ms
      });
      this.deviceRebootedAt = now;
    }

    this.lastDeviceTimestamp = data.uptime_ms;
    this.lastValidReading = {
      ...data,
      serverTimestamp: now,
      serverTimeIso: serverTime
    };
    this.lastContactTime = now;
  }

  getLatestReading() {
    const now = Date.now();

    if (this.lastValidReading === null || this.lastContactTime === null) {
      logger.warn('No cached data available, returning fallback');
      return this.getFallbackReading();
    }

    const ageMs = now - this.lastContactTime;

    if (ageMs > config.staleAfterMs) {
      logger.warn('Data is stale, returning cache with stale status', {
        ageMs,
        staleAfterMs: config.staleAfterMs
      });
      return {
        status: 'stale',
        source: 'cache',
        deviceId: this.lastValidReading.device_id || 'esp32-01',
        timestamp: new Date(now).toISOString(),
        deviceTimestamp: this.lastValidReading.uptime_ms,
        ageMs,
        ...this.lastValidReading
      };
    }

    return {
      status: 'ok',
      source: 'esp32',
      deviceId: this.lastValidReading.device_id || 'esp32-01',
      timestamp: new Date(now).toISOString(),
      deviceTimestamp: this.lastValidReading.uptime_ms,
      ageMs,
      ...this.lastValidReading
    };
  }

  getHealthStatus() {
    const now = Date.now();
    const uptime = process.uptime();

    if (this.lastContactTime === null) {
      return {
        status: 'unhealthy',
        uptime,
        lastEsp32Contact: null,
        connected: false,
        ageMs: null
      };
    }

    const ageMs = now - this.lastContactTime;
    const connected = ageMs <= config.staleAfterMs;

    return {
      status: connected ? 'healthy' : 'degraded',
      uptime,
      lastEsp32Contact: new Date(this.lastContactTime).toISOString(),
      connected,
      ageMs
    };
  }
}

const sensorStore = new SensorStoreService();
module.exports = sensorStore;