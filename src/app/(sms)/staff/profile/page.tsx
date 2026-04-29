"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import useAuth from "@/lib/hooks/useAuth";
import { StaffServices } from "@/services/staffServices";
import {
  Mail, Shield, Camera, Save, X,
  CheckCircle2, AlertCircle, Loader2, Hash,
  Layers, FileText, ExternalLink,
  User, ImageIcon, Briefcase, Phone, MapPin,
  Receipt, Tag, CreditCard, IndianRupee,
} from "lucide-react";

// ─── Backend types ─────────────────────────────────────────────────────────────
interface StaffInfo {
  id: number;
  // name variants from both list and dashboard endpoints
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  first_name_display?: string;
  last_name_display?: string;
  // email variants
  email?: string;
  user_email?: string;
  // photo — already absolute URL from your API
  photo?: string | null;
  photo_url?: string | null;
  // other fields
  code?: string;
  phone?: string;
  address?: string;
  designation?: string;
  gender?: string;
  created_at?: string;
  role?: string;
}

interface StaffDashboardResponse {
  // dashboard may return staff directly or nested
  staff?: StaffInfo;
  // some backends return the staff fields at the top level
  id?: number;
  full_name?: string;
  user_email?: string;
  photo?: string | null;
  photo_url?: string | null;
  designation?: string;
  code?: string;
  recent_payments?: Payment[];
  recent_expenses?: Expense[];
  fee_types?: FeeType[];
  fee_structures?: FeeStructure[];
  role?: string;
}

interface Payment {
  id: number;
  student_name: string;
  fee_type_name: string;
  amount: string | number;
  payment_method: string;
  paid_at: string;
}

interface Expense {
  id: number;
  title: string;
  expense_type: string;
  amount: string | number;
  date: string;
}

interface FeeType {
  id: number;
  name: string;
  code: string;
}

interface FeeStructure {
  id: number;
  fee_type_name: string;
  class_name: string;
  amount: string | number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Photo is already an absolute URL from the API (http://127.0.0.1:8000/media/...)
// Just return it directly; only prepend BASE_URL if it's a relative path
function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  return `${BASE_URL}${photo}`;
}

function toNum(v: any): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ w = "100%", h = 14, r = 999 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
      style={{ width: w, height: h, borderRadius: r }}
    />
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-5 right-5 z-[999] flex items-center gap-2.5 px-5 py-3 rounded-full shadow-2xl text-white text-[13px] font-semibold transition-all duration-300 ${
        type === "success" ? "bg-emerald-500" : "bg-rose-500"
      }`}
    >
      {type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ name, photo, size = 96 }: { name: string; photo?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  const initials = (name || "S").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (photo && !err) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setErr(true)}
        className="rounded-full object-cover border-4 border-white/40"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full border-4 border-white/40 flex items-center justify-center font-black text-white"
      style={{ width: size, height: size, fontSize: size * 0.32, backgroundColor: "rgba(255,255,255,0.2)" }}
    >
      {initials}
    </div>
  );
}

// ─── Photo Upload Card ─────────────────────────────────────────────────────────
function PhotoUploadCard({
  primaryColor,
  currentPhoto,
  onSaved,
  onToast,
  staffId,
}: {
  primaryColor: string;
  currentPhoto?: string | null;
  onSaved: (newPhotoUrl: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  staffId: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pickFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) { onToast("Photo must be under 5 MB", "error"); return; }
    if (!f.type.startsWith("image/")) { onToast("Please select an image file", "error"); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await StaffServices.updatestaff(staffId, fd);
      onSaved(resolvePhoto(res?.photo_url || res?.photo) || preview || "");
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onToast("Profile photo updated!", "success");
      StaffServices.clearCache();
    } catch {
      onToast("Failed to update photo", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
      <h2 className="text-[12px] font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Camera size={14} style={{ color: primaryColor }} /> You can change profile photo
      </h2>

      {!preview ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="relative rounded border-2 border-dashed p-2 text-center cursor-pointer transition-all duration-200 select-none"
          style={{
            borderColor: dragging ? primaryColor : primaryColor + "50",
            backgroundColor: dragging ? primaryColor + "10" : primaryColor + "05",
          }}
        >
          {currentPhoto && (
            <div className="flex justify-center mb-2">
              <img
                src={currentPhoto}
                alt="current"
                className="w-20 h-20 rounded-full object-cover border-4"
                style={{ borderColor: primaryColor + "40" }}
              />
            </div>
          )}
          <p className="text-[13px] font-bold mb-1" style={{ color: primaryColor }}>
            {currentPhoto ? "Click or drag to replace photo" : "Click or drag to upload photo"}
          </p>
          <p className="text-[11px] text-gray-400">JPG, PNG, WEBP · Max 5 MB</p>
          {dragging && (
            <div
              className="absolute inset-0 rounded flex items-center justify-center"
              style={{ backgroundColor: primaryColor + "15" }}
            >
              <p className="text-[13px] font-black" style={{ color: primaryColor }}>Drop to select</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover border-4"
              style={{ borderColor: primaryColor }}
            />
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <ImageIcon size={12} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[12px] font-bold text-gray-700 truncate max-w-[180px]">{file?.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{file ? (file.size / 1024).toFixed(0) + " KB" : ""}</p>
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-gray-200 text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X size={12} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-white text-[12px] font-black transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? "Saving…" : "Save Photo"}
            </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleInput} />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function StaffProfilePage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "activity">("profile");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dash: StaffDashboardResponse = await StaffServices.getStaffDashboard();

      // Handle both { staff: {...} } and flat { id, full_name, photo, ... } shapes
      const staffObj: StaffInfo = dash.staff ?? {
        id: dash.id!,
        full_name: dash.full_name,
        user_email: dash.user_email,
        photo: dash.photo,
        photo_url: dash.photo_url,
        designation: dash.designation,
        code: dash.code,
      };

      console.log("Staff dashboard raw:", dash);
      console.log("Staff obj resolved:", staffObj);
      console.log("Photo field:", staffObj.photo_url || staffObj.photo);

      setStaffInfo(staffObj);
      setRecentPayments(dash.recent_payments ?? []);
      setRecentExpenses(dash.recent_expenses ?? []);
      setFeeTypes(dash.fee_types ?? []);
      setFeeStructures(dash.fee_structures ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Photo saved callback ────────────────────────────────────────────────────
  const handlePhotoSaved = (newPhotoUrl: string) => {
    setStaffInfo((prev) => prev ? { ...prev, photo: newPhotoUrl, photo_url: newPhotoUrl } : prev);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const staffName = staffInfo
    ? staffInfo.full_name ||
      staffInfo.name ||
      `${staffInfo.first_name_display || staffInfo.first_name || ""} ${
        staffInfo.last_name_display || staffInfo.last_name || ""
      }`.trim() ||
      "—"
    : "—";

  const staffEmail = staffInfo?.user_email || staffInfo?.email || "—";

  // photo_url is already absolute (http://127.0.0.1:8000/media/...)
  // prefer photo_url, fall back to photo
  const staffPhoto = resolvePhoto(staffInfo?.photo_url || staffInfo?.photo);

  const totalCollected = recentPayments.reduce((s, p) => s + toNum(p.amount), 0);
  const totalExpenses = recentExpenses.reduce((s, p) => s + toNum(p.amount), 0);

  

  const METHOD_COLORS: Record<string, string> = {
    cash: "#10b981", online: "#6366f1", cheque: "#f59e0b",
    bank: "#0ea5e9", card: "#8b5cf6",
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-4">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div
          className="relative rounded overflow-hidden shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 60%, ${primaryColor}88 100%)`,
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.07] pointer-events-none" />
          <div className="absolute top-8 -right-4 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none" />
          <div className="absolute -bottom-12 left-28 w-48 h-48 rounded-full bg-white/[0.05] pointer-events-none" />

          <div className="relative py-3 px-2 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="rounded-full p-1 bg-white/20 backdrop-blur-sm">
                {loading ? (
                  <div className="rounded-full bg-white/20" style={{ width: 96, height: 96 }} />
                ) : (
                  <UserAvatar name={staffName} photo={staffPhoto} size={96} />
                )}
              </div>
            </div>

            {/* Name + badges */}
            <div className="flex-1 text-center sm:text-left pb-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Staff Profile</p>
              {loading ? (
                <>
                  <Sk w={200} h={28} r={999} />
                  <div className="mt-2"><Sk w={160} h={14} r={999} /></div>
                </>
              ) : (
                <>
                  <h1 className="text-white text-2xl font-black tracking-tight leading-tight">
                    {staffName}
                  </h1>
                  <p className="text-white/60 text-[12px] mt-0.5">{staffEmail}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                    <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                      Staff
                    </span>
                    {staffInfo?.designation && (
                      <span className="bg-white/15 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full border border-white/15 flex items-center gap-1">
                        <Briefcase size={8} /> {staffInfo.designation}
                      </span>
                    )}
                    {staffInfo?.code && (
                      <span className="bg-white/15 text-white/90 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/15">
                        {staffInfo.code}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-full px-5 py-3">
            <AlertCircle size={14} className="text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 flex-1">{error}</p>
            <button onClick={fetchDashboard} className="text-[11px] font-bold text-rose-500 underline">
              Retry
            </button>
          </div>
        )}

        

        {/* ══ PROFILE TAB ═════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* ── Left: info fields ── */}
            <div className="md:col-span-2 bg-white rounded shadow-sm border border-gray-100 p-2">
              <h2 className="text-[14px] font-black text-gray-800 mb-2 flex items-center gap-2">
                <User size={14} style={{ color: primaryColor }} /> Personal Information
              </h2>
              <div className="space-y-2">
                {([
                  { label: "Full Name",    value: staffName,                   icon: User },
                  { label: "Email",        value: staffEmail,                  icon: Mail },
                  { label: "Designation",  value: staffInfo?.designation || "—", icon: Briefcase },
                  { label: "Code",         value: staffInfo?.code || "—",        icon: Hash },
                  { label: "Phone",        value: staffInfo?.phone || "—",     icon: Mail },
                  { label: "Address",      value: staffInfo?.address || "—",   icon: Mail },
                ] as const).map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Icon size={10} /> {label}
                    </label>
                    {loading ? (
                      <Sk h={38} r={999} />
                    ) : (
                      <div className="px-4 text-[13px] font-medium text-gray-700 min-h-[38px] flex items-center">
                        {value || <span className="text-gray-300">Not set</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Finance summary section */}
              {(recentPayments.length > 0 || recentExpenses.length > 0) && (
                <>
                  <h2 className="text-[14px] font-black text-gray-800 mt-4 mb-2 flex items-center gap-2">
                    <IndianRupee size={14} style={{ color: primaryColor }} /> Finance Overview
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Collected", value: `Rs. ${totalCollected.toLocaleString()}`, color: "#10b981", bg: "#f0fdf4" },
                      { label: "Total Expenses",  value: `Rs. ${totalExpenses.toLocaleString()}`,  color: "#ef4444", bg: "#fff1f2" },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className="flex flex-col items-center rounded-xl py-3" style={{ backgroundColor: bg }}>
                        <p className="text-[13px] font-black tabular-nums" style={{ color }}>{value}</p>
                        <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="space-y-4">

              {/* Photo upload */}
              {staffInfo && (
                <PhotoUploadCard
                  primaryColor={primaryColor}
                  currentPhoto={staffPhoto}
                  staffId={staffInfo.id}
                  onSaved={handlePhotoSaved}
                  onToast={(msg, type) => setToast({ msg, type })}
                />
              )}
              {loading && <Sk h={200} r={24} />}

              {/* Account info */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
                <h2 className="text-[14px] font-black text-gray-800 mb-3 flex items-center gap-2">
                  <Shield size={14} style={{ color: primaryColor }} /> Account Info
                </h2>
                <div className="space-y-1">
                  {loading ? (
                    [0, 1, 2].map((i) => <Sk key={i} h={44} r={999} />)
                  ) : (
                    [
                      { label: "Email",       value: staffEmail,                    icon: Mail },
                      { label: "Designation", value: staffInfo?.designation || "—", icon: Briefcase },
                      { label: "Role",   value: staffInfo?.role || "—" ,    icon: Tag },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: primaryColor + "12" }}
                        >
                          <Icon size={13} style={{ color: primaryColor }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{label}</p>
                          <p className="text-[12px] font-bold text-gray-700 truncate">{value}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

             

            
            </div>
          </div>
        )}

        

        <p className="text-center text-[11px] text-gray-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}