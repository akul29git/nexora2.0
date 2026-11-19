import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';
import { Card } from './Card';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  status?: 'ok' | 'stale' | 'fallback' | 'error';
}

export function StatCard({
  className,
  value,
  label,
  trend,
  icon,
  status,
  children,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn('stat-card', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="stat-label">{label}</p>
          <p className="stat-value tabular-nums">{value}</p>
          {trend && (
            <div className="stat-trend">
              <span className={cn(
                trend.value > 0 ? 'trend-up' :
                trend.value < 0 ? 'trend-down' : 'trend-neutral'
              )}>
                {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'}
                {Math.abs(trend.value).toFixed(1)}
              </span>
              {trend.label && <span className="text-surface-500">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex-shrink-0 p-3 rounded-xl',
            status === 'ok' && 'bg-green-50 text-green-600',
            status === 'stale' && 'bg-amber-50 text-amber-600',
            status === 'fallback' && 'bg-surface-100 text-surface-600',
            status === 'error' && 'bg-red-50 text-red-600',
            !status && 'bg-primary-50 text-primary-600'
          )}>
            {icon}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}