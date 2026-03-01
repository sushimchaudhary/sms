"use client";

import React, { useState } from "react";
import { X, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { ThemedButton } from "@/components/ui/themedButton";

interface ChangePasswordProps {
  onClose: () => void;
}

export default function ChangePassword({ onClose }: ChangePasswordProps) {
  const [showPass, setShowPass] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const toggleVisibility = (field: keyof typeof showPass) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="bg-white rounded shadow-2xl border border-gray-100 w-full overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#f8fafc] px-2 py-2 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-[12px] font-bold text-slate-800">
              Change Password
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Update your account security
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-600 transition-colors p-1 hover:bg-rose-50 rounded-full"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-2 space-y-4">
        {/* Old Password */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 ml-1">
            Current Password
          </label>
          <div className="relative">
            <ThemedInput
              type={showPass.old ? "text" : "password"}
              placeholder="Enter current password"
              className="pr-10 "
              icon={<Lock size={12} />}
              required
            />
            <PasswordToggle
              active={showPass.old}
              onClick={() => toggleVisibility("old")}
            />
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 ml-1">
            New Password
          </label>
          <div className="relative">
            <ThemedInput
              type={showPass.new ? "text" : "password"}
              placeholder="Enter new password"
              className="pr-10 "
              icon={<Lock size={12} />}
              required
            />
            <PasswordToggle
              active={showPass.new}
              onClick={() => toggleVisibility("new")}
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 ml-1">
            Confirm New Password
          </label>
          <div className="relative">
            <ThemedInput
              type={showPass.confirm ? "text" : "password"}
              placeholder="Re-type new password"
              className="pr-10"
              icon={<Lock size={12} />}
              required
            />
            <PasswordToggle
              active={showPass.confirm}
              onClick={() => toggleVisibility("confirm")}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <ThemedButton
            type="submit"
            className="w-full py-1.5 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              "Update"
            )}
          </ThemedButton>
        </div>
      </form>
    </div>
  );
}

// Internal Toggle Helper
function PasswordToggle({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
    >
      {active ? <EyeOff size={12} /> : <Eye size={12} />}
    </button>
  );
}
