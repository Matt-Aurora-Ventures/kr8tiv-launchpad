'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  labelPosition?: 'left' | 'right';
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      description,
      disabled,
      checked,
      size = 'md',
      labelPosition = 'right',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: {
        track: 'h-5 w-9',
        thumb: 'h-4 w-4',
        translate: 'translate-x-4',
      },
      md: {
        track: 'h-6 w-11',
        thumb: 'h-5 w-5',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'h-7 w-14',
        thumb: 'h-6 w-6',
        translate: 'translate-x-7',
      },
    };

    const sizes = sizeClasses[size];

    const switchElement = (
      <div className="relative">
        <input
          type="checkbox"
          role="switch"
          ref={ref}
          disabled={disabled}
          checked={checked}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            'rounded-full transition-all duration-200',
            sizes.track,
            'bg-secondary',
            'peer-checked:bg-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20',
            disabled && 'opacity-50'
          )}
        />
        <div
          className={cn(
            'absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform duration-200',
            sizes.thumb,
            checked && sizes.translate
          )}
        />
      </div>
    );

    if (!label && !description) {
      return (
        <label className={cn('inline-flex cursor-pointer', disabled && 'cursor-not-allowed', className)}>
          {switchElement}
        </label>
      );
    }

    return (
      <label
        className={cn(
          'flex items-center gap-3 cursor-pointer',
          disabled && 'cursor-not-allowed',
          className
        )}
      >
        {labelPosition === 'left' && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium">{label}</span>}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}

        {switchElement}

        {labelPosition === 'right' && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium">{label}</span>}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

// Switch with icons
export interface IconSwitchProps extends Omit<SwitchProps, 'label' | 'description'> {
  iconOff?: React.ReactNode;
  iconOn?: React.ReactNode;
}

export const IconSwitch = forwardRef<HTMLInputElement, IconSwitchProps>(
  ({ className, iconOff, iconOn, disabled, checked, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: {
        track: 'h-5 w-9',
        thumb: 'h-4 w-4',
        translate: 'translate-x-4',
        icon: 'h-3 w-3',
      },
      md: {
        track: 'h-6 w-11',
        thumb: 'h-5 w-5',
        translate: 'translate-x-5',
        icon: 'h-3.5 w-3.5',
      },
      lg: {
        track: 'h-7 w-14',
        thumb: 'h-6 w-6',
        translate: 'translate-x-7',
        icon: 'h-4 w-4',
      },
    };

    const sizes = sizeClasses[size];

    return (
      <label
        className={cn(
          'inline-flex cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <div className="relative">
          <input
            type="checkbox"
            role="switch"
            ref={ref}
            disabled={disabled}
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'rounded-full transition-all duration-200 flex items-center justify-between px-1',
              sizes.track,
              'bg-secondary',
              'peer-checked:bg-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20'
            )}
          >
            <span className={cn('text-muted-foreground', sizes.icon)}>{iconOn}</span>
            <span className={cn('text-muted-foreground', sizes.icon)}>{iconOff}</span>
          </div>
          <div
            className={cn(
              'absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center',
              sizes.thumb,
              checked && sizes.translate
            )}
          >
            <span className={cn('text-primary', sizes.icon)}>
              {checked ? iconOn : iconOff}
            </span>
          </div>
        </div>
      </label>
    );
  }
);

IconSwitch.displayName = 'IconSwitch';

export default Switch;
