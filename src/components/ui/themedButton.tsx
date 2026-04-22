"use client";

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function ThemedButton({
  variant = 'primary',
  size = 'md',
  className,
  style,
  ...props
}: ThemedButtonProps) {
  const { primaryColor } = useTheme();

  const baseStyles = 'font-medium  transition-all rounded flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: `text-white !text-white shadow-lg transition-all hover:brightness-90`, 
    secondary: `text-gray-700 bg-gray-100 hover:bg-gray-200`,
    outline: `border-2 text-gray-700 hover:bg-gray-50`,
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      style={{
        ...(variant === 'primary' && {
          backgroundColor: primaryColor,
          color: 'white', 
          boxShadow: `0 4px 6px ${primaryColor}33`,
          '--tw-ring-color': primaryColor,
        } as any),
        ...style,
      }}
     
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.color = 'white';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.color = 'white';
        }
      }}
      {...props}
    />
  );
}