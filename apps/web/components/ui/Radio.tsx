'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, disabled, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const dotSizes = {
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
    };

    return (
      <label
        className={cn(
          'flex items-start gap-3 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="relative flex items-center">
          <input
            type="radio"
            ref={ref}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'flex items-center justify-center rounded-full border-2 transition-all duration-200',
              sizeClasses[size],
              'border-border bg-background',
              'peer-checked:border-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20',
              error && 'border-red-500'
            )}
          >
            <span
              className={cn(
                'rounded-full bg-primary scale-0 transition-transform duration-200',
                'peer-checked:scale-100',
                dotSizes[size]
              )}
            />
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className={cn('text-sm font-medium', error && 'text-red-500')}>{label}</span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
            )}
            {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
          </div>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

// Radio Group
export interface RadioGroupProps {
  name: string;
  label?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  orientation = 'vertical',
  size = 'md',
}: RadioGroupProps) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={label}>
      {label && <span className="block text-sm font-medium">{label}</span>}
      <div
        className={cn(
          'flex gap-4',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            label={option.label}
            description={option.description}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={option.disabled}
            size={size}
          />
        ))}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

// Radio Card - A card-style radio option
export interface RadioCardProps extends Omit<RadioProps, 'label' | 'description'> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export const RadioCard = forwardRef<HTMLInputElement, RadioCardProps>(
  ({ className, title, description, icon, badge, disabled, checked, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
          'hover:border-primary/50',
          checked ? 'border-primary bg-primary/5' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input
          type="radio"
          ref={ref}
          disabled={disabled}
          checked={checked}
          className="sr-only"
          {...props}
        />

        {icon && (
          <div
            className={cn(
              'flex-shrink-0 p-2 rounded-lg',
              checked ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
            )}
          >
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        <div
          className={cn(
            'flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
            checked ? 'border-primary' : 'border-border'
          )}
        >
          {checked && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
        </div>
      </label>
    );
  }
);

RadioCard.displayName = 'RadioCard';

export default Radio;
