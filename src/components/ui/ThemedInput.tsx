"use client";

import React, { forwardRef } from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const ThemedInput = forwardRef<HTMLInputElement, ThemedInputProps>(
  ({ className, type, label, error, icon, style, ...props }, ref) => {
    const { primaryColor } = useTheme();

    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-[11px] font-medium text-gray-400 block ml-0.5">
            {label}
          </label>
        )}
        
        <div className="relative group">
          {/* Icon Area */}
          {icon && (
            <div 
              className="absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10"
              style={{ color: 'var(--icon-color, #9ca3af)' }}
            >
              {/* Icon size fixed to 14 for compact look */}
              {React.isValidElement(icon) 
                ? React.cloneElement(icon as React.ReactElement<any>, { size: 14 }) 
                : icon}
            </div>
          )}

          <input
            type={type}
            ref={ref}
            className={cn(
              // leading-none र py-0 ले कर्सर (cursor) को साइज सानो बनाउँछ
              "flex h-8 w-full rounded border border-gray-200 bg-white px-3 py-0 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 leading-none",
              icon && "pl-8",
              error && "border-rose-500 focus:ring-rose-500",
              className
            )}
            style={{
              ...(!error && {
                '--tw-ring-color': `${primaryColor}33`, 
              } as any),
              ...style,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.parentElement?.style.setProperty('--icon-color', primaryColor);
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.parentElement?.style.setProperty('--icon-color', '#9ca3af');
              }
            }}
            {...props}
          />
        </div>

        {error && (
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight ml-0.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

ThemedInput.displayName = "ThemedInput";