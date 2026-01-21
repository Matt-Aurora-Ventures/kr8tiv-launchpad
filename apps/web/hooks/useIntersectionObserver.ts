'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** Only trigger once when element becomes visible */
  triggerOnce?: boolean;
  /** Callback when intersection changes */
  onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

export interface UseIntersectionObserverReturn {
  /** Ref callback to attach to the element */
  ref: (element: Element | null) => void;
  /** Whether the element is currently intersecting */
  isIntersecting: boolean;
  /** The intersection observer entry */
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook to observe when an element enters the viewport
 * Useful for lazy loading, infinite scroll, animations on scroll
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({ rootMargin: '100px' });
 * return (
 *   <div ref={ref}>
 *     {isIntersecting && <LazyComponent />}
 *   </div>
 * );
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    root = null,
    rootMargin = '100px',
    threshold = 0,
    triggerOnce = false,
    onChange,
  } = options;

  const [element, setElement] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!element) return;

    // If triggerOnce and already triggered, skip
    if (triggerOnce && hasTriggered.current) return;

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        const isElementIntersecting = observerEntry.isIntersecting;

        // If triggerOnce, only update state once when entering
        if (triggerOnce) {
          if (isElementIntersecting && !hasTriggered.current) {
            hasTriggered.current = true;
            setIsIntersecting(true);
            setEntry(observerEntry);
            onChange?.(true, observerEntry);
            observer.disconnect();
          }
        } else {
          setIsIntersecting(isElementIntersecting);
          setEntry(observerEntry);
          onChange?.(isElementIntersecting, observerEntry);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, root, rootMargin, threshold, triggerOnce, onChange]);

  const ref = useCallback((node: Element | null) => {
    setElement(node);
  }, []);

  return { ref, isIntersecting, entry };
}

/**
 * Hook for lazy loading components/images
 * Simplified version that just returns whether to render
 */
export function useLazyLoad(rootMargin: string = '200px'): {
  ref: (element: Element | null) => void;
  shouldLoad: boolean;
} {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin,
    triggerOnce: true,
  });

  return { ref, shouldLoad: isIntersecting };
}

/**
 * Hook for infinite scroll
 * Triggers callback when sentinel element is visible
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: {
    rootMargin?: string;
    enabled?: boolean;
  } = {}
): {
  sentinelRef: (element: Element | null) => void;
} {
  const { rootMargin = '200px', enabled = true } = options;
  const loadMoreRef = useRef(onLoadMore);

  // Update ref on every render
  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const { ref } = useIntersectionObserver({
    rootMargin,
    onChange: (isIntersecting) => {
      if (isIntersecting && enabled) {
        loadMoreRef.current();
      }
    },
  });

  return { sentinelRef: ref };
}

export default useIntersectionObserver;
