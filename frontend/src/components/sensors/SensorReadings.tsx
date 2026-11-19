import { cn } from '../../utils/helpers';
import { Badge } from '../ui/Badge';
import { formatNumber } from '../../utils/helpers';
import type { MPU6050Reading, UltrasonicReading, SharpIRReading } from '../../types/sensor';

interface SensorReadingCardProps {
  title: string;
  icon: React.ReactNode;
  reading: MPU6050Reading | UltrasonicReading | SharpIRReading | Record<string, unknown>;
  children: React.ReactNode;
  status?: 'ok' | 'stale' | 'fallback' | 'error';
  valid?: boolean;
}

export function SensorReadingCard({
  title,
  icon,
  reading,
  children,
  status,
  valid = (reading as any).ok ?? (reading as any).gps_valid ?? (reading as any).distance_cm !== null,
}: SensorReadingCardProps) {
  const isValid = valid;

  return (
    <div className={cn('card p-4', !isValid && 'opacity-60')}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            status === 'ok' && 'bg-green-50 text-green-600',
            status === 'stale' && 'bg-amber-50 text-amber-600',
            status === 'fallback' && 'bg-surface-100 text-surface-600',
            status === 'error' && 'bg-red-50 text-red-600',
            !status && 'bg-primary-50 text-primary-600'
          )}>
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-surface-900">{title}</h3>
            <Badge variant={isValid ? 'ok' : 'fallback'} size="sm">
              {isValid ? 'Valid' : 'Invalid'}
            </Badge>
          </div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

interface Vector3DProps {
  label: string;
  x: number | null;
  y: number | null;
  z: number | null;
  unit: string;
  precision?: number;
}

export function Vector3D({ label, x, y, z, unit, precision = 2 }: Vector3DProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-surface-500">{label}</span>
        <span className="font-mono text-surface-900">{unit}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <AxisValue axis="X" value={x} precision={precision} />
        <AxisValue axis="Y" value={y} precision={precision} />
        <AxisValue axis="Z" value={z} precision={precision} />
      </div>
    </div>
  );
}

interface AxisValueProps {
  axis: string;
  value: number | null;
  precision?: number;
}

function AxisValue({ axis, value, precision = 2 }: AxisValueProps) {
  return (
    <div className="bg-surface-50 rounded-lg p-3 text-center">
      <span className="text-xs text-surface-500">{axis}</span>
      <div className="font-mono text-lg text-surface-900 tabular-nums">
        {formatNumber(value, precision)}
      </div>
    </div>
  );
}

interface ScalarValueProps {
  label: string;
  value: number | null;
  unit: string;
  precision?: number;
  range?: { min: number; max: number };
  status?: 'ok' | 'stale' | 'fallback' | 'error';
}

export function ScalarValue({ label, value, unit, precision = 2, range, status }: ScalarValueProps) {
  const percentage = range && value !== null
    ? Math.max(0, Math.min(100, ((value - range.min) / (range.max - range.min)) * 100))
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-surface-500">{label}</span>
        <span className="font-mono text-xl text-surface-900 tabular-nums">
          {formatNumber(value, precision)} {unit}
        </span>
      </div>
      {range && value !== null && (
        <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              status === 'ok' && 'bg-green-500',
              status === 'stale' && 'bg-amber-500',
              status === 'fallback' && 'bg-surface-400',
              status === 'error' && 'bg-red-500',
              !status && 'bg-primary-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function GPSDisplay({ reading }: { reading: Record<string, unknown> }) {
  const gps_valid = reading.gps_valid as boolean;
  const gps_fallback = reading.gps_fallback as boolean;
  const latitude = reading.latitude as number | null;
  const longitude = reading.longitude as number | null;
  const gps_speed_kmph = reading.gps_speed_kmph as number | null;

  if (!gps_valid) {
    return (
      <div className="text-center py-4 text-surface-500">
        <p>No GPS fix (fallback)</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-50 rounded-lg p-3">
          <span className="text-xs text-surface-500 block">Latitude</span>
          <span className="font-mono text-lg text-surface-900">{formatNumber(latitude, 6)}°</span>
        </div>
        <div className="bg-surface-50 rounded-lg p-3">
          <span className="text-xs text-surface-500 block">Longitude</span>
          <span className="font-mono text-lg text-surface-900">{formatNumber(longitude, 6)}°</span>
        </div>
        <div className="bg-surface-50 rounded-lg p-3">
          <span className="text-xs text-surface-500 block">Speed</span>
          <span className="font-mono text-lg text-surface-900">{formatNumber(gps_speed_kmph, 1)} km/h</span>
        </div>
        <div className="bg-surface-50 rounded-lg p-3">
          <span className="text-xs text-surface-500 block">Mode</span>
          <span className="font-mono text-lg text-surface-900">{gps_fallback ? 'Fallback' : 'Live'}</span>
        </div>
      </div>
    </div>
  );
}

export function IRDistanceDisplay({ reading }: { reading: SharpIRReading }) {
  return (
    <div className="space-y-3">
      <ScalarValue
        label="Distance"
        value={reading.distance_cm}
        unit="cm"
        precision={1}
        range={{ min: 10, max: 80 }}
      />
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-200">
        <div className="bg-surface-50 rounded-lg p-3">
          <span className="text-xs text-surface-500 block">Voltage</span>
          <span className="font-mono text-lg text-surface-900">{formatNumber(reading.voltage, 3)} V</span>
        </div>
      </div>
    </div>
  );
}

export function UltrasonicDisplay({ reading }: { reading: UltrasonicReading }) {
  return (
    <div className="space-y-3">
      <ScalarValue
        label="Distance"
        value={reading.distance_cm}
        unit="cm"
        precision={1}
        range={{ min: 2, max: 400 }}
      />
      <div className="flex items-center justify-between text-sm pt-2 border-t border-surface-200">
        <span className="text-surface-500">Obstacle</span>
        <span className="font-mono text-lg text-surface-900">{reading.obstacle_detected ? 'YES' : 'NO'}</span>
      </div>
    </div>
  );
}

export function EmergencyDisplay({ reading }: { reading: Record<string, unknown> }) {
  const emergency_button = reading.emergency_button as boolean;
  const crash_detected = reading.crash_detected as boolean;

  return (
    <div className="space-y-3">
      <div className={cn(
        'p-4 rounded-lg text-center font-semibold',
        emergency_button || crash_detected
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-green-50 text-green-700 border border-green-200'
      )}>
        {emergency_button || crash_detected ? '🚨 EMERGENCY ACTIVE' : '✅ NORMAL'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-50 rounded-lg p-3 text-center">
          <span className="text-xs text-surface-500 block">SOS Button</span>
          <span className="font-mono text-lg text-surface-900">{emergency_button ? 'PRESSED' : 'NORMAL'}</span>
        </div>
        <div className="bg-surface-50 rounded-lg p-3 text-center">
          <span className="text-xs text-surface-500 block">Crash/Tilt</span>
          <span className="font-mono text-lg text-surface-900">{crash_detected ? 'DETECTED' : 'NORMAL'}</span>
        </div>
      </div>
    </div>
  );
}