'use client';

import { cn } from '@/lib/utils';

export interface SkipLinkProps {
  /** Target element ID (with #) */
  target?: string;
  /** Link label text */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skip link for keyboard navigation - allows users to skip to main content.
 * Visually hidden until focused.
 */
export function SkipLink({
  target = '#main-content',
  label = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={target}
      className={cn(
        'sr-only',
        'focus:not-sr-only',
        'focus:absolute',
        'focus:top-4',
        'focus:left-4',
        'focus:z-[100]',
        'focus:px-4',
        'focus:py-2',
        'focus:bg-primary',
        'focus:text-primary-foreground',
        'focus:rounded-lg',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-ring',
        'focus:ring-offset-2',
        'focus:ring-offset-background',
        'transition-all',
        className
      )}
    >
      {label}
    </a>
  );
}

export default SkipLink;
