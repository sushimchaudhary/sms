"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { ThemedButton } from "@/components/ui/themedButton";
import axiosInstance from "@/lib/config/axios.config";
import { toast } from "sonner";
import { useTheme } from "@/lib/context/ThemeContext";

interface ChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePassword({
  isOpen,
  onClose,
}: ChangePasswordProps) {
  const { primaryColor } = useTheme();

  const [showPass, setShowPass] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Password strength calculation
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(formData.new_password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"][
    strength
  ];

  const toggleVisibility = (field: keyof typeof showPass) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side validation
    if (formData.new_password !== formData.confirm_password) {
      return toast.error("New passwords do not match!");
    }
    if (formData.new_password.length < 8) {
      return toast.error("Password must be at least 8 characters.");
    }

    try {
      setLoading(true);
      await axiosInstance.post("/auth/change-password/", {
        old_password: formData.old_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      toast.success("Password updated successfully!");
      
      // Form reset garne (optional)
      setFormData({ old_password: "", new_password: "", confirm_password: "" });
      onClose();
    } catch (error: any) {
      const serverError = error.response?.data;

      // 🔥 Backend Errors Handling Logic
      if (serverError) {
        // Yadi backend le 'detail' pathayo bhane (e.g., "Invalid password")
        if (serverError.detail) {
          toast.error(serverError.detail);
        } 
        // Yadi backend le field-specific error pathayo bhane (e.g., old_password: ["..."])
        else if (typeof serverError === "object") {
          const firstKey = Object.keys(serverError)[0];
          const message = Array.isArray(serverError[firstKey]) 
            ? serverError[firstKey][0] 
            : serverError[firstKey];
          
          toast.error(`${firstKey.replace("_", " ")}: ${message}`);
        } 
        else {
          toast.error("An error occurred. Please try again.");
        }
      } else {
        toast.error("Connection failed. Please check your internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (typeof window === "undefined") return null;

  // Hex to rgba helper
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: 9998,
        }}
      />

      {/* Modal container */}
      <div
        className="fixed inset-0 flex items-center justify-center p-2"
        style={{
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: 9999,
        }}
      >
        <div
          className="w-full max-w-md transition-all duration-300"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen
              ? "scale(1) translateY(0)"
              : "scale(0.95) translateY(16px)",
          }}
        >
          <div className="bg-white rounded-md shadow-2xl overflow-hidden border border-gray-100">
            {/* Colored top accent bar */}
            <div
              style={{
                height: 4,
                background: `linear-gradient(90deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.5)})`,
              }}
            />

            {/* Header */}
            <div
              className="px-5 pt-3 pb-3 flex items-start justify-between"
              style={{
                borderBottom: `1px solid ${hexToRgba(primaryColor, 0.1)}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-md"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
                >
                  <KeyRound size={18} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-800 leading-tight">
                    Change Password
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Keep your account secure
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-red-500  transition-all duration-200 hover:rotate-90"
                style={{ transition: "all 0.2s" }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-2">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide ml-0.5">
                  Current Password
                </label>
                <div className="relative py-1">
                  <ThemedInput
                    type={showPass.old ? "text" : "password"}
                    placeholder="Enter current password"
                    className="pr-10"
                    icon={<Lock size={12} />}
                    required
                    value={formData.old_password}
                    onChange={(e) => handleChange(e, "old_password")}
                  />
                  <PasswordToggle
                    active={showPass.old}
                    primaryColor={primaryColor}
                    onClick={() => toggleVisibility("old")}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center gap-4 py-1 ">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  New
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide ml-0.5">
                  New Password
                </label>
                <div className="relative py-1">
                  <ThemedInput
                    type={showPass.new ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pr-10"
                    icon={<Lock size={12} />}
                    required
                    value={formData.new_password}
                    onChange={(e) => handleChange(e, "new_password")}
                  />
                  <PasswordToggle
                    active={showPass.new}
                    primaryColor={primaryColor}
                    onClick={() => toggleVisibility("new")}
                  />
                </div>

                {/* Strength meter */}
                {formData.new_password && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              i <= strength ? strengthColor : "#e2e8f0",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-[10px] font-semibold ml-0.5"
                      style={{ color: strengthColor }}
                    >
                      {strengthLabel}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide ml-0.5">
                  Confirm New Password
                </label>
                <div className="relative py-1">
                  <ThemedInput
                    type={showPass.confirm ? "text" : "password"}
                    placeholder="Re-type new password"
                    className="pr-10"
                    icon={<Lock size={12} />}
                    required
                    value={formData.confirm_password}
                    onChange={(e) => handleChange(e, "confirm_password")}
                  />
                  <PasswordToggle
                    active={showPass.confirm}
                    primaryColor={primaryColor}
                    onClick={() => toggleVisibility("confirm")}
                  />
                  {/* Match indicator */}
                  {formData.confirm_password && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2">
                      <CheckCircle2
                        size={13}
                        style={{
                          color:
                            formData.new_password === formData.confirm_password
                              ? "#22c55e"
                              : "#ef4444",
                          transition: "color 0.2s",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-5 mt-2 border-t border-gray-100">
                {/* Cancel Button - 50% Width */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded text-slate-600 text-[12px] font-bold border border-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 active:scale-[0.98]"
                >
                  Cancel
                </button>

                {/* Update Button - 50% Width */}
                <ThemedButton
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span className="text-[12px]">Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} className="opacity-90" />
                        <span className="text-[12px] font-bold tracking-wide uppercase">
                          Update Password
                        </span>
                      </>
                    )}
                  </div>
                </ThemedButton>
              </div>

              {/* Tip */}
              <p
                className="text-[10px] text-center pt-1 leading-relaxed"
                style={{ color: hexToRgba(primaryColor, 0.7) }}
              >
                Use 8+ characters with uppercase, numbers & symbols for a strong
                password.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function PasswordToggle({
  active,
  onClick,
  primaryColor,
}: {
  active: boolean;
  onClick: () => void;
  primaryColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200"
      style={{ color: active ? primaryColor : undefined }}
      onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = active ? primaryColor : "#94a3b8")
      }
    >
      {active ? <EyeOff size={13} /> : <Eye size={13} />}
    </button>
  );
}
