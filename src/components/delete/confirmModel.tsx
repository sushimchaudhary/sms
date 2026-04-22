"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message,
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  const { primaryColor } = useTheme();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300); 
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop - Fade In/Out */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={!loading ? onCancel : undefined}
      />

      {/* Card - Scale & Fade */}
      <div
        className={`relative bg-white rounded shadow-2xl max-w-sm w-full p-6 transition-all duration-300 ease-out transform ${
          isAnimating 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Close Button */}
        <div className="absolute right-4 top-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-red-500 hover:rotate-90 transition-all active:scale-90 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4 transition-transform duration-500 delay-100 ease-out"
               style={{ transform: isAnimating ? 'scale(1)' : 'scale(0.5)' }}>
            <AlertTriangle className="text-red-500" size={28} />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{title}</h3>
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed italic">{message}</p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-1.5 border rounded text-[12px] font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
              style={{ borderColor: primaryColor, color: "#4b5563" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-1.5 text-white bg-red-500 rounded text-[12px] font-bold transition-all active:scale-95 hover:bg-red-600 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                "Delete Now"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}