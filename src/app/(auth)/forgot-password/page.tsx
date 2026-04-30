"use client";

import React, { useState } from "react";
import { Mail, Loader2, KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { ThemedButton } from "@/components/ui/themedButton";
import axiosInstance from "@/lib/config/axios.config";
import { toast } from "sonner";
import { useTheme } from "@/lib/context/ThemeContext";
import Link from "next/link"; // Navigation ko lagi
import Image from "next/image";

export default function ForgotPasswordPage() {
  const { primaryColor } = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email.");

    try {
      setLoading(true);
      await axiosInstance.post("/auth/forgot-password/", { email });
      setSent(true);
      toast.success("Reset link sent!");
    } catch (error: any) {
      const serverError = error.response?.data;
      toast.error(serverError?.detail || serverError?.email || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-white rounded-md shadow-xl overflow-hidden border border-gray-100">
        
        {/* Top Accent Bar */}
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.5)})`,
          }}
        />

        {/* Card Header */}
        <div className="px-4 pt-4 pb-4 text-center">
          <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2 shadow-sm"
                        style={{ backgroundColor: `${primaryColor}10` }}
                      >
                        <Image src="/edify.png" alt="login icon" width={54} height={54} />
          
                      </div>
          <h1 className="text-xl font-bold text-slate-800">Forgot Password?</h1>
          <p className="text-[13px] text-slate-500 mt-2">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <div className="px-4 pb-10">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2 ">
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider ml-1 ">
                  Email Address
                </label>
                <ThemedInput
                  type="email"
                  placeholder="Enter your registered email"
                  className="mt-1"
                  icon={<Mail size={15} />}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <ThemedButton
                type="submit"
                className="w-full py-2 flex items-center justify-center gap-2 rounded font-bold"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </ThemedButton>

              <div className="text-center mt-4">
                <Link 
                  href="/login" 
                  className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </form>
          ) : (
            /* Success State */
            <div className="text-center py-4 space-y-6">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: "#ecfdf5" }}
              >
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-800">Check your email</h2>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Instructions have been sent to <br />
                  <span className="font-bold text-slate-700 italic">{email}</span>
                </p>
              </div>

              <div className="pt-2">
                <p className="text-[12px] text-slate-400">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => setSent(false)}
                    className="font-bold underline italic underline-offset-4"
                    style={{ color: primaryColor }}
                  >
                    Click to resend
                  </button>
                </p>
              </div>

              <Link href="/login" className="block w-full">
                <ThemedButton type="button" className="w-full py-2 rounded font-bold">
                  Back to Login
                </ThemedButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}