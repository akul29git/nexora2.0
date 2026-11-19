import { useState, useEffect, useCallback } from 'react';
import { useSensorData, useHealth } from '../hooks/useSensorData';
import { SensorStatus } from './sensors/SensorStatus';
import { SensorReadingCard, Vector3D, ScalarValue, GPSDisplay, IRDistanceDisplay, UltrasonicDisplay, EmergencyDisplay } from './sensors/SensorReadings';
import { SensorChart, CHART_COLOR_PALETTES } from './charts/SensorChart';
import { Card } from './ui/Card';
import { SkeletonCard } from './ui/LoadingSpinner';
import { ErrorBoundary } from './ui/ErrorBoundary';
import {
  Cpu,
  Satellite,
  Radio,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  Shield,
  Zap,
} from 'lucide-react';
import { formatUptime } from '../utils/helpers';
import type { SensorDataResponse, MPU6050Reading } from '../types/sensor';
import { cn } from '../utils/helpers';

const POLL_INTERVAL = 2000;
const CHART_HISTORY_SIZE = 50;

export function Dashboard() {
  const [chartHistory, setChartHistory] = useState<SensorDataResponse[]>([]);

  const { data: sensorData, isLoading, error, refetch } = useSensorData(POLL_INTERVAL);
  const { data: health } = useHealth(5000);

  useEffect(() => {
    if (sensorData) {
      setChartHistory((prev) => {
        const next = [...prev, sensorData];
        return next.slice(-CHART_HISTORY_SIZE);
      });
    }
  }, [sensorData]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={`chart-${i}`} className="h-[260px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={`sensor-${i}`} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => <SkeletonCard key={`sensor2-${i}`} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 mb-2">Failed to load data</h2>
        <p className="text-surface-500 mb-6 max-w-md">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button onClick={handleRefresh} className="btn-primary gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const status = sensorData?.status || 'error';
  const source = sensorData?.source || 'fallback';
  const ageMs = sensorData?.ageMs ?? null;
  const lastContact = health?.lastEsp32Contact ?? null;
  const connected = health?.connected ?? false;
  const uptime = health?.uptime ?? 0;
  const system = sensorData;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Nexora2 Dashboard</h1>
            <p className="text-surface-500 mt-1">Real-time IoT Sensor Monitoring</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SensorStatus
              status={status}
              source={source}
              ageMs={ageMs}
              lastContact={lastContact}
              connected={connected}
              system={system ? { mpuReady: system.mpu6050.ok, gpsReady: system.gps_valid, wifiConnected: true } : undefined}
            />
            <button
              onClick={handleRefresh}
              className="btn-ghost p-2"
              aria-label="Refresh data"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardItem
            label="Device Status"
            value={status === 'ok' ? 'Online' : status === 'stale' ? 'Stale' : 'Offline'}
            icon={status === 'ok' ? <CheckCircle className="h-5 w-5" /> : status === 'stale' ? <AlertTriangle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            status={status}
            trend={ageMs ? { value: -ageMs / 1000, label: 'age' } : undefined}
          />
          <StatCardItem
            label="Uptime"
            value={formatUptime(uptime)}
            icon={<Activity className="h-5 w-5" />}
            status="ok"
          />
          <StatCardItem
            label="Data Age"
            value={ageMs ? `${(ageMs / 1000).toFixed(1)}s` : '—'}
            icon={<Activity className="h-5 w-5" />}
            status={ageMs !== null && ageMs > 5000 ? 'stale' : 'ok'}
          />
          <StatCardItem
            label="Emergency"
            value={sensorData?.emergency_button || sensorData?.crash_detected ? 'ACTIVE' : 'Normal'}
            icon={<Shield className="h-5 w-5" />}
            status={sensorData?.emergency_button || sensorData?.crash_detected ? 'error' : 'ok'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SensorChart
            title="Acceleration (m/s²)"
            data={chartHistory}
            keys={['mpu6050.accel_x', 'mpu6050.accel_y', 'mpu6050.accel_z']}
            colors={[...CHART_COLOR_PALETTES.accel]}
            unit="m/s²"
            yDomain={[-20, 20]}
          />
          <SensorChart
            title="Tilt Angles (°)"
            data={chartHistory}
            keys={['mpu6050.pitch_deg', 'mpu6050.roll_deg', 'mpu6050.tilt_deg']}
            colors={[...CHART_COLOR_PALETTES.gyro]}
            unit="°"
            yDomain={[-180, 180]}
          />
          <SensorChart
            title="Distance Sensors (cm)"
            data={chartHistory}
            keys={['ultrasonic.distance_cm', 'sharp_ir.distance_cm']}
            colors={[...CHART_COLOR_PALETTES.distance]}
            unit="cm"
            yDomain={[0, 100]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ErrorBoundary fallback={<SensorErrorFallback title="MPU6050 IMU" />}>
            <SensorReadingCard
              title="MPU6050 IMU"
              icon={<Cpu className="h-5 w-5" />}
              reading={sensorData?.mpu6050 as MPU6050Reading}
              status={status}
            >
              <div className="space-y-4">
                <Vector3D
                  label="Acceleration"
                  x={sensorData?.mpu6050.accel_x ?? null}
                  y={sensorData?.mpu6050.accel_y ?? null}
                  z={sensorData?.mpu6050.accel_z ?? null}
                  unit="m/s²"
                />
                <Vector3D
                  label="Orientation"
                  x={sensorData?.mpu6050.pitch_deg ?? null}
                  y={sensorData?.mpu6050.roll_deg ?? null}
                  z={sensorData?.mpu6050.tilt_deg ?? null}
                  unit="°"
                  precision={1}
                />
                <ScalarValue
                  label="Accel Magnitude"
                  value={sensorData?.mpu6050.accel_magnitude ?? null}
                  unit="m/s²"
                  precision={2}
                  range={{ min: 0, max: 20 }}
                  status={status}
                />
              </div>
            </SensorReadingCard>
          </ErrorBoundary>

          <ErrorBoundary fallback={<SensorErrorFallback title="NEO-6M GPS" />}>
            <SensorReadingCard
              title="NEO-6M GPS"
              icon={<Satellite className="h-5 w-5" />}
              reading={sensorData as any}
              status={status}
              valid={sensorData?.gps_valid}
            >
              <GPSDisplay reading={sensorData as any} />
            </SensorReadingCard>
          </ErrorBoundary>

          <ErrorBoundary fallback={<SensorErrorFallback title="Sharp GP2Y0A21" />}>
            <SensorReadingCard
              title="Sharp GP2Y0A21 IR Distance"
              icon={<Radio className="h-5 w-5" />}
              reading={sensorData?.sharp_ir as any}
              status={status}
              valid={sensorData?.sharp_ir?.distance_cm !== null && sensorData?.sharp_ir?.distance_cm !== undefined}
            >
              <IRDistanceDisplay reading={sensorData?.sharp_ir as any} />
            </SensorReadingCard>
          </ErrorBoundary>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary fallback={<SensorErrorFallback title="Ultrasonic HC-SR04" />}>
            <SensorReadingCard
              title="Ultrasonic HC-SR04"
              icon={<Radio className="h-5 w-5" />}
              reading={sensorData?.ultrasonic as any}
              status={status}
              valid={sensorData?.ultrasonic?.distance_cm !== null && sensorData?.ultrasonic?.distance_cm !== undefined}
            >
              <UltrasonicDisplay reading={sensorData?.ultrasonic as any} />
            </SensorReadingCard>
          </ErrorBoundary>

          <ErrorBoundary fallback={<SensorErrorFallback title="Emergency System" />}>
            <SensorReadingCard
              title="Emergency System"
              icon={<Zap className="h-5 w-5" />}
              reading={sensorData as any}
              status={status}
              valid={true}
            >
              <EmergencyDisplay reading={sensorData as any} />
            </SensorReadingCard>
          </ErrorBoundary>
        </div>

        <div className="card p-6">
          <h3 className="font-medium text-surface-900 mb-4">Raw JSON Response</h3>
          <div className="bg-surface-900 rounded-lg p-4 overflow-x-auto font-mono text-xs text-green-300 max-h-64">
            <pre>{JSON.stringify(sensorData, null, 2)}</pre>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

interface StatCardItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  status: 'ok' | 'stale' | 'fallback' | 'error';
  trend?: { value: number; label?: string };
}

function StatCardItem({ label, value, icon, status, trend }: StatCardItemProps) {
  return (
    <Card className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
          {trend && (
            <div className="stat-trend">
              <span className={trend.value > 0 ? 'trend-up' : trend.value < 0 ? 'trend-down' : 'trend-neutral'}>
                {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'}
                {Math.abs(trend.value).toFixed(1)}
              </span>
              <span className="text-surface-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex-shrink-0 p-3 rounded-xl',
          status === 'ok' && 'bg-green-50 text-green-600',
          status === 'stale' && 'bg-amber-50 text-amber-600',
          status === 'fallback' && 'bg-surface-100 text-surface-600',
          status === 'error' && 'bg-red-50 text-red-600'
        )}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function SensorErrorFallback({ title }: { title: string }) {
  return (
    <Card className="p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-surface-300 mx-auto mb-3" />
      <h4 className="font-medium text-surface-900">{title}</h4>
      <p className="text-surface-500 text-sm mt-1">Failed to load sensor data</p>
    </Card>
  );
}