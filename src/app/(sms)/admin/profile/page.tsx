"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import useAuth from "@/lib/hooks/useAuth";
import { ConfigProvider, Switch } from "antd";
import {
  Mail, Shield, Camera, Save, X,
  CheckCircle2, AlertCircle, Loader2,
  School, MapPin, Phone, ShieldCheck,
  User, ImageIcon, Hash,
} from "lucide-react";
import { SchoolServices } from "@/services/schoolServices";
import cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  return photo.startsWith("http") ? photo : `${BASE_URL}${photo}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface SchoolData {
  id: number;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  logo?: string | null;
  logo_url?: string | null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ w = "100%", h = 14, r = 999 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
      style={{ width: w, height: h, borderRadius: r }}
    />
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ name, photo, size = 96 }: { name: string; photo?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  const ini = (name || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        backgroundColor: "rgba(255,255,255,0.2)",
      }}
    >
      {ini}
    </div>
  );
}

// ─── Photo Upload Card ────────────────────────────────────────────────────────
function PhotoUploadCard({
  primaryColor,
  currentPhoto,
  onSaved,
  onToast,
}: {
  primaryColor: string;
  currentPhoto?: string | null;
  onSaved: (newUrl: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
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
  const handleCancel = () => {
    setPreview(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      // TODO: replace with your admin photo update endpoint
      // const fd = new FormData();
      // fd.append("photo", file);
      // const res = await UserServices.updateAdminPhoto(fd);
      // onSaved(resolvePhoto(res?.photo) || preview || "");
      await new Promise((r) => setTimeout(r, 800));
      onSaved(preview || "");
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onToast("Profile photo updated!", "success");
    } catch (error: any) {
      let msg = "Failed to update photo";
      const data = error?.response?.data;
      if (data) {
        if (typeof data === "object") {
          const key = Object.keys(data)[0];
          msg = Array.isArray(data[key]) ? data[key][0] : data[key] || data.detail || msg;
        } else if (typeof data === "string") {
          msg = data;
        }
      }
      onToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-4">
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
        <div className="flex flex-col items-center gap-3">
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
            <p className="text-[10px] text-gray-400 mt-0.5">
              {file ? (file.size / 1024).toFixed(0) + " KB" : ""}
            </p>
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

// ─── School Logo Upload ───────────────────────────────────────────────────────
function SchoolLogoUpload({
  primaryColor,
  currentLogo,
  onFile,
  schoolId,
  onSaved,
  onToast,
}: {
  primaryColor: string;
  currentLogo: string;
  onFile: (f: File | null, preview: string) => void;
  schoolId: number | null;
  onSaved: (newLogoUrl: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentLogo);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { setPreview(currentLogo); }, [currentLogo]);

  const pickFile = (f: File) => {
    if (f.size > 2 * 1024 * 1024) { onToast("Logo must be under 2 MB", "error"); return; }
    if (!f.type.startsWith("image/")) { onToast("Please select an image file", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPreview(url);
      setFile(f);
      onFile(f, url);
    };
    reader.readAsDataURL(f);
  };

  const handleSaveLogo = async () => {
    if (!file || !schoolId) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      await SchoolServices.updateDetails(schoolId, fd);
      onSaved(preview);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onToast("School logo updated!", "success");
      SchoolServices.clearCache();
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = "Failed to update logo";
      if (data?.detail) msg = data.detail;
      onToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPreview(currentLogo);
    setFile(null);
    onFile(null, currentLogo);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
      <h2 className="text-[12px] font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Camera size={14} style={{ color: primaryColor }} /> You can change school logo
      </h2>

      {!file ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
          className="relative rounded border-2 border-dashed p-2 text-center cursor-pointer transition-all duration-200 select-none"
          style={{
            borderColor: dragging ? primaryColor : primaryColor + "50",
            backgroundColor: dragging ? primaryColor + "10" : primaryColor + "05",
          }}
        >
          {preview && (
            <div className="flex justify-center mb-2">
              <img
                src={preview}
                alt="current logo"
                className="w-20 h-20 rounded-full object-contain border-2"
                style={{ borderColor: primaryColor + "40" }}
              />
            </div>
          )}
          <p className="text-[13px] font-bold mb-1" style={{ color: primaryColor }}>
            {preview ? "Click or drag to replace logo" : "Click or drag to upload logo"}
          </p>
          <p className="text-[11px] text-gray-400">PNG (transparent) · Max 2 MB · 512×512px+</p>
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
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={preview}
              alt="Logo preview"
              className="w-24 h-24 rounded-xl object-contain border-4"
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
            <p className="text-[10px] text-gray-400 mt-0.5">
              {file ? (file.size / 1024).toFixed(0) + " KB" : ""}
            </p>
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-gray-200 text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X size={12} /> Cancel
            </button>
            <button
              onClick={handleSaveLogo}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-white text-[12px] font-black transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? "Saving…" : "Save Logo"}
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
      />
    </div>
  );
}

// ─── TInput ───────────────────────────────────────────────────────────────────
function TInput({
  label, icon: Icon, placeholder, type = "text", value, onChange, primaryColor, disabled,
}: {
  label: string; icon: any; placeholder?: string; type?: string;
  value: string; onChange: (v: string) => void; primaryColor: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
        <Icon size={10} /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-gray-200 rounded-full px-4 py-2 text-[13px] font-medium text-gray-700 bg-white focus:outline-none focus:border-current disabled:bg-gray-50 disabled:cursor-default transition-all"
        onFocus={(e) => (e.target.style.borderColor = primaryColor)}
        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
      />
    </div>
  );
}



type Tab = "profile" | "school" | "password";

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminProfilePage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Admin personal data
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhoto, setAdminPhoto] = useState("");
  const [schoolId, setSchoolId] = useState<number | null>(null);

  // School data
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

  // School form
  const [sName, setSName] = useState("");
  const [sCode, setSCode] = useState("");
  const [sAddress, setSAddress] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sActive, setSActive] = useState(true);


 

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const cookieRaw = cookies.get("user_info");
      const cookieUser = cookieRaw ? JSON.parse(cookieRaw) : null;

      const name = user?.name || cookieUser?.name || cookieUser?.full_name || "";
      setAdminName(name);
      setAdminEmail(user?.email || cookieUser?.email || "");

      const photoRaw = cookieUser?.photo || (user as any)?.photo;
      if (photoRaw) setAdminPhoto(resolvePhoto(photoRaw));

      const sid = user?.school_id || user?.school || cookieUser?.school_id || cookieUser?.school;
      if (sid) {
        setSchoolId(sid);
        setSchoolLoading(true);
        try {
          const res = await SchoolServices.getSingleSchool(sid);
          const data: SchoolData = res?.data || res;
          setSchoolData(data);
          setSName(data.name || "");
          setSCode(data.code || "");
          setSAddress(data.address || "");
          setSPhone(data.phone || "");
          setSEmail(data.email || "");
          setSActive(data.is_active ?? true);
        } catch (e) {
          console.error("School fetch error:", e);
        } finally {
          setSchoolLoading(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Save school ───────────────────────────────────────────────────────────
  const handleSaveSchool = async () => {
    if (!schoolId) return;
    setSchoolSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", sName);
      fd.append("code", sCode);
      fd.append("address", sAddress);
      fd.append("phone", sPhone);
      fd.append("email", sEmail);
      fd.append("is_active", String(sActive));
      if (pendingLogoFile) fd.append("logo", pendingLogoFile);

      await SchoolServices.updateDetails(schoolId, fd); 
      setPendingLogoFile(null);
      const res = await SchoolServices.getSingleSchool(schoolId);
      const data: SchoolData = res?.data || res;
      setSchoolData(data);
      setToast({ msg: "School details updated successfully!", type: "success" });
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = "Failed to update school";
      if (data && typeof data === "object") {
        if (data.detail) {
          msg = data.detail;
        } else {
          const key = Object.keys(data)[0];
          const val = data[key];
          const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ");
          msg = `${fieldName}: ${Array.isArray(val) ? val[0] : val}`;
        }
      } else if (typeof data === "string") {
        msg = data;
      }
      setToast({ msg, type: "error" });
    } finally {
      setSchoolSaving(false);
    }
  };

  

  const currentLogoUrl = resolvePhoto(schoolData?.logo_url || schoolData?.logo);

  // Derived stats
  const schoolStats = [
    { label: "School", value: schoolData?.name ? schoolData.name.split(" ")[0] : "—" },
    { label: "Code", value: schoolData?.code || "—" },
    { label: "Status", value: schoolData?.is_active ? "Active" : "Inactive" },
  ];

  return (
    <div className="min-h-screen">
      <div className="space-y-2">

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <div
          className="relative rounded overflow-hidden shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 60%, ${primaryColor}88 100%)`,
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.07] pointer-events-none" />
          <div className="absolute top-8 -right-4 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none" />
          <div className="absolute -bottom-12 left-28 w-48 h-48 rounded-full bg-white/[0.05] pointer-events-none" />

          <div className="relative py-3 px-2 flex flex-col sm:flex-row items-center sm:items-end gap-5">
    

            {/* Name + info */}
            <div className="flex-1 text-center sm:text-left pb-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Admin Profile</p>
              {loading ? (
                <>
                  <Sk w={200} h={28} r={999} />
                  <div className="mt-2"><Sk w={160} h={14} r={999} /></div>
                </>
              ) : (
                <>
                  <h1 className="text-white text-2xl font-black tracking-tight leading-tight">
                    {adminName || "School Admin"}
                  </h1>
                  <p className="text-white/60 text-[12px] mt-0.5">{adminEmail}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                    <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                      School Admin
                    </span>
                    {schoolData?.name && (
                      <span className="bg-white/15 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full border border-white/15 flex items-center gap-1">
                        <School size={8} /> {schoolData.name}
                      </span>
                    )}
                    {schoolData?.code && (
                      <span className="bg-white/15 text-white/90 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/15">
                        {schoolData.code}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        schoolData?.is_active
                          ? "bg-white/10 border-white/10 text-white/70"
                          : "bg-rose-500/20 border-rose-300/20 text-rose-200"
                      }`}
                    >
                      <ShieldCheck size={8} />
                      {schoolData?.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats strip */}
          {!loading && (
            <div className="relative border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
              {schoolStats.map(({ label, value }) => (
                <div key={label} className="py-3 text-center">
                  <p className="text-white text-base font-black truncate px-2">{value}</p>
                  <p className="text-white/50 text-[9px] font-black uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ TABS ════════════════════════════════════════════════════════ */}
        <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm border border-gray-100 w-fit">
          {(
            [
              { id: "profile" as Tab, label: "Profile" },
              { id: "school" as Tab, label: "School Details" },
              
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id ? "text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
              style={activeTab === tab.id ? { backgroundColor: primaryColor } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══ PROFILE TAB ═════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Left: personal + school info (read-only display) */}
            <div className="md:col-span-2 bg-white rounded shadow-sm border border-gray-100 p-2">
              <h2 className="text-[14px] font-black text-gray-800 mb-2 flex items-center gap-2">
                <User size={14} style={{ color: primaryColor }} /> Personal Information
              </h2>
              <div className="space-y-2">
                {loading ? (
                  [0, 1, 2].map((i) => <Sk key={i} h={38} r={999} />)
                ) : (
                  [
                    { label: "Full Name", value: adminName, icon: User },
                    { label: "Email", value: adminEmail, icon: Mail },
                    
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Icon size={10} /> {label}
                      </label>
                      <div className="px-4 text-[13px] font-medium text-gray-700 min-h-[38px] flex items-center">
                        {value || <span className="text-gray-300">Not set</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* School quick info */}
              {schoolData && (
                <>
                  <h2 className="text-[14px] font-black text-gray-800 mt-4 mb-2 flex items-center gap-2">
                    <School size={14} style={{ color: primaryColor }} /> School Information
                  </h2>
                  <div className="space-y-2">
                    {loading ? (
                      [0, 1, 2].map((i) => <Sk key={i} h={38} r={999} />)
                    ) : (
                      [
                        { label: "School Name", value: schoolData.name, icon: School },
                        { label: "Address", value: schoolData.address || "—", icon: MapPin },
                        { label: "Phone", value: schoolData.phone || "—", icon: Phone },
                       
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label}>
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Icon size={10} /> {label}
                          </label>
                          <div className="px-4 text-[13px] font-medium text-gray-700 min-h-[38px] flex items-center">
                            {value || <span className="text-gray-300">Not set</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
            

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
                      { label: "Email", value: adminEmail, icon: Mail },
                      { label: "Role", value: "School Admin", icon: Shield },
                      { label: "School Code", value: schoolData?.code || "—", icon: Hash },
                      { label: "Status", value: schoolData?.is_active ? "Active" : "Inactive", icon: ShieldCheck },
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

              {/* School logo preview */}
              {currentLogoUrl && (
                <div className="bg-white rounded shadow-sm border border-gray-100 p-3 flex flex-col items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">School Logo</p>
                  <img
                    src={currentLogoUrl}
                    alt="School logo"
                    className="w-20 h-20 object-contain rounded-xl border border-gray-100"
                  />
                  <p className="text-[11px] text-gray-500 font-semibold text-center">{schoolData?.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ SCHOOL DETAILS TAB ══════════════════════════════════════════ */}
        {activeTab === "school" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Form */}
            <div className="md:col-span-2 bg-white rounded shadow-sm border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-black text-gray-800">School Details</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Update your school's information</p>
                </div>
                <span
                  className="text-[11px] font-black px-3 py-1 rounded-full"
                  style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                >
                  {schoolData?.code || "—"}
                </span>
              </div>

              {schoolLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2, 3, 4].map((i) => <Sk key={i} h={42} r={999} />)}
                </div>
              ) : (
                <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
                  <div className="space-y-4">
                    <TInput
                      label="School Name"
                      icon={School}
                      placeholder="Enter school name"
                      value={sName}
                      onChange={setSName}
                      primaryColor={primaryColor}
                    />

  <div className="mb-4">
  <TInput 
    label="Address" 
    icon={MapPin} 
    placeholder="Full street address, City, District" 
    value={sAddress} 
    onChange={setSAddress} 
    primaryColor={primaryColor} 
  />
</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TInput label="Phone Number" icon={Phone} placeholder="98XXXXXXXX" value={sPhone} onChange={setSPhone} primaryColor={primaryColor} />
                      <TInput label="Email Address" icon={Mail} type="email" placeholder="contact@school.com" value={sEmail} onChange={setSEmail} primaryColor={primaryColor} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TInput label="School Code" icon={Hash} placeholder="e.g. SCH001" value={sCode} onChange={setSCode} primaryColor={primaryColor} />
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
                          <ShieldCheck size={10} /> School Status
                        </label>
                        <div
                          className="flex items-center justify-between border border-gray-200 rounded-full px-4 py-2 bg-white"
                          style={{ height: 38 }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor + "15" }}>
                              <ShieldCheck size={11} style={{ color: primaryColor }} />
                            </div>
                            <span className="text-[13px] font-bold text-gray-700">{sActive ? "Active" : "Inactive"}</span>
                          </div>
                          <Switch size="small" checked={sActive} onChange={setSActive} style={{ backgroundColor: sActive ? primaryColor : undefined }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-50">
                    <button
                      onClick={fetchData}
                      className="px-5 py-2 rounded-full border border-gray-200 text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSaveSchool}
                      disabled={schoolSaving}
                      className="flex items-center gap-2 px-6 py-2 rounded-full text-white text-[12px] font-black transition-all hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {schoolSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {schoolSaving ? "Saving…" : "Save School Details"}
                    </button>
                  </div>
                </ConfigProvider>
              )}
            </div>

            {/* Right: logo upload */}
            <div className="space-y-4">
              {/* ✅ Self-contained logo upload with save button */}
              <SchoolLogoUpload
                primaryColor={primaryColor}
                currentLogo={currentLogoUrl}
                schoolId={schoolId}
                onFile={(f, _preview) => setPendingLogoFile(f)}
                onSaved={(newLogoUrl) => {
                  setSchoolData(prev => prev ? { ...prev, logo_url: newLogoUrl } : prev);
                }}
                onToast={(msg, type) => setToast({ msg, type })}
              />

              {/* Logo guidelines */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-3 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Logo guidelines</p>
                <ul className="space-y-1.5">
                  {[
                    "PNG with transparent background",
                    "512×512px or larger recommended",
                    "Max file size: 2 MB",
                    "Appears in sidebar and reports",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-[11px] text-gray-400">
                      <CheckCircle2 size={10} className="mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sidebar preview */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-3 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Sidebar preview</p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="w-7 h-7 flex-shrink-0">
                    {currentLogoUrl ? (
                      <img src={currentLogoUrl} alt="logo" className="w-full h-full object-contain rounded" />
                    ) : (
                      <div className="w-full h-full grid grid-cols-2 gap-0.5 p-1 bg-gray-200 rounded">
                        {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-400 rounded-sm" />)}
                      </div>
                    )}
                  </div>
                  <span className="text-[12px] font-bold text-gray-700 truncate">{sName || "School Name"}</span>
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