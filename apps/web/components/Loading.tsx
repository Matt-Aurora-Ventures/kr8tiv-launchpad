'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Basic Spinner
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}

// Full Page Loading
interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="text-center">
        <Spinner size="xl" />
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Section Loading
interface SectionLoadingProps {
  message?: string;
  className?: string;
}

export function SectionLoading({ message, className }: SectionLoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Spinner size="lg" />
      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

// Button Loading
interface ButtonLoadingProps {
  className?: string;
}

export function ButtonLoading({ className }: ButtonLoadingProps) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

// Inline Loading
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ text = 'Loading', className }: InlineLoadingProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-muted-foreground', className)}>
      <Spinner size="sm" />
      {text}
    </span>
  );
}

// Dots Loading Animation
export function DotsLoading({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

// Pulse Loading (for cards/content)
interface PulseLoadingProps {
  lines?: number;
  className?: string;
}

export function PulseLoading({ lines = 3, className }: PulseLoadingProps) {
  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-secondary rounded"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

// Shimmer Loading Effect
interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ isLoading, children, message, className }: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <Spinner size="lg" />
            {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// Progress Loading
interface ProgressLoadingProps {
  progress: number;
  message?: string;
  className?: string;
}

export function ProgressLoading({ progress, message, className }: ProgressLoadingProps) {
  return (
    <div className={cn('w-full', className)}>
      {message && <p className="text-sm text-muted-foreground mb-2">{message}</p>}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(progress)}%</p>
    </div>
  );
}

export default Spinner;
