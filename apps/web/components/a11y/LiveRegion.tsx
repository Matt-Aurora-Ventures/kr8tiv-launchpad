'use client';

import { cn } from '@/lib/utils';

export interface LiveRegionProps {
  /** Message to announce */
  message: string;
  /** Announcement priority: polite waits, assertive interrupts */
  priority?: 'polite' | 'assertive';
  /** Whether the entire region should be read (true) or just changes (false) */
  atomic?: boolean;
  /** Custom ID for the region */
  id?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ARIA live region for announcing dynamic content changes to screen readers.
 * Use 'polite' for non-urgent updates, 'assertive' for important/time-sensitive.
 */
export function LiveRegion({
  message,
  priority = 'polite',
  atomic = true,
  id,
  className,
}: LiveRegionProps) {
  return (
    <div
      id={id}
      role="status"
      aria-live={priority}
      aria-atomic={atomic.toString() as 'true' | 'false'}
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  );
}

export default LiveRegion;
