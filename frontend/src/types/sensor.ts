export interface MPU6050Reading {
  ok: boolean;
  accel_x: number | null;
  accel_y: number | null;
  accel_z: number | null;
  accel_magnitude: number | null;
  pitch_deg: number | null;
  roll_deg: number | null;
  tilt_deg: number | null;
}

export interface UltrasonicReading {
  distance_cm: number | null;
  obstacle_detected: boolean;
}

export interface SharpIRReading {
  voltage: number | null;
  distance_cm: number | null;
}

export interface SensorDataResponse {
  status: 'ok' | 'stale' | 'fallback';
  source: 'esp32' | 'cache' | 'fallback';
  deviceId: string;
  timestamp: string;
  deviceTimestamp: number;
  ageMs: number;
  device_id: string;
  uptime_ms: number;
  mpu6050: MPU6050Reading;
  ultrasonic: UltrasonicReading;
  sharp_ir: SharpIRReading;
  gps_valid: boolean;
  gps_fallback: boolean;
  latitude: number | null;
  longitude: number | null;
  gps_speed_kmph: number | null;
  emergency_button: boolean;
  crash_detected: boolean;
  wifi_rssi_dbm: number;
  [key: string]: unknown;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastEsp32Contact: string | null;
  connected: boolean;
  ageMs: number | null;
}

export type StatusType = 'ok' | 'stale' | 'fallback' | 'error';
export type HealthStatusType = 'healthy' | 'degraded' | 'unhealthy';
export type SourceType = 'esp32' | 'cache' | 'fallback';

export const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bgColor: string }> = {
  ok: { label: 'Live', color: 'text-green-700', bgColor: 'bg-green-50' },
  stale: { label: 'Stale', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  fallback: { label: 'Fallback', color: 'text-surface-700', bgColor: 'bg-surface-100' },
  error: { label: 'Error', color: 'text-red-700', bgColor: 'bg-red-50' },
};

export const HEALTH_STATUS_CONFIG: Record<'healthy' | 'degraded' | 'unhealthy', { label: string; color: string; bgColor: string }> = {
  healthy: { label: 'Healthy', color: 'text-green-700', bgColor: 'bg-green-50' },
  degraded: { label: 'Degraded', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  unhealthy: { label: 'Unhealthy', color: 'text-red-700', bgColor: 'bg-red-50' },
};

export const SOURCE_LABELS: Record<SourceType, string> = {
  esp32: 'ESP32',
  cache: 'Cache',
  fallback: 'Fallback',
};

export const SENSOR_UNITS = {
  accel: 'm/s²',
  gyro: '°/s',
  temperature: '°C',
  distance: 'cm',
  voltage: 'V',
  gpsLatLon: '°',
  gpsAlt: 'm',
  gpsSpeed: 'km/h',
  signal: '',
} as const;

export const SENSOR_RANGES = {
  accel: { min: -160, max: 160 },
  gyro: { min: -2000, max: 2000 },
  temperature: { min: -40, max: 85 },
  irDistance: { min: 10, max: 80 },
  gpsSatellites: { min: 0, max: 50 },
} as const;