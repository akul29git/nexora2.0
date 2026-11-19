import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';
import { Badge } from '../ui/Badge';
import { WifiOff, Activity, Clock, AlertCircle, CheckCircle, Satellite } from 'lucide-react';
import { formatTimestamp } from '../../utils/helpers';

interface SensorStatusProps extends HTMLAttributes<HTMLDivElement> {
  status: 'ok' | 'stale' | 'fallback' | 'error' | 'loading';
  source: 'esp32' | 'cache' | 'fallback';
  ageMs: number | null;
  lastContact: string | null;
  connected: boolean;
  system?: {
    mpuReady: boolean;
    gpsReady: boolean;
    wifiConnected: boolean;
  };
}

export function SensorStatus({
  className,
  status,
  source,
  ageMs,
  lastContact,
  connected,
  system,
  ...props
}: SensorStatusProps) {
  if (status === 'loading') {
    return (
      <div className={cn('flex items-center gap-3', className)} {...props}>
        <div className="flex items-center gap-2 text-surface-500">
          <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-sm font-medium">Connecting...</span>
        </div>
      </div>
    );
  }

  const statusConfig = {
    ok: { label: 'Live', variant: 'ok' as const, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    stale: { label: 'Stale', variant: 'stale' as const, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    fallback: { label: 'Fallback', variant: 'fallback' as const, icon: WifiOff, color: 'text-surface-600', bg: 'bg-surface-100' },
    error: { label: 'Error', variant: 'error' as const, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)} {...props}>
      <div className={cn('flex items-center gap-2', statusConfig.bg, 'px-3 py-1.5 rounded-full')}>
        <Icon className={cn('h-4 w-4', statusConfig.color)} aria-hidden="true" />
        <Badge variant={statusConfig.variant} dot>
          {statusConfig.label}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-surface-500">
        <span className="flex items-center gap-1.5">
          <span className="font-medium text-surface-700">Source:</span>
          <span className="font-mono text-surface-900 capitalize">{source}</span>
        </span>

        {ageMs !== null && (
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Age: <span className="font-mono text-surface-900">{formatAge(ageMs)}</span></span>
          </span>
        )}

        {lastContact && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Last: <span className="font-mono text-surface-900">{formatTimestamp(lastContact)}</span></span>
          </span>
        )}

        <span className={cn('flex items-center gap-1.5', connected ? 'text-green-600' : 'text-red-600')}>
          <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-green-500' : 'bg-red-500')} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </span>

        {system && (
          <span className="flex items-center gap-1.5 text-surface-500">
            <Satellite className="h-3.5 w-3.5" />
            <span>MPU: {system.mpuReady ? '✓' : '✗'}</span>
            <span className="mx-1">|</span>
            <span>GPS: {system.gpsReady ? '✓' : '✗'}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function formatAge(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}