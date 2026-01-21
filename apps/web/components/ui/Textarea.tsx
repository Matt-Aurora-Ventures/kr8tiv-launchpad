'use client';

import { forwardRef, TextareaHTMLAttributes, useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  variant?: 'default' | 'filled' | 'outlined';
  showCount?: boolean;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      success,
      hint,
      variant = 'default',
      disabled,
      showCount,
      maxLength,
      autoResize,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const variantClasses = {
      default: 'bg-background border border-border',
      filled: 'bg-secondary border border-transparent',
      outlined: 'bg-transparent border-2 border-border',
    };

    const stateClasses = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : success
        ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
        : 'focus:border-primary focus:ring-primary/20';

    useEffect(() => {
      if (value !== undefined) {
        setCharCount(String(value).length);
      }
    }, [value]);

    useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [value, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
      onChange?.(e);
    };

    const setRefs = (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
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
          <textarea
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 resize-y min-h-[100px]',
              'focus:outline-none focus:ring-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'placeholder:text-muted-foreground',
              variantClasses[variant],
              stateClasses,
              autoResize && 'resize-none overflow-hidden',
              className
            )}
            ref={setRefs}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />

          {(error || success) && (
            <div className="absolute right-3 top-3">
              {error && <AlertCircle className="h-4 w-4 text-red-500" />}
              {success && !error && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <div>
            {(error || success || hint) && (
              <p
                className={cn(
                  'text-xs',
                  error ? 'text-red-500' : success ? 'text-green-500' : 'text-muted-foreground'
                )}
              >
                {error || success || hint}
              </p>
            )}
          </div>
          {showCount && maxLength && (
            <span
              className={cn(
                'text-xs',
                charCount >= maxLength ? 'text-red-500' : 'text-muted-foreground'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
