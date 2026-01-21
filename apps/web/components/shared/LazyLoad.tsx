'use client';

import { ReactNode, Suspense, lazy, ComponentType } from 'react';
import { useLazyLoad } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface LazyLoadProps {
  children: ReactNode;
  /** Placeholder to show before content loads */
  placeholder?: ReactNode;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Additional className */
  className?: string;
  /** Minimum height to prevent layout shift */
  minHeight?: number | string;
}

/**
 * Loading skeleton placeholder
 */
export function LoadingSkeleton({
  className,
  height = 200,
}: {
  className?: string;
  height?: number | string;
}) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-[length:200%_100%] rounded-lg',
        className
      )}
      style={{
        height,
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

/**
 * Lazy load wrapper - only renders children when they enter the viewport
 * Reduces initial render time and memory usage for off-screen content
 *
 * @example
 * <LazyLoad placeholder={<Skeleton height={200} />}>
 *   <ExpensiveComponent />
 * </LazyLoad>
 */
export function LazyLoad({
  children,
  placeholder,
  rootMargin = '200px',
  className,
  minHeight,
}: LazyLoadProps) {
  const { ref, shouldLoad } = useLazyLoad(rootMargin);

  return (
    <div
      ref={ref}
      className={className}
      style={minHeight ? { minHeight } : undefined}
    >
      {shouldLoad ? (
        children
      ) : (
        placeholder || <LoadingSkeleton height={minHeight || 200} />
      )}
    </div>
  );
}

/**
 * Create a lazily loaded component with Suspense boundary
 * Useful for code-splitting large components
 *
 * @example
 * const LazyChart = createLazyComponent(() => import('./Chart'));
 * // Usage: <LazyChart data={data} />
 */
export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Wrapper for components that should only render on client
 * Prevents hydration mismatches for client-only features
 */
export function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { ref, shouldLoad } = useLazyLoad('0px');

  // Using intersection observer with 0px margin means it loads
  // immediately when in viewport, but gives us client-side control
  return (
    <div ref={ref}>
      {shouldLoad ? children : (fallback || null)}
    </div>
  );
}

/**
 * Progressive loading for lists
 * Initially renders only visible items, then progressively loads more
 */
export function ProgressiveList<T>({
  items,
  renderItem,
  initialCount = 10,
  batchSize = 10,
  className,
  itemClassName,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  initialCount?: number;
  batchSize?: number;
  className?: string;
  itemClassName?: string;
}) {
  const { ref: loadMoreRef, shouldLoad: shouldLoadMore } = useLazyLoad('100px');

  // Calculate how many items to show
  const visibleCount = shouldLoadMore
    ? Math.min(items.length, initialCount + batchSize)
    : initialCount;

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className={className}>
      {visibleItems.map((item, index) => (
        <div key={index} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
      {hasMore && (
        <div ref={loadMoreRef} className="h-1" />
      )}
    </div>
  );
}

export default LazyLoad;
