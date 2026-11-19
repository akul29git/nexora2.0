import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  overlay?: boolean;
}

export function LoadingSpinner({
  className,
  size = 'md',
  label,
  overlay = false,
  ...props
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const content = (
    <div className={cn('flex flex-col items-center gap-3', className)} {...props}>
      <div
        className={cn(
          'rounded-full border-surface-200 border-t-primary-600 animate-spin',
          sizes[size]
        )}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <span className="text-sm text-surface-500">{label}</span>}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="bg-white rounded-xl p-6 shadow-lg">{content}</div>
      </div>
    );
  }

  return content;
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-200 rounded',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card p-6 animate-pulse space-y-4', className)} {...props}>
      <div className="h-4 w-3/4 bg-surface-200 rounded" />
      <div className="h-8 w-1/2 bg-surface-200 rounded" />
      <div className="h-4 w-full bg-surface-200 rounded" />
      <div className="h-4 w-2/3 bg-surface-200 rounded" />
    </div>
  );
}