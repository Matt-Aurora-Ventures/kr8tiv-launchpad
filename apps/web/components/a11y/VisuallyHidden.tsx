'use client';

import { cn } from '@/lib/utils';
import { ElementType, ReactNode, ComponentPropsWithoutRef } from 'react';

export interface VisuallyHiddenProps<T extends ElementType = 'span'> {
  /** Content to visually hide (still accessible to screen readers) */
  children: ReactNode;
  /** HTML element to render */
  as?: T;
  /** If true, element becomes visible when focused */
  focusable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

type Props<T extends ElementType> = VisuallyHiddenProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof VisuallyHiddenProps<T>>;

/**
 * Visually hides content while keeping it accessible to screen readers.
 * Useful for providing additional context to assistive technologies.
 */
export function VisuallyHidden<T extends ElementType = 'span'>({
  children,
  as,
  focusable = false,
  className,
  ...props
}: Props<T>) {
  const Component = as || 'span';

  return (
    <Component
      className={cn(
        'sr-only',
        focusable && 'focus:not-sr-only focus:absolute focus:z-50',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default VisuallyHidden;
