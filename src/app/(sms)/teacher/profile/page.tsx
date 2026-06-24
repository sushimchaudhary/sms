"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import useAuth from "@/lib/hooks/useAuth";
import { TeacherServices } from "@/services/teacherServices";
import {
  Mail, Shield, Camera, Save, X,
  CheckCircle2, AlertCircle, Loader2, Hash, School,
  Layers, BookOpen, FileText, ExternalLink,
  User, ImageIcon, CalendarDays, TrendingUp, Clock,
  CheckCheck, XCircle, CalendarCheck, History,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";

// ─── Backend types ─────────────────────────────────────────────────────────────
interface TeacherDashboardResponse {
  teacher: {
    id: number;
    name: string;
    email: string;
    code: string;
    phone?: string;
    address?: string;
    photo?: string | null;
    gender?: string;
    dob?: string;
    created_at?: string;
  };
  leave_summary?: LeaveSummaryFlat;
  recent_leaves?: RecentLeave[];
  assignments: { class: string; section: string | null; subject: string }[];
  recent_homeworks: Homework[];
  recent_notes: Note[];
}

interface LeaveSummaryFlat {
  allocated_leave: number;
  used_leave: number;
  remaining_leave: number;
  casual_leave: number;
  sick_leave: number;
  festival_leave: number;
  maternity_leave: number;
  funeral_leave: number;
}

interface RecentLeave {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  is_half_day: boolean;
}

interface Homework {
  id: number;
  title: string;
  subject?: string;
  due_date?: string;
  status?: string;
  class?: string;
  section?: string;
}

interface Note {
  id: number;
  title: string;
  file: string;
  subject?: string;
  created_at?: string;
}

// ─── Leave type config ─────────────────────────────────────────────────────────
const LEAVE_TYPES: {
  key: keyof Pick<LeaveSummaryFlat, "casual_leave" | "sick_leave" | "festival_leave" | "maternity_leave" | "funeral_leave">;
  label: string;
  color: string;
  bgLight: string;
  textColor: string;
}[] = [
  { key: "casual_leave",    label: "Casual",    color: "#3b82f6", bgLight: "#eff6ff", textColor: "#1d4ed8" },
  { key: "sick_leave",      label: "Sick",      color: "#ef4444", bgLight: "#fff1f2", textColor: "#b91c1c" },
  { key: "festival_leave",  label: "Festival",  color: "#8b5cf6", bgLight: "#f5f3ff", textColor: "#6d28d9" },
  { key: "maternity_leave", label: "Maternity", color: "#f97316", bgLight: "#fff7ed", textColor: "#c2410c" },
  { key: "funeral_leave",   label: "Funeral",   color: "#64748b", bgLight: "#f8fafc", textColor: "#475569" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  approved: { label: "Approved", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  pending:  { label: "Pending",  bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  rejected: { label: "Rejected", bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200"   },
};

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
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-5 right-5 z-[999] flex items-center gap-2.5 px-5 py-3 rounded-full shadow-2xl text-white text-[13px] font-semibold transition-all duration-300 ${type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}>
      {type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ name, photo, size = 96 }: { name: string; photo?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  const initials = (name || "T").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (photo && !err) {
    return (
      <img src={photo} alt={name} onError={() => setErr(true)}
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

// ─── HW Status ─────────────────────────────────────────────────────────────────
const HW_STATUS: Record<string, { color: string; bg: string }> = {
  submitted: { color: "#6366f1", bg: "#eef2ff" },
  graded:    { color: "#10b981", bg: "#f0fdf4" },
  pending:   { color: "#f59e0b", bg: "#fffbeb" },
  overdue:   { color: "#ef4444", bg: "#fff1f2" },
};

// ─── Photo Upload Card ─────────────────────────────────────────────────────────
function PhotoUploadCard({
  primaryColor, currentPhoto, onSaved, onToast, teacherId,
}: {
  primaryColor: string;
  currentPhoto?: string | null;
  onSaved: (newPhotoUrl: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  teacherId: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [file,     setFile]     = useState<File | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [dragging, setDragging] = useState(false);

  const pickFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) { onToast("Photo must be under 5 MB", "error"); return; }
    if (!f.type.startsWith("image/")) { onToast("Please select an image file", "error"); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleInput  = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) pickFile(f); };
  const handleDrop   = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); };
  const handleCancel = () => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = ""; };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await TeacherServices.updateTeacher(teacherId, fd);
      onSaved(res?.photo || preview || "");
      handleCancel();
      onToast("Profile photo updated!", "success");
    } catch {
      onToast("Failed to update photo", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
      <h2 className="text-[12px] font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Camera size={14} style={{ color: primaryColor }} /> Change Profile Photo
      </h2>

      {!preview ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="relative rounded border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200 select-none"
          style={{
            borderColor:     dragging ? primaryColor : primaryColor + "50",
            backgroundColor: dragging ? primaryColor + "10" : primaryColor + "05",
          }}
        >
          {currentPhoto && (
            <div className="flex justify-center mb-3">
              <img src={currentPhoto} alt="current"
                className="w-16 h-16 rounded-full object-cover border-4"
                style={{ borderColor: primaryColor + "40" }}
              />
            </div>
          )}
          <p className="text-[12px] font-bold mb-1" style={{ color: primaryColor }}>
            {currentPhoto ? "Click or drag to replace" : "Click or drag to upload"}
          </p>
          <p className="text-[10px] text-gray-400">JPG, PNG, WEBP · Max 5 MB</p>
          {dragging && (
            <div className="absolute inset-0 rounded flex items-center justify-center" style={{ backgroundColor: primaryColor + "15" }}>
              <p className="text-[13px] font-black" style={{ color: primaryColor }}>Drop to select</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4" style={{ borderColor: primaryColor }} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <ImageIcon size={11} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-bold text-gray-700 truncate max-w-[180px]">{file?.name}</p>
            <p className="text-[10px] text-gray-400">{file ? (file.size / 1024).toFixed(0) + " KB" : ""}</p>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              <X size={11} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-white text-[11px] font-black transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}>
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              {saving ? "Saving…" : "Save Photo"}
            </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleInput} />
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

// ─── Leave Summary Card (with charts) ─────────────────────────────────────────
function LeaveSummaryCard({ primaryColor, summary, loading }: {
  primaryColor: string;
  summary: LeaveSummaryFlat | null;
  loading: boolean;
}) {
  const [tab, setTab] = useState<"donut" | "bar">("donut");

  if (loading) return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-3">
      <Sk h={18} w={160} r={8} />
      <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(i => <Sk key={i} h={72} r={10} />)}</div>
      <Sk h={220} r={12} />
    </div>
  );

  if (!summary) return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-6 text-center">
      <CalendarDays size={32} className="mx-auto text-gray-200 mb-2" />
      <p className="text-[12px] text-gray-400">No leave allocation found for this session.</p>
    </div>
  );

  const { allocated_leave, used_leave, remaining_leave } = summary;
  const overAll   = remaining_leave < 0;
  const usedPct   = allocated_leave > 0 ? Math.min(100, Math.round((used_leave / allocated_leave) * 100)) : 0;

  const donutData = [
    { name: "Used",      value: used_leave,                  color: overAll ? "#ef4444" : usedPct >= 80 ? "#f59e0b" : primaryColor },
    { name: "Remaining", value: Math.max(0, remaining_leave), color: "#e2e8f0" },
  ];

  const barData = LEAVE_TYPES.map(t => ({
    name:      t.label,
    allocated: summary[t.key],
    color:     t.color,
  }));

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">

      {/* Header + tab switch */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-[14px] font-black text-gray-800 flex items-center gap-2">
          <CalendarDays size={15} style={{ color: primaryColor }} /> Leave Balance Overview
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["donut", "bar"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${tab === t ? "bg-white shadow-sm text-slate-800" : "text-gray-400 hover:text-gray-600"}`}>
              {t === "donut" ? "Overview" : "By Type"}
            </button>
          ))}
        </div>
      </div>

      {/* 3 stat chips */}
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
        <div className={`flex flex-col items-center rounded-xl py-3 border ${overAll ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
          <span className={`text-[10px] font-semibold mb-0.5 ${overAll ? "text-red-500" : "text-green-500"}`}>Remaining</span>
          <span className={`text-2xl font-black ${overAll ? "text-red-600" : "text-green-600"}`}>{remaining_leave}</span>
          <span className={`text-[9px] mt-0.5 ${overAll ? "text-red-400" : "text-green-400"}`}>{overAll ? "⚠ over!" : "days"}</span>
        </div>
      </div>

      {/* DONUT TAB */}
      {tab === "donut" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
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
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                  <LabelList
                    dataKey="value"
                    content={<DonutLabel usedPct={usedPct} overAll={overAll} />}
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

          <div className="space-y-3">
            <div className="space-y-2">
              {donutData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[12px] font-semibold text-slate-600">{d.name}</span>
                  </div>
                  <span className="text-[12px] font-black text-slate-800">{d.value} days</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <TrendingUp size={10} /> Overall Usage
                </span>
                <span className={`text-[11px] font-black ${overAll ? "text-red-600" : usedPct >= 80 ? "text-amber-600" : "text-slate-700"}`}>
                  {usedPct}%{overAll && " — OVER"}
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(usedPct, 100)}%`, backgroundColor: overAll ? "#ef4444" : usedPct >= 80 ? "#f59e0b" : primaryColor }} />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>0</span><span>{allocated_leave} days</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { icon: CheckCheck, label: "Within limit", cls: "text-green-500" },
                { icon: Clock,      label: "80%+ used",    cls: "text-amber-500" },
                { icon: XCircle,    label: "Over limit",   cls: "text-red-500"   },
              ].map(({ icon: Icon, label, cls }) => (
                <div key={label} className={`flex items-center gap-1 text-[9px] font-bold ${cls}`}>
                  <Icon size={9} /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BAR TAB */}
      {tab === "bar" && (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, allocated_leave]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                width={64} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: unknown) => [`${val ?? 0} days`, "Allocated"]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="allocated" radius={[0, 6, 6, 0]} barSize={20}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="allocated"
                  position="right"
                  style={{ fontSize: 11, fontWeight: 900, fill: "#1e293b" }}
                  formatter={(v: unknown) => `${v ?? 0}d`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {LEAVE_TYPES.map(t => {
              const allocated = summary[t.key];
              const sharePct  = allocated_leave > 0 ? Math.round((allocated / allocated_leave) * 100) : 0;
              return (
                <div key={t.key}
                  className="rounded-xl px-3 py-2.5 border border-slate-100 flex items-center gap-3"
                  style={{ backgroundColor: t.bgLight + "60" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: t.color + "20" }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">{t.label}</span>
                      <span className="text-[11px] font-black" style={{ color: t.textColor }}>{allocated}d</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${sharePct}%`, backgroundColor: t.color }} />
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
  primaryColor: string;
  leaves: RecentLeave[];
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-3 space-y-3">
      <h2 className="text-[13px] font-black text-gray-800 flex items-center gap-2">
        <History size={14} style={{ color: primaryColor }} /> Recent Leave Applications
      </h2>
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Sk key={i} h={54} r={8} />)}</div>
      ) : leaves.length === 0 ? (
        <div className="py-6 text-center">
          <CalendarCheck size={28} className="mx-auto text-gray-200 mb-2" />
          <p className="text-[11px] text-gray-400">No recent leave applications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaves.map(leave => {
            const st   = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.pending;
            const type = leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1);
            return (
              <div key={leave.id} className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: primaryColor + "15" }}>
                      <CalendarDays size={13} style={{ color: primaryColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-black text-slate-700">{type} Leave</span>
                        {leave.is_half_day && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-100">Half Day</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9} /> {leave.start_date} — {leave.end_date}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${st.bg} ${st.text} ${st.border}`}>
                    {leave.status === "approved" && <span className="inline-flex items-center gap-0.5"><CheckCircle2 size={8} /> {st.label}</span>}
                    {leave.status === "pending"  && <span className="inline-flex items-center gap-0.5"><Clock size={8} /> {st.label}</span>}
                    {leave.status === "rejected" && <span className="inline-flex items-center gap-0.5"><XCircle size={8} /> {st.label}</span>}
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
export default function TeacherProfilePage() {
  const { primaryColor } = useTheme();
  const { user }         = useAuth();

  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [activeTab,    setActiveTab]    = useState<"profile" | "assignments">("profile");
  const [toast,        setToast]        = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const [teacherInfo,  setTeacherInfo]  = useState<TeacherDashboardResponse["teacher"] | null>(null);
  const [assignments,  setAssignments]  = useState<TeacherDashboardResponse["assignments"]>([]);
  const [homeworks,    setHomeworks]    = useState<Homework[]>([]);
  const [notes,        setNotes]        = useState<Note[]>([]);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummaryFlat | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<RecentLeave[]>([]);

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const dash: TeacherDashboardResponse = await TeacherServices.getTeacherDashboard();
      setTeacherInfo(dash.teacher);
      setAssignments(dash.assignments ?? []);
      setHomeworks(dash.recent_homeworks ?? []);
      setNotes(dash.recent_notes ?? []);
      setLeaveSummary(dash.leave_summary ?? null);
      setRecentLeaves(dash.recent_leaves ?? []);
      setForm({
        name:    dash.teacher.name    ?? "",
        email:   dash.teacher.email   ?? "",
        phone:   dash.teacher.phone   ?? "",
        address: dash.teacher.address ?? "",
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handlePhotoSaved = (newPhotoUrl: string) => {
    setTeacherInfo(prev => prev ? { ...prev, photo: newPhotoUrl } : prev);
    TeacherServices.clearCache?.();
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const uniqueClasses  = [...new Set(assignments.map(a => a.class).filter(Boolean))];
  const uniqueSubjects = [...new Set(assignments.map(a => a.subject).filter(Boolean))];
  const uniqueSections = [...new Set(assignments.map(a => a.section).filter(Boolean))];

  const inputBase =
    "w-full px-4 py-2.5 rounded-full border text-[13px] font-medium text-gray-700 focus:outline-none transition-all bg-white";

  return (
    <div className="min-h-screen">
      <div className="space-y-3">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div className="relative rounded overflow-hidden shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 60%, ${primaryColor}88 100%)` }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.07] pointer-events-none" />
          <div className="absolute top-8 -right-4 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none" />
          <div className="absolute -bottom-12 left-28 w-48 h-48 rounded-full bg-white/[0.05] pointer-events-none" />

          <div className="relative py-5 px-5 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="flex-1 text-center sm:text-left pb-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Teacher Profile</p>
              {loading ? (
                <><Sk w={200} h={28} r={999} /><div className="mt-2"><Sk w={160} h={14} r={999} /></div></>
              ) : (
                <>
                  <h1 className="text-white text-2xl font-black tracking-tight leading-tight">
                    {teacherInfo?.name || "—"}
                  </h1>
                  <p className="text-white/60 text-[12px] mt-0.5">{teacherInfo?.email || "—"}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                    <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                      Teacher
                    </span>
                    {teacherInfo?.code && (
                      <span className="bg-white/15 text-white/90 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/15">
                        {teacherInfo.code}
                      </span>
                    )}
                    {uniqueClasses.length > 0 && (
                      <span className="bg-white/10 text-white/70 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                        <School size={8} />
                        {uniqueClasses.length} class{uniqueClasses.length > 1 ? "es" : ""}
                      </span>
                    )}
                    {leaveSummary && (
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${leaveSummary.remaining_leave < 0 ? "bg-red-400/30 text-red-100 border-red-300/30" : "bg-white/15 text-white/90 border-white/15"}`}>
                        <CalendarDays size={8} /> {leaveSummary.remaining_leave} days left
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats strip */}
          {!loading && (
            <div className="relative border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
              {[
                { label: "Classes",  value: uniqueClasses.length },
                { label: "Subjects", value: uniqueSubjects.length },
                { label: "Sections", value: uniqueSections.length },
              ].map(({ label, value }) => (
                <div key={label} className="py-3 text-center">
                  <p className="text-white text-lg font-black tabular-nums">{value}</p>
                  <p className="text-white/50 text-[9px] font-black uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded px-5 py-3">
            <AlertCircle size={14} className="text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 flex-1">{error}</p>
            <button onClick={() => fetchDashboard()} className="text-[11px] font-bold text-rose-500 underline">Retry</button>
          </div>
        )}

        {/* ══ TABS ════════════════════════════════════════════════════════ */}
        <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm border border-gray-100 w-fit">
          {(["profile", "assignments"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? "text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              style={activeTab === tab ? { backgroundColor: primaryColor } : {}}
            >
              {tab === "profile" ? "Profile" : "Assignments"}
            </button>
          ))}
        </div>

        {/* ══ PROFILE TAB ═════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Left: editable fields + recent leaves */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-black text-gray-800 flex items-center gap-2">
                    <User size={14} style={{ color: primaryColor }} /> Personal Information
                  </h2>
                </div>
                <div className="space-y-3">
                  {([
                    { label: "Full Name", key: "name",    type: "text",  icon: User },
                    { label: "Email",     key: "email",   type: "email", icon: Mail },
                    { label: "Phone",     key: "phone",   type: "tel",   icon: Mail },
                    { label: "Address",   key: "address", type: "text",  icon: Mail },
                  ] as const).map(({ label, key, type, icon: Icon }) => (
                    <div key={key}>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1">
                        <Icon size={10} /> {label}
                      </label>
                      {loading ? (
                        <Sk h={42} r={999} />
                      ) : editMode ? (
                        <input
                          type={type}
                          value={form[key]}
                          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          className={inputBase}
                          style={{ borderColor: primaryColor + "40" }}
                          onFocus={e => (e.target.style.borderColor = primaryColor)}
                          onBlur={e => (e.target.style.borderColor = primaryColor + "40")}
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-gray-50 rounded-full text-[13px] font-medium text-gray-700 min-h-[42px] flex items-center">
                          {form[key] || <span className="text-gray-300">Not set</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {editMode && (
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => setEditMode(false)}
                      className="flex-1 py-2.5 rounded-full border border-gray-200 text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-white text-[12px] font-black transition-all hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: primaryColor }}>
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Leaves — below personal info in the left col */}
              <RecentLeavesCard
                primaryColor={primaryColor}
                leaves={recentLeaves}
                loading={loading}
              />
            </div>

            {/* Right column */}
            <div className="space-y-3">
              {/* Photo upload */}
              {teacherInfo && (
                <PhotoUploadCard
                  primaryColor={primaryColor}
                  currentPhoto={teacherInfo.photo}
                  teacherId={teacherInfo.id}
                  onSaved={handlePhotoSaved}
                  onToast={(msg, type) => setToast({ msg, type })}
                />
              )}
              {loading && <Sk h={180} r={24} />}

              {/* Account info */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
                <h2 className="text-[13px] font-black text-gray-800 mb-3 flex items-center gap-2">
                  <Shield size={13} style={{ color: primaryColor }} /> Account Info
                </h2>
                <div className="space-y-1">
                  {loading ? (
                    [0, 1].map(i => <Sk key={i} h={44} r={999} />)
                  ) : (
                    [
                      { label: "Teacher Code", value: teacherInfo?.code  || "—", icon: Hash },
                      { label: "Email",         value: teacherInfo?.email || "—", icon: Mail },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: primaryColor + "12" }}>
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

              {/* Recent homeworks */}
              {homeworks.length > 0 && (
                <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
                  <h3 className="text-[13px] font-black text-gray-800 mb-3 flex items-center gap-2">
                    <BookOpen size={12} style={{ color: primaryColor }} /> Recent Homeworks
                  </h3>
                  <div className="space-y-2">
                    {homeworks.slice(0, 3).map(hw => {
                      const s = HW_STATUS[hw.status ?? "pending"] ?? HW_STATUS.pending;
                      return (
                        <div key={hw.id} className="flex items-center gap-2.5 p-2 rounded hover:bg-gray-50 transition-colors">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + "12" }}>
                            <BookOpen size={12} style={{ color: primaryColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-gray-700 truncate">{hw.title}</p>
                            <p className="text-[9px] text-gray-400">
                              {hw.class && `Class ${hw.class}`}{hw.section && ` · ${hw.section}`}
                            </p>
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 capitalize"
                            style={{ backgroundColor: s.bg, color: s.color }}>
                            {hw.status ?? "pending"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent notes */}
              {notes.length > 0 && (
                <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
                  <h3 className="text-[13px] font-black text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={12} style={{ color: primaryColor }} /> Recent Notes
                  </h3>
                  <div className="space-y-2">
                    {notes.slice(0, 3).map(note => (
                      <div key={note.id} className="flex items-center gap-2.5 p-2 rounded hover:bg-gray-50 transition-colors">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-rose-50">
                          <FileText size={12} className="text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-gray-700 truncate">{note.title}</p>
                          {note.subject && <p className="text-[9px] text-gray-400">{note.subject}</p>}
                        </div>
                        <a href={note.file} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full transition-colors"
                          style={{ backgroundColor: primaryColor + "12", color: primaryColor }}>
                          <ExternalLink size={9} /> Open
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ASSIGNMENTS TAB ═════════════════════════════════════════════ */}
        {activeTab === "assignments" && (
          <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-black text-gray-800">My Assignments</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Classes, sections and subjects you teach</p>
              </div>
              <span className="text-[11px] font-black px-3 py-1 rounded-full"
                style={{ backgroundColor: primaryColor + "15", color: primaryColor }}>
                {assignments.length} total
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">{[0, 1, 2].map(i => <Sk key={i} h={48} r={999} />)}</div>
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <School size={40} className="mb-3" />
                <p className="text-[13px] font-bold text-gray-400">No assignments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["#", "Class", "Section", "Subject"].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-400 text-[11px] font-bold">{i + 1}</td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1.5 font-bold" style={{ color: primaryColor }}>
                            <School size={11} /> Class {a.class}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1.5 font-bold text-gray-600">
                            <Layers size={11} className="text-gray-400" />
                            {a.section ? a.section.toUpperCase() : <span className="text-gray-300 font-medium">—</span>}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block text-[10px] font-black px-3 py-1 rounded-full capitalize"
                            style={{ backgroundColor: primaryColor + "12", color: primaryColor }}>
                            {a.subject}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {assignments.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-50">
                {[
                  { label: "Unique Classes",  items: uniqueClasses,  color: primaryColor },
                  { label: "Unique Subjects", items: uniqueSubjects, color: "#f97316" },
                  ...(uniqueSections.length > 0
                    ? [{ label: "Unique Sections", items: uniqueSections, color: "#8b5cf6" }]
                    : []
                  ),
                ].map(({ label, items, color }) => (
                  <div key={label} className="flex-1 min-w-[160px] rounded p-3 border"
                    style={{ backgroundColor: color + "08", borderColor: color + "20" }}>
                    <p className="text-[9px] font-black uppercase tracking-wider mb-2" style={{ color }}>{label}</p>
                    <div className="flex flex-wrap gap-1">
                      {items.map(item => (
                        <span key={item} className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: color + "15", color }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ LEAVE BALANCE — full width ════════════════════════════════════ */}
        <LeaveSummaryCard
          primaryColor={primaryColor}
          summary={leaveSummary}
          loading={loading}
        />

        <p className="text-center text-[11px] text-gray-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}