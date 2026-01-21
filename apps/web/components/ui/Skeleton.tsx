'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-secondary',
        variants[variant],
        animations[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Preset skeletons for common use cases
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2">
          <Skeleton width={100} height={16} variant="rounded" />
          <Skeleton width={60} height={12} variant="rounded" />
        </div>
      </div>
      <Skeleton height={100} variant="rounded" />
      <div className="flex gap-4">
        <Skeleton className="flex-1" height={32} variant="rounded" />
        <Skeleton className="flex-1" height={32} variant="rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-3">
        <Skeleton width={40} height={16} variant="rounded" />
        <Skeleton className="flex-1" height={16} variant="rounded" />
        <Skeleton width={80} height={16} variant="rounded" />
        <Skeleton width={80} height={16} variant="rounded" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-secondary/30 rounded-lg">
          <Skeleton width={40} height={40} variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton width={120} height={16} variant="rounded" />
            <Skeleton width={80} height={12} variant="rounded" />
          </div>
          <Skeleton width={80} height={16} variant="rounded" />
          <Skeleton width={80} height={16} variant="rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('card space-y-4', className)}>
      <div className="flex justify-between">
        <Skeleton width={120} height={20} variant="rounded" />
        <div className="flex gap-2">
          <Skeleton width={40} height={24} variant="rounded" />
          <Skeleton width={40} height={24} variant="rounded" />
          <Skeleton width={40} height={24} variant="rounded" />
        </div>
      </div>
      <Skeleton height={200} variant="rounded" />
    </div>
  );
}

export function SkeletonTokenList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
          <Skeleton width={40} height={40} variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton width={80} height={16} variant="rounded" />
            <Skeleton width={120} height={12} variant="rounded" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton width={60} height={16} variant="rounded" />
            <Skeleton width={40} height={12} variant="rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card space-y-2">
          <Skeleton width={24} height={24} variant="circular" />
          <Skeleton width={80} height={12} variant="rounded" />
          <Skeleton width={60} height={20} variant="rounded" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
