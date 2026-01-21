'use client';

import { forwardRef, InputHTMLAttributes, useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  showTicks?: boolean;
  formatValue?: (value: number) => string;
  size?: 'sm' | 'md' | 'lg';
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      label,
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      showValue = true,
      showTicks = false,
      formatValue = (v) => String(v),
      disabled,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const sizeClasses = {
      sm: {
        track: 'h-1',
        thumb: 'h-4 w-4',
      },
      md: {
        track: 'h-2',
        thumb: 'h-5 w-5',
      },
      lg: {
        track: 'h-3',
        thumb: 'h-6 w-6',
      },
    };

    const sizes = sizeClasses[size];
    const tickCount = Math.floor((max - min) / step);
    const ticks = showTicks && tickCount <= 10
      ? Array.from({ length: tickCount + 1 }, (_, i) => min + i * step)
      : [];

    return (
      <div className={cn('w-full', className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-2">
            {label && <span className="text-sm font-medium">{label}</span>}
            {showValue && (
              <span className="text-sm text-muted-foreground">{formatValue(value)}</span>
            )}
          </div>
        )}

        <div className="relative">
          <input
            type="range"
            ref={ref}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="sr-only"
            {...props}
          />

          {/* Track */}
          <div
            className={cn(
              'relative w-full rounded-full bg-secondary cursor-pointer',
              sizes.track,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={(e) => {
              if (disabled) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              const newValue = Math.round((min + percent * (max - min)) / step) * step;
              onChange(Math.max(min, Math.min(newValue, max)));
            }}
          >
            {/* Fill */}
            <div
              className={cn('absolute h-full rounded-full bg-primary transition-all', sizes.track)}
              style={{ width: `${percentage}%` }}
            />

            {/* Thumb */}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border-2 border-primary shadow-md transition-transform',
                'hover:scale-110',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                sizes.thumb
              )}
              style={{ left: `${percentage}%` }}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-valuenow={value}
              aria-valuemin={min}
              aria-valuemax={max}
              onKeyDown={(e) => {
                if (disabled) return;
                let newValue = value;
                switch (e.key) {
                  case 'ArrowLeft':
                  case 'ArrowDown':
                    newValue = Math.max(min, value - step);
                    break;
                  case 'ArrowRight':
                  case 'ArrowUp':
                    newValue = Math.min(max, value + step);
                    break;
                  case 'Home':
                    newValue = min;
                    break;
                  case 'End':
                    newValue = max;
                    break;
                  default:
                    return;
                }
                e.preventDefault();
                onChange(newValue);
              }}
            />
          </div>

          {/* Ticks */}
          {ticks.length > 0 && (
            <div className="flex justify-between mt-1">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="text-xs text-muted-foreground"
                  style={{ width: tick === min || tick === max ? 'auto' : 0 }}
                >
                  {tick === min || tick === max ? formatValue(tick) : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

// Range Slider (two thumbs)
export interface RangeSliderProps {
  label?: string;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function RangeSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue = (v) => String(v),
  size = 'md',
  className,
  disabled,
}: RangeSliderProps) {
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentageMin = ((value[0] - min) / (max - min)) * 100;
  const percentageMax = ((value[1] - min) / (max - min)) * 100;

  const sizeClasses = {
    sm: { track: 'h-1', thumb: 'h-4 w-4' },
    md: { track: 'h-2', thumb: 'h-5 w-5' },
    lg: { track: 'h-3', thumb: 'h-6 w-6' },
  };

  const sizes = sizeClasses[size];

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newValue = Math.round((min + percent * (max - min)) / step) * step;

      // Determine which thumb to move
      const distToMin = Math.abs(newValue - value[0]);
      const distToMax = Math.abs(newValue - value[1]);

      if (distToMin < distToMax) {
        onChange([Math.min(newValue, value[1]), value[1]]);
      } else {
        onChange([value[0], Math.max(newValue, value[0])]);
      }
    },
    [disabled, min, max, step, value, onChange]
  );

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && (
            <span className="text-sm text-muted-foreground">
              {formatValue(value[0])} - {formatValue(value[1])}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Track */}
        <div
          ref={trackRef}
          className={cn(
            'relative w-full rounded-full bg-secondary cursor-pointer',
            sizes.track,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleTrackClick}
        >
          {/* Fill */}
          <div
            className={cn('absolute h-full bg-primary', sizes.track)}
            style={{
              left: `${percentageMin}%`,
              width: `${percentageMax - percentageMin}%`,
            }}
          />

          {/* Min Thumb */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border-2 border-primary shadow-md transition-transform z-10',
              'hover:scale-110',
              sizes.thumb,
              activeThumb === 'min' && 'scale-110 z-20'
            )}
            style={{ left: `${percentageMin}%` }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-valuenow={value[0]}
            aria-valuemin={min}
            aria-valuemax={value[1]}
            onMouseDown={() => setActiveThumb('min')}
            onKeyDown={(e) => {
              if (disabled) return;
              let newValue = value[0];
              switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowDown':
                  newValue = Math.max(min, value[0] - step);
                  break;
                case 'ArrowRight':
                case 'ArrowUp':
                  newValue = Math.min(value[1], value[0] + step);
                  break;
                default:
                  return;
              }
              e.preventDefault();
              onChange([newValue, value[1]]);
            }}
          />

          {/* Max Thumb */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border-2 border-primary shadow-md transition-transform z-10',
              'hover:scale-110',
              sizes.thumb,
              activeThumb === 'max' && 'scale-110 z-20'
            )}
            style={{ left: `${percentageMax}%` }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-valuenow={value[1]}
            aria-valuemin={value[0]}
            aria-valuemax={max}
            onMouseDown={() => setActiveThumb('max')}
            onKeyDown={(e) => {
              if (disabled) return;
              let newValue = value[1];
              switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowDown':
                  newValue = Math.max(value[0], value[1] - step);
                  break;
                case 'ArrowRight':
                case 'ArrowUp':
                  newValue = Math.min(max, value[1] + step);
                  break;
                default:
                  return;
              }
              e.preventDefault();
              onChange([value[0], newValue]);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Slider;
