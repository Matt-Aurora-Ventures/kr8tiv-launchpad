'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  /** Fallback image to show on error */
  fallbackSrc?: string;
  /** Show skeleton loader while loading */
  showSkeleton?: boolean;
  /** Custom skeleton className */
  skeletonClassName?: string;
  /** Aspect ratio for skeleton (e.g., '16/9', '1/1') */
  aspectRatio?: string;
  /** Callback when image loads successfully */
  onLoadComplete?: () => void;
  /** Callback when image fails to load */
  onLoadError?: () => void;
}

/**
 * Skeleton loading placeholder
 */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-[length:200%_100%]',
        className
      )}
      style={{
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

/**
 * Optimized image component with:
 * - Automatic lazy loading
 * - Loading skeleton
 * - Error fallback
 * - Blur placeholder
 * - Accessibility improvements
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  showSkeleton = true,
  skeletonClassName,
  aspectRatio,
  onLoadComplete,
  onLoadError,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback(() => {
    setHasError(true);
    onLoadError?.();
  }, [onLoadError]);

  const imageSrc = hasError ? fallbackSrc : src;

  // Determine if we should show the skeleton
  const showLoadingSkeleton = showSkeleton && !isLoaded && !hasError;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Loading skeleton */}
      {showLoadingSkeleton && (
        <Skeleton
          className={cn(
            'absolute inset-0 z-10',
            skeletonClassName
          )}
        />
      )}

      {/* Main image */}
      <Image
        src={imageSrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          // Reset className since parent has it
          'w-full h-full object-cover'
        )}
        {...props}
      />
    </div>
  );
}

/**
 * Token image with automatic fallback to generated avatar
 */
export function TokenImage({
  src,
  symbol,
  size = 40,
  className,
  ...props
}: {
  src?: string | null;
  symbol: string;
  size?: number;
  className?: string;
} & Omit<OptimizedImageProps, 'src' | 'alt' | 'width' | 'height' | 'fallbackSrc'>) {
  const [hasError, setHasError] = useState(false);

  // Generate a simple avatar from symbol if no image
  if (!src || hasError) {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-yellow-500',
      'bg-red-500',
    ];
    const colorIndex = symbol.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full text-white font-bold',
          bgColor,
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={`${symbol} token`}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      onLoadError={() => setHasError(true)}
      showSkeleton={true}
      skeletonClassName="rounded-full"
      {...props}
    />
  );
}

/**
 * Background image with gradient overlay
 */
export function BackgroundImage({
  src,
  alt = 'Background',
  overlay = true,
  overlayClassName,
  children,
  className,
  ...props
}: {
  src: string;
  alt?: string;
  overlay?: boolean;
  overlayClassName?: string;
  children?: React.ReactNode;
} & Omit<OptimizedImageProps, 'fill'>) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        showSkeleton={false}
        {...props}
      />
      {overlay && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black',
            overlayClassName
          )}
        />
      )}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
