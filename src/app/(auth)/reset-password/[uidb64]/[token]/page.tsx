"use client";

import { useState, use } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/config/axios.config";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import Image from "next/image";

interface PageProps {
  params: Promise<{ uidb64: string; token: string }>;
}

export default function ResetPassword({ params }: PageProps) {
  const { uidb64, token } = use(params);
  const router = useRouter();
  const { primaryColor } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Password strength
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [
    "",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
  ][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus({ type: "error", text: "Passwords do not match!" });
      return;
    }

    if (password.length < 8) {
      setStatus({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await axiosInstance.post("/auth/reset-password/", {
        uidb64,
        token,
        new_password: password,
      });

      setStatus({
        type: "success",
        text: "Password updated successfully! Redirecting to login...",
      });

      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.new_password
        ? err.response.data.new_password[0]
        : err.response?.data?.detail || "Invalid token or expired link.";

      setStatus({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-md shadow-2xl overflow-hidden border border-gray-100">

          {/* Top accent bar */}
          <div
            style={{
              height: 4,
              background: `linear-gradient(90deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.5)})`,
            }}
          />

          <div className="px-4  pb-4">

          <div className="pt-5 pb-4 px-8 text-center bg-white">
                      <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2 shadow-sm"
                        style={{ backgroundColor: `${primaryColor}10` }}
                      >
                        <Image src="/edify.png" alt="login icon" width={54} height={54} />
          
                      </div>
                      <h1 className="text-[18px] font-extrabold text-[#1e293b] tracking-tight uppercase">
                       create new password
                       </h1>
                      <p className="text-[12px] text-[#64748b] mt-1 font-medium">
                        Your new password must be different from the previous one.
                      </p>
                    </div>
                     
                    

            

            {/* Info banner */}
            <div
              className="flex items-start gap-2.5 rounded-md px-3 py-2 mb-2"
              style={{ backgroundColor: hexToRgba(primaryColor, 0.06) }}
            >
              
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: hexToRgba(primaryColor, 0.85) }}
              >
                Choose a strong password (8+ characters) with uppercase letters, numbers, and
                symbols to keep your account secure.
                
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide ml-0.5">
                  New Password
                </label>
                <div className="relative py-1">
                  <ThemedInput
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    icon={<Lock size={12} />}
                    className="pr-10"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: showPassword ? primaryColor : "#94a3b8" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = primaryColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = showPassword
                        ? primaryColor
                        : "#94a3b8")
                    }
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                {/* Strength meter */}
                {password && (
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
                  Confirm Password
                </label>
                <div className="relative py-1">
                  <ThemedInput
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-type new password"
                    icon={<Lock size={12} />}
                    className="pr-10"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: showConfirm ? primaryColor : "#94a3b8" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = primaryColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = showConfirm
                        ? primaryColor
                        : "#94a3b8")
                    }
                  >
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>

                  {/* Match indicator */}
                  {confirmPassword && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2">
                      <CheckCircle2
                        size={13}
                        style={{
                          color:
                            password === confirmPassword
                              ? "#22c55e"
                              : "#ef4444",
                          transition: "color 0.2s",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              

              {/* Submit */}
              <div className="pt-1">
                <ThemedButton
                  type="submit"
                  disabled={loading || status?.type === "success"}
                  className="w-full py-2 flex items-center justify-center gap-2 text-[12px] font-semibold rounded"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Reset Password</span>
                    </>
                  )}
                </ThemedButton>
              </div>
            </form>

            {/* Error message */}
              {status?.type === "error" && (
                <div className="flex items-center gap-2 text-red-600  mt-4 ">
                  <AlertCircle size={13} className="shrink-0" />
                  <span className="text-[11px] font-medium">{status.text}</span>
                </div>
              )}

            {/* Success banner */}
            {status?.type === "success" && (
              <div className="  flex items-center gap-2 font-medium text-[11px] text-emerald-700 mt-4 ">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>{status.text}</span>
              </div>
            )}

            {/* Footer */}
            <div className="mt-5 pt-4 text-center border-t border-gray-100">
              <Link
                href="/login"
                className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 transition-colors duration-200"
                style={{}}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = primaryColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#94a3b8")
                }
              >
                Cancel & Return to Login
              </Link>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
}