// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import { useTheme } from "@/lib/context/ThemeContext";
// import useAuth from "@/lib/hooks/useAuth";
// import { StaffServices } from "@/services/staffServices";
// import {
//   Mail, Shield, Camera, Save, X,
//   CheckCircle2, AlertCircle, Loader2, Hash,
//   Layers, FileText, ExternalLink,
//   User, ImageIcon, Briefcase, Phone, MapPin,
//   Receipt, Tag, CreditCard, IndianRupee,
// } from "lucide-react";

// // ─── Backend types ─────────────────────────────────────────────────────────────
// interface StaffInfo {
//   id: number;
//   // name variants from both list and dashboard endpoints
//   name?: string;
//   full_name?: string;
//   first_name?: string;
//   last_name?: string;
//   first_name_display?: string;
//   last_name_display?: string;
//   // email variants
//   email?: string;
//   user_email?: string;
//   // photo — already absolute URL from your API
//   photo?: string | null;
//   photo_url?: string | null;
//   // other fields
//   code?: string;
//   phone?: string;
//   address?: string;
//   designation?: string;
//   gender?: string;
//   created_at?: string;
//   role?: string;
// }

// interface StaffDashboardResponse {
//   // dashboard may return staff directly or nested
//   staff?: StaffInfo;
//   // some backends return the staff fields at the top level
//   id?: number;
//   full_name?: string;
//   user_email?: string;
//   photo?: string | null;
//   photo_url?: string | null;
//   designation?: string;
//   code?: string;
//   recent_payments?: Payment[];
//   recent_expenses?: Expense[];
//   fee_types?: FeeType[];
//   fee_structures?: FeeStructure[];
//   role?: string;
// }

// interface Payment {
//   id: number;
//   student_name: string;
//   fee_type_name: string;
//   amount: string | number;
//   payment_method: string;
//   paid_at: string;
// }

// interface Expense {
//   id: number;
//   title: string;
//   expense_type: string;
//   amount: string | number;
//   date: string;
// }

// interface FeeType {
//   id: number;
//   name: string;
//   code: string;
// }

// interface FeeStructure {
//   id: number;
//   fee_type_name: string;
//   class_name: string;
//   amount: string | number;
// }

// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// // Photo is already an absolute URL from the API (http://127.0.0.1:8000/media/...)
// // Just return it directly; only prepend BASE_URL if it's a relative path
// function resolvePhoto(photo?: string | null): string {
//   if (!photo) return "";
//   if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
//   return `${BASE_URL}${photo}`;
// }

// function toNum(v: any): number {
//   const n = parseFloat(String(v));
//   return isNaN(n) ? 0 : n;
// }

// // ─── Skeleton ──────────────────────────────────────────────────────────────────
// function Sk({ w = "100%", h = 14, r = 999 }: { w?: string | number; h?: number; r?: number }) {
//   return (
//     <div
//       className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
//       style={{ width: w, height: h, borderRadius: r }}
//     />
//   );
// }

// // ─── Toast ─────────────────────────────────────────────────────────────────────
// function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
//   useEffect(() => {
//     const t = setTimeout(onClose, 3500);
//     return () => clearTimeout(t);
//   }, [onClose]);
//   return (
//     <div
//       className={`fixed bottom-5 right-5 z-[999] flex items-center gap-2.5 px-5 py-3 rounded-full shadow-2xl text-white text-[13px] font-semibold transition-all duration-300 ${
//         type === "success" ? "bg-emerald-500" : "bg-rose-500"
//       }`}
//     >
//       {type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
//       {msg}
//     </div>
//   );
// }

// // ─── Avatar ────────────────────────────────────────────────────────────────────
// function UserAvatar({ name, photo, size = 96 }: { name: string; photo?: string | null; size?: number }) {
//   const [err, setErr] = useState(false);
//   const initials = (name || "S").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
//   if (photo && !err) {
//     return (
//       <img
//         src={photo}
//         alt={name}
//         onError={() => setErr(true)}
//         className="rounded-full object-cover border-4 border-white/40"
//         style={{ width: size, height: size }}
//       />
//     );
//   }
//   return (
//     <div
//       className="rounded-full border-4 border-white/40 flex items-center justify-center font-black text-white"
//       style={{ width: size, height: size, fontSize: size * 0.32, backgroundColor: "rgba(255,255,255,0.2)" }}
//     >
//       {initials}
//     </div>
//   );
// }

// // ─── Photo Upload Card ─────────────────────────────────────────────────────────
// function PhotoUploadCard({
//   primaryColor,
//   currentPhoto,
//   onSaved,
//   onToast,
//   staffId,
// }: {
//   primaryColor: string;
//   currentPhoto?: string | null;
//   onSaved: (newPhotoUrl: string) => void;
//   onToast: (msg: string, type: "success" | "error") => void;
//   staffId: number;
// }) {
//   const fileRef = useRef<HTMLInputElement>(null);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [file, setFile] = useState<File | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [dragging, setDragging] = useState(false);

//   const pickFile = (f: File) => {
//     if (f.size > 5 * 1024 * 1024) { onToast("Photo must be under 5 MB", "error"); return; }
//     if (!f.type.startsWith("image/")) { onToast("Please select an image file", "error"); return; }
//     setFile(f);
//     const reader = new FileReader();
//     reader.onload = (ev) => setPreview(ev.target?.result as string);
//     reader.readAsDataURL(f);
//   };

//   const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const f = e.target.files?.[0];
//     if (f) pickFile(f);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setDragging(false);
//     const f = e.dataTransfer.files?.[0];
//     if (f) pickFile(f);
//   };

//   const handleSave = async () => {
//     if (!file) return;
//     setSaving(true);
//     try {
//       const fd = new FormData();
//       fd.append("photo", file);
//       const res = await StaffServices.updatestaff(staffId, fd);
//       onSaved(resolvePhoto(res?.photo_url || res?.photo) || preview || "");
//       setPreview(null);
//       setFile(null);
//       if (fileRef.current) fileRef.current.value = "";
//       onToast("Profile photo updated!", "success");
//       StaffServices.clearCache();
//     } catch {
//       onToast("Failed to update photo", "error");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleCancel = () => {
//     setPreview(null);
//     setFile(null);
//     if (fileRef.current) fileRef.current.value = "";
//   };

//   return (
//     <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
//       <h2 className="text-[12px] font-bold text-gray-800 mb-1 flex items-center gap-2">
//         <Camera size={14} style={{ color: primaryColor }} /> You can change profile photo
//       </h2>

//       {!preview ? (
//         <div
//           onClick={() => fileRef.current?.click()}
//           onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
//           onDragLeave={() => setDragging(false)}
//           onDrop={handleDrop}
//           className="relative rounded border-2 border-dashed p-2 text-center cursor-pointer transition-all duration-200 select-none"
//           style={{
//             borderColor: dragging ? primaryColor : primaryColor + "50",
//             backgroundColor: dragging ? primaryColor + "10" : primaryColor + "05",
//           }}
//         >
//           {currentPhoto && (
//             <div className="flex justify-center mb-2">
//               <img
//                 src={currentPhoto}
//                 alt="current"
//                 className="w-20 h-20 rounded-full object-cover border-4"
//                 style={{ borderColor: primaryColor + "40" }}
//               />
//             </div>
//           )}
//           <p className="text-[13px] font-bold mb-1" style={{ color: primaryColor }}>
//             {currentPhoto ? "Click or drag to replace photo" : "Click or drag to upload photo"}
//           </p>
//           <p className="text-[11px] text-gray-400">JPG, PNG, WEBP · Max 5 MB</p>
//           {dragging && (
//             <div
//               className="absolute inset-0 rounded flex items-center justify-center"
//               style={{ backgroundColor: primaryColor + "15" }}
//             >
//               <p className="text-[13px] font-black" style={{ color: primaryColor }}>Drop to select</p>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col items-center gap-4">
//           <div className="relative">
//             <img
//               src={preview}
//               alt="Preview"
//               className="w-24 h-24 rounded-full object-cover border-4"
//               style={{ borderColor: primaryColor }}
//             />
//             <div
//               className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
//               style={{ backgroundColor: primaryColor }}
//             >
//               <ImageIcon size={12} className="text-white" />
//             </div>
//           </div>
//           <div className="text-center">
//             <p className="text-[12px] font-bold text-gray-700 truncate max-w-[180px]">{file?.name}</p>
//             <p className="text-[10px] text-gray-400 mt-0.5">{file ? (file.size / 1024).toFixed(0) + " KB" : ""}</p>
//           </div>
//           <div className="flex gap-2 w-full">
//             <button
//               onClick={handleCancel}
//               className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-gray-200 text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
//             >
//               <X size={12} /> Cancel
//             </button>
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-white text-[12px] font-black transition-all hover:opacity-90 disabled:opacity-60"
//               style={{ backgroundColor: primaryColor }}
//             >
//               {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
//               {saving ? "Saving…" : "Save Photo"}
//             </button>
//           </div>
//         </div>
//       )}

//       <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleInput} />
//     </div>
//   );
// }

// // ─── Main ──────────────────────────────────────────────────────────────────────
// export default function StaffProfilePage() {
//   const { primaryColor } = useTheme();
//   const { user } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState<"profile" | "activity">("profile");
//   const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
//   const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
//   const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
//   const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
//   const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

//   // ── Fetch ───────────────────────────────────────────────────────────────────
//   const fetchDashboard = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const dash: StaffDashboardResponse = await StaffServices.getStaffDashboard();

//       // Handle both { staff: {...} } and flat { id, full_name, photo, ... } shapes
//       const staffObj: StaffInfo = dash.staff ?? {
//         id: dash.id!,
//         full_name: dash.full_name,
//         user_email: dash.user_email,
//         photo: dash.photo,
//         photo_url: dash.photo_url,
//         designation: dash.designation,
//         code: dash.code,
//       };

//       console.log("Staff dashboard raw:", dash);
//       console.log("Staff obj resolved:", staffObj);
//       console.log("Photo field:", staffObj.photo_url || staffObj.photo);

//       setStaffInfo(staffObj);
//       setRecentPayments(dash.recent_payments ?? []);
//       setRecentExpenses(dash.recent_expenses ?? []);
//       setFeeTypes(dash.fee_types ?? []);
//       setFeeStructures(dash.fee_structures ?? []);
//     } catch (e: any) {
//       setError(e?.message || "Failed to load profile");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

//   // ── Photo saved callback ────────────────────────────────────────────────────
//   const handlePhotoSaved = (newPhotoUrl: string) => {
//     setStaffInfo((prev) => prev ? { ...prev, photo: newPhotoUrl, photo_url: newPhotoUrl } : prev);
//   };

//   // ── Derived ─────────────────────────────────────────────────────────────────
//   const staffName = staffInfo
//     ? staffInfo.full_name ||
//       staffInfo.name ||
//       `${staffInfo.first_name_display || staffInfo.first_name || ""} ${
//         staffInfo.last_name_display || staffInfo.last_name || ""
//       }`.trim() ||
//       "—"
//     : "—";

//   const staffEmail = staffInfo?.user_email || staffInfo?.email || "—";

//   // photo_url is already absolute (http://127.0.0.1:8000/media/...)
//   // prefer photo_url, fall back to photo
//   const staffPhoto = resolvePhoto(staffInfo?.photo_url || staffInfo?.photo);

//   const totalCollected = recentPayments.reduce((s, p) => s + toNum(p.amount), 0);
//   const totalExpenses = recentExpenses.reduce((s, p) => s + toNum(p.amount), 0);

  

//   const METHOD_COLORS: Record<string, string> = {
//     cash: "#10b981", online: "#6366f1", cheque: "#f59e0b",
//     bank: "#0ea5e9", card: "#8b5cf6",
//   };

//   return (
//     <div className="min-h-screen">
//       <div className="space-y-4">

//         {/* ══ HERO ══════════════════════════════════════════════════════════ */}
//         <div
//           className="relative rounded overflow-hidden shadow-lg"
//           style={{
//             background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 60%, ${primaryColor}88 100%)`,
//           }}
//         >
//           {/* Decorative blobs */}
//           <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.07] pointer-events-none" />
//           <div className="absolute top-8 -right-4 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none" />
//           <div className="absolute -bottom-12 left-28 w-48 h-48 rounded-full bg-white/[0.05] pointer-events-none" />

//           <div className="relative py-3 px-2 flex flex-col sm:flex-row items-center sm:items-end gap-5">
//             {/* Avatar */}
//             <div className="relative shrink-0">
//               <div className="rounded-full p-1 bg-white/20 backdrop-blur-sm">
//                 {loading ? (
//                   <div className="rounded-full bg-white/20" style={{ width: 96, height: 96 }} />
//                 ) : (
//                   <UserAvatar name={staffName} photo={staffPhoto} size={96} />
//                 )}
//               </div>
//             </div>

//             {/* Name + badges */}
//             <div className="flex-1 text-center sm:text-left pb-1">
//               <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Staff Profile</p>
//               {loading ? (
//                 <>
//                   <Sk w={200} h={28} r={999} />
//                   <div className="mt-2"><Sk w={160} h={14} r={999} /></div>
//                 </>
//               ) : (
//                 <>
//                   <h1 className="text-white text-2xl font-black tracking-tight leading-tight">
//                     {staffName}
//                   </h1>
//                   <p className="text-white/60 text-[12px] mt-0.5">{staffEmail}</p>
//                   <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
//                     <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
//                       Staff
//                     </span>
//                     {staffInfo?.designation && (
//                       <span className="bg-white/15 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full border border-white/15 flex items-center gap-1">
//                         <Briefcase size={8} /> {staffInfo.designation}
//                       </span>
//                     )}
//                     {staffInfo?.code && (
//                       <span className="bg-white/15 text-white/90 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/15">
//                         {staffInfo.code}
//                       </span>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>

          
//         </div>

//         {/* ── Error ── */}
//         {error && (
//           <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-full px-5 py-3">
//             <AlertCircle size={14} className="text-rose-500 shrink-0" />
//             <p className="text-xs text-rose-700 flex-1">{error}</p>
//             <button onClick={fetchDashboard} className="text-[11px] font-bold text-rose-500 underline">
//               Retry
//             </button>
//           </div>
//         )}

        

//         {/* ══ PROFILE TAB ═════════════════════════════════════════════════ */}
//         {activeTab === "profile" && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

//             {/* ── Left: info fields ── */}
//             <div className="md:col-span-2 bg-white rounded shadow-sm border border-gray-100 p-2">
//               <h2 className="text-[14px] font-black text-gray-800 mb-2 flex items-center gap-2">
//                 <User size={14} style={{ color: primaryColor }} /> Personal Information
//               </h2>
//               <div className="space-y-2">
//                 {([
//                   { label: "Full Name",    value: staffName,                   icon: User },
//                   { label: "Email",        value: staffEmail,                  icon: Mail },
//                   { label: "Designation",  value: staffInfo?.designation || "—", icon: Briefcase },
//                   { label: "Code",         value: staffInfo?.code || "—",        icon: Hash },
//                   { label: "Phone",        value: staffInfo?.phone || "—",     icon: Mail },
//                   { label: "Address",      value: staffInfo?.address || "—",   icon: Mail },
//                 ] as const).map(({ label, value, icon: Icon }) => (
//                   <div key={label}>
//                     <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
//                       <Icon size={10} /> {label}
//                     </label>
//                     {loading ? (
//                       <Sk h={38} r={999} />
//                     ) : (
//                       <div className="px-4 text-[13px] font-medium text-gray-700 min-h-[38px] flex items-center">
//                         {value || <span className="text-gray-300">Not set</span>}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>

//               {/* Finance summary section */}
//               {(recentPayments.length > 0 || recentExpenses.length > 0) && (
//                 <>
//                   <h2 className="text-[14px] font-black text-gray-800 mt-4 mb-2 flex items-center gap-2">
//                     <IndianRupee size={14} style={{ color: primaryColor }} /> Finance Overview
//                   </h2>
//                   <div className="grid grid-cols-2 gap-3">
//                     {[
//                       { label: "Total Collected", value: `Rs. ${totalCollected.toLocaleString()}`, color: "#10b981", bg: "#f0fdf4" },
//                       { label: "Total Expenses",  value: `Rs. ${totalExpenses.toLocaleString()}`,  color: "#ef4444", bg: "#fff1f2" },
//                     ].map(({ label, value, color, bg }) => (
//                       <div key={label} className="flex flex-col items-center rounded-xl py-3" style={{ backgroundColor: bg }}>
//                         <p className="text-[13px] font-black tabular-nums" style={{ color }}>{value}</p>
//                         <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color }}>{label}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>

//             {/* ── Right column ── */}
//             <div className="space-y-4">

//               {/* Photo upload */}
//               {staffInfo && (
//                 <PhotoUploadCard
//                   primaryColor={primaryColor}
//                   currentPhoto={staffPhoto}
//                   staffId={staffInfo.id}
//                   onSaved={handlePhotoSaved}
//                   onToast={(msg, type) => setToast({ msg, type })}
//                 />
//               )}
//               {loading && <Sk h={200} r={24} />}

//               {/* Account info */}
//               <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
//                 <h2 className="text-[14px] font-black text-gray-800 mb-3 flex items-center gap-2">
//                   <Shield size={14} style={{ color: primaryColor }} /> Account Info
//                 </h2>
//                 <div className="space-y-1">
//                   {loading ? (
//                     [0, 1, 2].map((i) => <Sk key={i} h={44} r={999} />)
//                   ) : (
//                     [
//                       { label: "Email",       value: staffEmail,                    icon: Mail },
//                       { label: "Designation", value: staffInfo?.designation || "—", icon: Briefcase },
//                       { label: "Role",   value: staffInfo?.role || "—" ,    icon: Tag },
//                     ].map(({ label, value, icon: Icon }) => (
//                       <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
//                         <div
//                           className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
//                           style={{ backgroundColor: primaryColor + "12" }}
//                         >
//                           <Icon size={13} style={{ color: primaryColor }} />
//                         </div>
//                         <div className="min-w-0">
//                           <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{label}</p>
//                           <p className="text-[12px] font-bold text-gray-700 truncate">{value}</p>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>

             

            
//             </div>
//           </div>
//         )}

        

//         <p className="text-center text-[11px] text-gray-400 pb-2">
//           SchoolMS · Academic Management System · © {new Date().getFullYear()}
//         </p>
//       </div>

//       {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import useAuth from "@/lib/hooks/useAuth";
import { StaffServices } from "@/services/staffServices";
import {
  Mail, Shield, Camera, Save, X,
  CheckCircle2, AlertCircle, Loader2, Hash,
  User, ImageIcon, Briefcase, Tag,
  CalendarDays, TrendingUp, Clock, CheckCheck,
  XCircle, CalendarCheck, History,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface StaffInfo {
  id: number;
  name?: string; full_name?: string;
  email?: string; user_email?: string;
  photo?: string | null; photo_url?: string | null;
  code?: string; phone?: string; address?: string;
  designation?: string; gender?: string; role?: string;
}
interface DashboardSummary {
  total_students?: number; total_teachers?: number;
  total_staffs?: number;   total_enrollments?: number;
}
interface LeaveSummaryFlat {
  allocated_leave: number; used_leave: number; remaining_leave: number;
  casual_leave: number;    sick_leave: number;  festival_leave: number;
  maternity_leave: number; funeral_leave: number;
}
interface RecentLeave {
  id: number; leave_type: string;
  start_date: string; end_date: string;
  status: "pending" | "approved" | "rejected";
  is_half_day: boolean;
}
interface StaffDashboardResponse {
  staff?: StaffInfo; summary?: DashboardSummary;
  leave_summary?: LeaveSummaryFlat; recent_leaves?: RecentLeave[];
  id?: number; name?: string; email?: string;
  photo?: string | null; designation?: string; code?: string; role?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  return `${BASE_URL}${photo}`;
}

// ─── Leave type config ─────────────────────────────────────────────────────────
const LEAVE_TYPES: {
  key: keyof Pick<LeaveSummaryFlat,"casual_leave"|"sick_leave"|"festival_leave"|"maternity_leave"|"funeral_leave">;
  label: string; color: string; bgLight: string; textColor: string;
}[] = [
  { key: "casual_leave",    label: "Casual",    color: "#3b82f6", bgLight: "#eff6ff", textColor: "#1d4ed8" },
  { key: "sick_leave",      label: "Sick",      color: "#ef4444", bgLight: "#fff1f2", textColor: "#b91c1c" },
  { key: "festival_leave",  label: "Festival",  color: "#8b5cf6", bgLight: "#f5f3ff", textColor: "#6d28d9" },
  { key: "maternity_leave", label: "Maternity", color: "#f97316", bgLight: "#fff7ed", textColor: "#c2410c" },
  { key: "funeral_leave",   label: "Funeral",   color: "#64748b", bgLight: "#f8fafc", textColor: "#475569" },
];

const STATUS_CONFIG: Record<string,{label:string;bg:string;text:string;border:string}> = {
  approved: { label:"Approved", bg:"bg-green-50", text:"text-green-700", border:"border-green-200" },
  pending:  { label:"Pending",  bg:"bg-amber-50", text:"text-amber-700", border:"border-amber-200" },
  rejected: { label:"Rejected", bg:"bg-red-50",   text:"text-red-700",   border:"border-red-200"   },
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ w="100%", h=14, r=8 }: { w?: string|number; h?: number; r?: number }) {
  return <div className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
    style={{ width: w, height: h, borderRadius: r }} />;
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg:string; type:"success"|"error"; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-5 right-5 z-[999] flex items-center gap-2.5 px-5 py-3 rounded-full shadow-2xl text-white text-[13px] font-semibold ${type==="success"?"bg-emerald-500":"bg-rose-500"}`}>
      {type==="success" ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>} {msg}
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ name, photo, size=96 }: { name:string; photo?:string|null; size?:number }) {
  const [err, setErr] = useState(false);
  const initials = (name||"S").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  if (photo && !err)
    return <img src={photo} alt={name} onError={()=>setErr(true)}
      className="rounded-full object-cover border-4 border-white/40" style={{width:size,height:size}}/>;
  return (
    <div className="rounded-full border-4 border-white/40 flex items-center justify-center font-black text-white"
      style={{width:size,height:size,fontSize:size*0.32,backgroundColor:"rgba(255,255,255,0.2)"}}>
      {initials}
    </div>
  );
}

// ─── Photo Upload Card ─────────────────────────────────────────────────────────
function PhotoUploadCard({ primaryColor, currentPhoto, onSaved, onToast, staffId }: {
  primaryColor:string; currentPhoto?:string|null;
  onSaved:(url:string)=>void; onToast:(msg:string,type:"success"|"error")=>void; staffId:number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview,setPreview] = useState<string|null>(null);
  const [file,setFile] = useState<File|null>(null);
  const [saving,setSaving] = useState(false);
  const [dragging,setDragging] = useState(false);

  const pickFile = (f:File) => {
    if (f.size>5*1024*1024){onToast("Photo must be under 5 MB","error");return;}
    if (!f.type.startsWith("image/")){onToast("Please select an image file","error");return;}
    setFile(f);
    const r=new FileReader(); r.onload=e=>setPreview(e.target?.result as string); r.readAsDataURL(f);
  };
  const handleCancel=()=>{setPreview(null);setFile(null);if(fileRef.current)fileRef.current.value="";};
  const handleSave=async()=>{
    if(!file)return; setSaving(true);
    try {
      const fd=new FormData(); fd.append("photo",file);
      const res=await StaffServices.updatestaff(staffId,fd);
      onSaved(resolvePhoto(res?.photo_url||res?.photo)||preview||"");
      handleCancel(); onToast("Profile photo updated!","success"); StaffServices.clearCache();
    } catch{onToast("Failed to update photo","error");}
    finally{setSaving(false);}
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
      <h2 className="text-[12px] font-bold text-gray-800 mb-2 flex items-center gap-2">
        <Camera size={13} style={{color:primaryColor}}/> Change Profile Photo
      </h2>
      {!preview ? (
        <div onClick={()=>fileRef.current?.click()}
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files?.[0];if(f)pickFile(f);}}
          className="relative rounded-lg border-2 border-dashed p-3 text-center cursor-pointer transition-all select-none"
          style={{borderColor:dragging?primaryColor:primaryColor+"50",backgroundColor:dragging?primaryColor+"10":primaryColor+"05"}}>
          {currentPhoto && <div className="flex justify-center mb-2"><img src={currentPhoto} alt="current" className="w-16 h-16 rounded-full object-cover border-2" style={{borderColor:primaryColor+"40"}}/></div>}
          <p className="text-[12px] font-bold mb-0.5" style={{color:primaryColor}}>{currentPhoto?"Click or drag to replace":"Click or drag to upload"}</p>
          <p className="text-[10px] text-gray-400">JPG, PNG, WEBP · Max 5 MB</p>
          {dragging && <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{backgroundColor:primaryColor+"15"}}><p className="text-[13px] font-black" style={{color:primaryColor}}>Drop to select</p></div>}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4" style={{borderColor:primaryColor}}/>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor:primaryColor}}>
              <ImageIcon size={11} className="text-white"/>
            </div>
          </div>
          <p className="text-[11px] font-bold text-gray-600 truncate max-w-[160px]">{file?.name}</p>
          <div className="flex gap-2 w-full">
            <button onClick={handleCancel} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"><X size={11}/> Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-white text-[11px] font-black transition-all hover:opacity-90 disabled:opacity-60"
              style={{backgroundColor:primaryColor}}>
              {saving?<Loader2 size={11} className="animate-spin"/>:<Save size={11}/>} {saving?"Saving…":"Save Photo"}
            </button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)pickFile(f);}}/>
    </div>
  );
}

// ─── Custom Donut centre label ─────────────────────────────────────────────────
const DonutLabel = ({ viewBox, usedPct, overAll }: { viewBox?: any; usedPct: number; overAll: boolean }) => {
  const { cx, cy } = viewBox ?? { cx: 0, cy: 0 };
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-800" style={{ fontSize: 22, fontWeight: 900 }}>
        {usedPct}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: overAll ? "#ef4444" : "#64748b" }}>
        {overAll ? "OVER LIMIT" : "used"}
      </text>
    </g>
  );
};

// ─── Leave Balance Card (with charts) ─────────────────────────────────────────
function LeaveSummaryCard({ primaryColor, summary, loading }: {
  primaryColor: string; summary: LeaveSummaryFlat | null; loading: boolean;
}) {
  const [tab, setTab] = useState<"donut" | "bar">("donut");

  if (loading) return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-3">
      <Sk h={18} w={160}/>
      <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><Sk key={i} h={72} r={10}/>)}</div>
      <Sk h={220} r={12}/>
    </div>
  );

  if (!summary) return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-6 text-center">
      <CalendarDays size={32} className="mx-auto text-gray-200 mb-2"/>
      <p className="text-[12px] text-gray-400">No leave allocation found for this session.</p>
    </div>
  );

  const { allocated_leave, used_leave, remaining_leave } = summary;
  const overAll   = remaining_leave < 0;
  const usedPct   = allocated_leave > 0 ? Math.min(100, Math.round((used_leave / allocated_leave) * 100)) : 0;
  const unusedPct = 100 - usedPct;

  // Donut data
  const donutData = [
    { name: "Used",      value: used_leave,       color: overAll ? "#ef4444" : usedPct >= 80 ? "#f59e0b" : primaryColor },
    { name: "Remaining", value: Math.max(0, remaining_leave), color: "#e2e8f0" },
  ];

  // Bar chart data — each leave type
  const barData = LEAVE_TYPES.map(t => ({
    name:      t.label,
    allocated: summary[t.key],
    color:     t.color,
  }));

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">

      {/* ── Header + tab switch ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-[14px] font-black text-gray-800 flex items-center gap-2">
          <CalendarDays size={15} style={{color:primaryColor}}/> Leave Balance Overview
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["donut","bar"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${tab===t?"bg-white shadow-sm text-slate-800":"text-gray-400 hover:text-gray-600"}`}>
              {t==="donut" ? "Overview" : "By Type"}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3 stat chips ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-xl py-3 bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-gray-400 font-semibold mb-0.5">Allocated</span>
          <span className="text-2xl font-black text-slate-800">{allocated_leave}</span>
          <span className="text-[9px] text-gray-400 mt-0.5">days</span>
        </div>
        <div className="flex flex-col items-center rounded-xl py-3 bg-amber-50 border border-amber-100">
          <span className="text-[10px] text-amber-500 font-semibold mb-0.5">Used</span>
          <span className="text-2xl font-black text-amber-600">{used_leave}</span>
          <span className="text-[9px] text-amber-400 mt-0.5">days</span>
        </div>
        <div className={`flex flex-col items-center rounded-xl py-3 border ${overAll?"bg-red-50 border-red-100":"bg-green-50 border-green-100"}`}>
          <span className={`text-[10px] font-semibold mb-0.5 ${overAll?"text-red-500":"text-green-500"}`}>Remaining</span>
          <span className={`text-2xl font-black ${overAll?"text-red-600":"text-green-600"}`}>{remaining_leave}</span>
          <span className={`text-[9px] mt-0.5 ${overAll?"text-red-400":"text-green-400"}`}>{overAll?"⚠ over!":"days"}</span>
        </div>
      </div>

      {/* ══ DONUT TAB ═════════════════════════════════════════════════════ */}
      {tab === "donut" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">

          {/* Donut chart */}
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={62} outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90} endAngle={-270}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0}/>
                  ))}
                  <LabelList
                    dataKey="value"
                    content={<DonutLabel usedPct={usedPct} overAll={overAll}/>}
                  />
                </Pie>
                  <Tooltip
                  formatter={(val: unknown, name: unknown) => [`${val ?? 0} days`, String(name)]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-gray-400 -mt-2">
              {used_leave} of {allocated_leave} days used
            </p>
          </div>

          {/* Legend + overall bar */}
          <div className="space-y-3">
            {/* Used vs remaining legend */}
            <div className="space-y-2">
              {donutData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor:d.color}}/>
                    <span className="text-[12px] font-semibold text-slate-600">{d.name}</span>
                  </div>
                  <span className="text-[12px] font-black text-slate-800">{d.value} days</span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <TrendingUp size={10}/> Overall Usage
                </span>
                <span className={`text-[11px] font-black ${overAll?"text-red-600":usedPct>=80?"text-amber-600":"text-slate-700"}`}>
                  {usedPct}%{overAll && " — OVER"}
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{width:`${Math.min(usedPct,100)}%`,backgroundColor:overAll?"#ef4444":usedPct>=80?"#f59e0b":primaryColor}}/>
              </div>
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>0</span><span>{allocated_leave} days</span>
              </div>
            </div>

            {/* Status legend */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                {icon:CheckCheck, label:"Within limit", cls:"text-green-500"},
                {icon:Clock,      label:"80%+ used",    cls:"text-amber-500"},
                {icon:XCircle,    label:"Over limit",   cls:"text-red-500"},
              ].map(({icon:Icon,label,cls})=>(
                <div key={label} className={`flex items-center gap-1 text-[9px] font-bold ${cls}`}>
                  <Icon size={9}/> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ BAR TAB ═══════════════════════════════════════════════════════ */}
      {tab === "bar" && (
        <div className="space-y-4">

          {/* Recharts horizontal bar */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
              <XAxis type="number" tick={{fontSize:10}} axisLine={false} tickLine={false}
                domain={[0, allocated_leave]} />
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fontWeight:700,fill:"#64748b"}}
                width={64} axisLine={false} tickLine={false}/>
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [`${val ?? 0} days`, String(name)]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
              <Bar dataKey="allocated" radius={[0,6,6,0]} barSize={20}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color}/>
                ))}
               <LabelList
                                   dataKey="value"
                                   content={<DonutLabel usedPct={usedPct} overAll={overAll} />}
                                 />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Per-type detail rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {LEAVE_TYPES.map(t => {
              const allocated = summary[t.key];
              const sharePct  = allocated_leave > 0 ? Math.round((allocated / allocated_leave) * 100) : 0;
              return (
                <div key={t.key} className="rounded-xl px-3 py-2.5 border border-slate-100 flex items-center gap-3"
                  style={{backgroundColor: t.bgLight + "60"}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{backgroundColor: t.color + "20"}}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: t.color}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">{t.label}</span>
                      <span className="text-[11px] font-black" style={{color:t.textColor}}>{allocated}d</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{width:`${sharePct}%`,backgroundColor:t.color}}/>
                    </div>
                    <span className="text-[9px] text-gray-400">{sharePct}% of total quota</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recent Leaves Card ────────────────────────────────────────────────────────
function RecentLeavesCard({ primaryColor, leaves, loading }: {
  primaryColor:string; leaves:RecentLeave[]; loading:boolean;
}) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-3 space-y-3">
      <h2 className="text-[13px] font-black text-gray-800 flex items-center gap-2">
        <History size={14} style={{color:primaryColor}}/> Recent Leave Applications
      </h2>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i=><Sk key={i} h={54} r={8}/>)}</div>
      ) : leaves.length === 0 ? (
        <div className="py-6 text-center">
          <CalendarCheck size={28} className="mx-auto text-gray-200 mb-2"/>
          <p className="text-[11px] text-gray-400">No recent leave applications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaves.map(leave => {
            const st  = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.pending;
            const type = leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1);
            return (
              <div key={leave.id} className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{backgroundColor:primaryColor+"15"}}>
                      <CalendarDays size={13} style={{color:primaryColor}}/>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-black text-slate-700">{type} Leave</span>
                        {leave.is_half_day && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-100">Half Day</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9}/> {leave.start_date} — {leave.end_date}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${st.bg} ${st.text} ${st.border}`}>
                    {leave.status==="approved" && <span className="inline-flex items-center gap-0.5"><CheckCircle2 size={8}/> {st.label}</span>}
                    {leave.status==="pending"  && <span className="inline-flex items-center gap-0.5"><Clock size={8}/> {st.label}</span>}
                    {leave.status==="rejected" && <span className="inline-flex items-center gap-0.5"><XCircle size={8}/> {st.label}</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function StaffProfilePage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();

  const [loading,      setLoading]      = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [toast,        setToast]        = useState<{msg:string;type:"success"|"error"}|null>(null);
  const [error,        setError]        = useState<string|null>(null);

  const [staffInfo,    setStaffInfo]    = useState<StaffInfo|null>(null);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummaryFlat|null>(null);
  const [recentLeaves, setRecentLeaves] = useState<RecentLeave[]>([]);
  const [dashSummary,  setDashSummary]  = useState<DashboardSummary|null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true); setLeaveLoading(true); setError(null);
    try {
      const dash: StaffDashboardResponse = await StaffServices.getStaffDashboard();
      const staffObj: StaffInfo = dash.staff ?? {
        id: dash.id!, name: dash.name, email: dash.email,
        photo: dash.photo, designation: dash.designation, code: dash.code, role: dash.role,
      };
      setStaffInfo(staffObj);
      setDashSummary(dash.summary ?? null);
      setLeaveSummary(dash.leave_summary ?? null);
      setRecentLeaves(dash.recent_leaves ?? []);
    } catch(e:any) { setError(e?.message || "Failed to load profile"); }
    finally { setLoading(false); setLeaveLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handlePhotoSaved = (url:string) => {
    setStaffInfo(prev => prev ? {...prev, photo:url, photo_url:url} : prev);
  };

  const staffName  = staffInfo?.name || staffInfo?.full_name || "—";
  const staffEmail = staffInfo?.email || staffInfo?.user_email || "—";
  const staffPhoto = resolvePhoto(staffInfo?.photo_url ?? staffInfo?.photo);

  return (
    <div className="min-h-screen">
      <div className="space-y-4">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div className="relative rounded overflow-hidden shadow-lg"
          style={{background:`linear-gradient(135deg,${primaryColor} 0%,${primaryColor}cc 60%,${primaryColor}88 100%)`}}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.07] pointer-events-none"/>
          <div className="absolute top-8 -right-4 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none"/>
          <div className="absolute -bottom-12 left-28 w-48 h-48 rounded-full bg-white/[0.05] pointer-events-none"/>
          <div className="relative py-4 px-4 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="rounded-full p-1 bg-white/20 backdrop-blur-sm shrink-0">
              {loading
                ? <div className="rounded-full bg-white/20" style={{width:96,height:96}}/>
                : <UserAvatar name={staffName} photo={staffPhoto} size={96}/>}
            </div>
            <div className="flex-1 text-center sm:text-left pb-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Staff Profile</p>
              {loading ? (<><Sk w={200} h={28}/><div className="mt-2"><Sk w={160} h={14}/></div></>) : (
                <>
                  <h1 className="text-white text-2xl font-black tracking-tight">{staffName}</h1>
                  <p className="text-white/70 text-[12px] mt-0.5">{staffEmail}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                    <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">Staff</span>
                    {staffInfo?.designation && <span className="bg-white/15 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full border border-white/15 flex items-center gap-1"><Briefcase size={8}/> {staffInfo.designation}</span>}
                    {staffInfo?.code && <span className="bg-white/15 text-white/90 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/15">{staffInfo.code}</span>}
                    {leaveSummary && (
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${leaveSummary.remaining_leave < 0 ? "bg-red-400/30 text-red-100 border-red-300/30" : "bg-white/15 text-white/90 border-white/15"}`}>
                        <CalendarDays size={8}/> {leaveSummary.remaining_leave} days left
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
            <AlertCircle size={14} className="text-rose-500 shrink-0"/>
            <p className="text-xs text-rose-700 flex-1">{error}</p>
            <button onClick={fetchDashboard} className="text-[11px] font-bold text-rose-500 underline">Retry</button>
          </div>
        )}

        {/* ══ MAIN GRID ═════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Left col 2/3 */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
              <h2 className="text-[13px] font-black text-gray-800 mb-3 flex items-center gap-2">
                <User size={13} style={{color:primaryColor}}/> Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {([
                  {label:"Full Name",   value:staffName,                     icon:User},
                  {label:"Email",       value:staffEmail,                    icon:Mail},
                  {label:"Designation", value:staffInfo?.designation||"—",  icon:Briefcase},
                  {label:"Staff Code",  value:staffInfo?.code||"—",         icon:Hash},
                  {label:"Role",        value:staffInfo?.role||"—",         icon:Tag},
                ] as const).map(({label,value,icon:Icon})=>(
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{backgroundColor:primaryColor+"12"}}>
                      <Icon size={12} style={{color:primaryColor}}/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{label}</p>
                      {loading ? <Sk h={16} w={120}/> : <p className="text-[13px] font-bold text-gray-700 mt-0.5">{value||<span className="text-gray-300">Not set</span>}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {dashSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {label:"Students",    value:dashSummary.total_students??0,    color:"#3b82f6",bg:"#eff6ff"},
                  {label:"Teachers",    value:dashSummary.total_teachers??0,    color:"#8b5cf6",bg:"#f5f3ff"},
                  {label:"Staffs",      value:dashSummary.total_staffs??0,      color:"#10b981",bg:"#f0fdf4"},
                  {label:"Enrollments", value:dashSummary.total_enrollments??0, color:"#f59e0b",bg:"#fffbeb"},
                ].map(({label,value,color,bg})=>(
                  <div key={label} className="flex flex-col items-center rounded-lg py-3 border shadow-sm" style={{backgroundColor:bg,borderColor:color+"30"}}>
                    <span className="text-xl font-black" style={{color}}>{value}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{color}}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <RecentLeavesCard primaryColor={primaryColor} leaves={recentLeaves} loading={leaveLoading}/>
          </div>

          {/* Right col 1/3 */}
          <div className="space-y-4">
            {staffInfo && (
              <PhotoUploadCard primaryColor={primaryColor} currentPhoto={staffPhoto}
                staffId={staffInfo.id} onSaved={handlePhotoSaved}
                onToast={(msg,type)=>setToast({msg,type})}/>
            )}
            {loading && <Sk h={180} r={8}/>}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
              <h2 className="text-[13px] font-black text-gray-800 mb-2 flex items-center gap-2">
                <Shield size={13} style={{color:primaryColor}}/> Account Info
              </h2>
              <div className="space-y-1">
                {loading ? [0,1,2].map(i=><Sk key={i} h={44} r={8}/>) : (
                  [{label:"Email",value:staffEmail,icon:Mail},{label:"Designation",value:staffInfo?.designation||"—",icon:Briefcase},{label:"Role",value:staffInfo?.role||"—",icon:Tag}]
                  .map(({label,value,icon:Icon})=>(
                    <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor:primaryColor+"12"}}>
                        <Icon size={12} style={{color:primaryColor}}/>
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

        {/* ══ LEAVE BALANCE — full width with charts ═════════════════════════ */}
        <LeaveSummaryCard
          primaryColor={primaryColor}
          summary={leaveSummary}
          loading={leaveLoading}
        />

        <p className="text-center text-[11px] text-gray-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}