'use client';

import { useRef, useEffect, ReactNode, useCallback } from 'react';
import { getFocusableElements } from '@/lib/a11y';
import { cn } from '@/lib/utils';

export interface FocusTrapProps {
  /** Content to trap focus within */
  children: ReactNode;
  /** Whether the focus trap is active */
  active: boolean;
  /** Auto-focus first element when activated */
  autoFocus?: boolean;
  /** Return focus to previously focused element when deactivated */
  returnFocus?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom role for the container */
  role?: string;
  /** aria-label for the container */
  'aria-label'?: string;
}

/**
 * Traps focus within a container - useful for modals and dialogs.
 * When active, Tab/Shift+Tab cycles through focusable elements within the container.
 */
export function FocusTrap({
  children,
  active,
  autoFocus = false,
  returnFocus = false,
  className,
  role = 'group',
  'aria-label': ariaLabel,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previously focused element
  useEffect(() => {
    if (active && returnFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [active, returnFocus]);

  // Auto-focus first element
  useEffect(() => {
    if (!active || !autoFocus || !containerRef.current) return;

    const focusable = getFocusableElements(containerRef.current);
    if (focusable.length > 0) {
      // Small delay to ensure element is ready
      requestAnimationFrame(() => {
        focusable[0].focus();
      });
    }
  }, [active, autoFocus]);

  // Return focus on deactivation
  useEffect(() => {
    if (!active && returnFocus && previousFocusRef.current) {
      requestAnimationFrame(() => {
        previousFocusRef.current?.focus();
      });
    }
  }, [active, returnFocus]);

  // Handle Tab key to trap focus
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || event.key !== 'Tab' || !containerRef.current) return;

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      // Shift+Tab on first element -> go to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab on last element -> go to first
      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }
    },
    [active]
  );

  // Attach keydown listener
  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown as EventListener);
    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [active, handleKeyDown]);

  return (
    <div
      ref={containerRef}
      role={role}
      aria-label={ariaLabel}
      className={cn(className)}
    >
      {children}
    </div>
  );
}

export default FocusTrap;
