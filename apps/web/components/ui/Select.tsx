'use client';

import { forwardRef, SelectHTMLAttributes, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
  variant?: 'default' | 'filled' | 'outlined';
}

// Native Select
export const NativeSelect = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      options,
      placeholder,
      variant = 'default',
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'bg-background border border-border',
      filled: 'bg-secondary border border-transparent',
      outlined: 'bg-transparent border-2 border-border',
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            className={cn(
              'w-full px-3 py-2 pr-10 rounded-lg text-sm transition-all duration-200 appearance-none',
              'focus:outline-none focus:ring-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              variantClasses[variant],
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'focus:border-primary focus:ring-primary/20',
              className
            )}
            ref={ref}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
            {error && <AlertCircle className="h-4 w-4 text-red-500" />}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {(error || hint) && (
          <p className={cn('mt-1.5 text-xs', error ? 'text-red-500' : 'text-muted-foreground')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';

// Custom Select with dropdown
export interface CustomSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  variant?: 'default' | 'filled' | 'outlined';
}

export function Select({
  label,
  error,
  hint,
  options,
  value,
  placeholder = 'Select an option',
  onChange,
  disabled,
  required,
  className,
  variant = 'default',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const variantClasses = {
    default: 'bg-background border border-border',
    filled: 'bg-secondary border border-transparent',
    outlined: 'bg-transparent border-2 border-border',
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            onChange?.(option.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            const next = prev + 1;
            return next >= options.length ? 0 : next;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? options.length - 1 : next;
          });
        }
        break;
    }
  };

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm text-left transition-all duration-200',
            'focus:outline-none focus:ring-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variantClasses[variant],
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'focus:border-primary focus:ring-primary/20',
            isOpen && 'ring-2 ring-primary/20 border-primary'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.icon}
            <span className={!selectedOption ? 'text-muted-foreground' : ''}>
              {selectedOption?.label || placeholder}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-50 w-full mt-1 py-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto animate-fade-in"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  if (!option.disabled) {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2',
                  option.disabled && 'opacity-50 cursor-not-allowed',
                  highlightedIndex === index && 'bg-secondary',
                  option.value === value && 'text-primary'
                )}
              >
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
                {option.value === value && <Check className="h-4 w-4" />}
              </li>
            ))}
          </ul>
        )}
      </div>

      {(error || hint) && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-red-500' : 'text-muted-foreground')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export default Select;
