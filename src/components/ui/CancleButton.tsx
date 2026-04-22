"use client";

import { Chilanka } from "next/font/google";


interface CancelButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const CancelButton = ({
  onClick,
  label = "Cancel",
  className = "",
  disabled = false,  
  children,
  ...props
}: CancelButtonProps) => {
  return (
    <button {...props}
      onClick={onClick}
      type="button"
      disabled={disabled}
      className={`
        group flex items-center gap-2 px-4 py-1.5 rounded 
        text-red-500 border border-red-400 text-[11px] font-bold uppercase tracking-tight
        hover:bg-red-50 hover:border-red-500 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
     {children}
      <span>{label}</span>
    </button>
  );
};