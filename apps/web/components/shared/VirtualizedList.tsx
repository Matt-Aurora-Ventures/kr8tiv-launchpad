'use client';

import { useRef, useCallback, ReactNode } from 'react';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

export interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number, virtualItem: VirtualItem) => ReactNode;
  /** Estimated height of each item in pixels */
  estimateSize?: number;
  /** Height of the scroll container */
  height?: number | string;
  /** Number of items to render outside visible area */
  overscan?: number;
  /** Unique key extractor for items */
  getItemKey?: (item: T, index: number) => string | number;
  /** Container className */
  className?: string;
  /** Inner list className */
  innerClassName?: string;
  /** Render when list is empty */
  emptyState?: ReactNode;
  /** Gap between items in pixels */
  gap?: number;
}

/**
 * Virtualized list component for efficiently rendering large lists
 * Only renders items that are visible in the viewport
 *
 * @example
 * <VirtualizedList
 *   items={tokens}
 *   renderItem={(token) => <TokenCard token={token} />}
 *   estimateSize={80}
 *   height={600}
 * />
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 50,
  height = 600,
  overscan = 5,
  getItemKey,
  className,
  innerClassName,
  emptyState,
  gap = 0,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize + gap,
    overscan,
    getItemKey: getItemKey
      ? (index) => getItemKey(items[index], index)
      : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto scrollbar-thin scrollbar-thumb-neutral-700', className)}
      style={{ height }}
    >
      <div
        className={cn('relative w-full', innerClassName)}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
              paddingBottom: gap,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index, virtualItem)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Virtualized grid for rendering items in columns
 */
export interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: number;
  rowHeight?: number;
  height?: number | string;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
  gap?: number;
  emptyState?: ReactNode;
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns = 3,
  rowHeight = 200,
  height = 600,
  overscan = 2,
  getItemKey,
  className,
  gap = 16,
  emptyState,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate number of rows
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + gap,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();

  if (items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto scrollbar-thin scrollbar-thumb-neutral-700', className)}
      style={{ height }}
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap,
                paddingBottom: gap,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const itemIndex = startIndex + colIndex;
                const key = getItemKey ? getItemKey(item, itemIndex) : itemIndex;
                return (
                  <div key={key}>
                    {renderItem(item, itemIndex)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Simple wrapper for infinite scroll with virtualization
 */
export interface InfiniteVirtualListProps<T> extends VirtualizedListProps<T> {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  loadingIndicator?: ReactNode;
}

export function InfiniteVirtualList<T>({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadingIndicator,
  renderItem,
  ...props
}: InfiniteVirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Include loading row if there's more to load
  const count = items.length + (hasNextPage ? 1 : 0);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => props.estimateSize || 50,
    overscan: props.overscan || 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Check if we need to fetch more
  const lastItem = virtualItems[virtualItems.length - 1];
  if (
    lastItem &&
    lastItem.index >= items.length - 1 &&
    hasNextPage &&
    !isFetchingNextPage &&
    fetchNextPage
  ) {
    fetchNextPage();
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', props.className)}
      style={{ height: props.height || 600 }}
    >
      <div
        className={cn('relative w-full', props.innerClassName)}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoaderRow = virtualItem.index >= items.length;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isLoaderRow ? (
                loadingIndicator || (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  </div>
                )
              ) : (
                renderItem(items[virtualItem.index], virtualItem.index, virtualItem)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedList;
