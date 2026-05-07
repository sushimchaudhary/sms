"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import useAuth from "@/lib/hooks/useAuth";
import { TeacherServices } from "@/services/teacherServices";
import {
  Mail, Shield, Camera, Save, X,
  CheckCircle2, AlertCircle, Loader2, Hash, School,
  Layers, BookOpen, FileText, ExternalLink,
  User, ImageIcon,
} from "lucide-react";

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
  assignments: { class: string; section: string | null; subject: string }[]; // ✅ section can be null
  recent_homeworks: Homework[];
  recent_notes: Note[];
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
  const initials = (name || "T").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (photo && !err) {
    return (
      <img
        src={photo} alt={name} onError={() => setErr(true)}
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
  primaryColor,
  currentPhoto,
  onSaved,
  onToast,
  teacherId,
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

  const handleInput   = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) pickFile(f); };
  const handleDrop    = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); };
  const handleCancel  = () => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = ""; };

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
              <img
                src={currentPhoto} alt="current"
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
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X size={11} /> Cancel
            </button>
            <button
              onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-white text-[11px] font-black transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
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

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function TeacherProfilePage() {
  const { primaryColor } = useTheme();
  const { user }         = useAuth();

  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [editMode,   setEditMode]   = useState(false);
  const [activeTab,  setActiveTab]  = useState<"profile" | "assignments">("profile");
  const [toast,      setToast]      = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const [teacherInfo, setTeacherInfo] = useState<TeacherDashboardResponse["teacher"] | null>(null);
  const [assignments, setAssignments] = useState<TeacherDashboardResponse["assignments"]>([]);
  const [homeworks,   setHomeworks]   = useState<Homework[]>([]);
  const [notes,       setNotes]       = useState<Note[]>([]);

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

  // ── Derived — ✅ FIX: filter(Boolean) removes null sections ────────────────
  const uniqueClasses  = [...new Set(assignments.map(a => a.class).filter(Boolean))];
  const uniqueSubjects = [...new Set(assignments.map(a => a.subject).filter(Boolean))];
  const uniqueSections = [...new Set(assignments.map(a => a.section).filter(Boolean))]; // ✅ null filtered out

  const inputBase =
    "w-full px-4 py-2.5 rounded-full border text-[13px] font-medium text-gray-700 focus:outline-none transition-all bg-white";

  return (
    <div className="min-h-screen">
      <div className="space-y-3">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div
          className="relative rounded overflow-hidden shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 60%, ${primaryColor}88 100%)` }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.07] pointer-events-none" />
          <div className="absolute top-8 -right-4 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none" />
          <div className="absolute -bottom-12 left-28 w-48 h-48 rounded-full bg-white/[0.05] pointer-events-none" />

          <div className="relative py-5 px-5 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* <div className="relative shrink-0">
              <div className="rounded-full p-1 bg-white/20 backdrop-blur-sm">
                {loading ? (
                  <div className="rounded-full bg-white/20" style={{ width: 96, height: 96 }} />
                ) : (
                  <UserAvatar name={teacherInfo?.name || "Teacher"} photo={teacherInfo?.photo || null} size={96} />
                )}
              </div>
            </div> */}

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
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats strip — ✅ FIX: uniqueSections.length now shows 0 when all null */}
          {!loading && (
            <div className="relative border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
              {[
                { label: "Classes",  value: uniqueClasses.length },
                { label: "Subjects", value: uniqueSubjects.length },
                { label: "Sections", value: uniqueSections.length }, // ✅ correct: 0 when null
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
              className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all ${
                activeTab === tab ? "text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
              style={activeTab === tab ? { backgroundColor: primaryColor } : {}}
            >
              {tab === "profile" ? "Profile" : "Assignments"}
            </button>
          ))}
        </div>

        {/* ══ PROFILE TAB ═════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* ── Left: editable fields ── */}
            <div className="md:col-span-2 bg-white rounded shadow-sm border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-black text-gray-800 flex items-center gap-2">
                  <User size={14} style={{ color: primaryColor }} /> Personal Information
                </h2>
                {/* <button
                  onClick={() => setEditMode(e => !e)}
                  className="text-[11px] font-black px-3 py-1.5 rounded-full border transition-colors"
                  style={editMode
                    ? { backgroundColor: primaryColor + "15", color: primaryColor, borderColor: primaryColor + "30" }
                    : { backgroundColor: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                  }
                >
                  {editMode ? "Cancel Edit" : "Edit"}
                </button> */}
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
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2.5 rounded-full border border-gray-200 text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-white text-[12px] font-black transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {/* ── Right column ── */}
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
                    [0,1].map(i => <Sk key={i} h={44} r={999} />)
                  ) : (
                    [
                      { label: "Teacher Code", value: teacherInfo?.code  || "—", icon: Hash },
                      { label: "Email",         value: teacherInfo?.email || "—", icon: Mail },
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
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 capitalize" style={{ backgroundColor: s.bg, color: s.color }}>
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
                        <a
                          href={note.file} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full transition-colors"
                          style={{ backgroundColor: primaryColor + "12", color: primaryColor }}
                        >
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
              <span
                className="text-[11px] font-black px-3 py-1 rounded-full"
                style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
              >
                {assignments.length} total
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">{[0,1,2].map(i => <Sk key={i} h={48} r={999} />)}</div>
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
                            {/* ✅ FIX: handle null section gracefully */}
                            {a.section
                              ? a.section.toUpperCase()
                              : <span className="text-gray-300 font-medium">—</span>
                            }
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-block text-[10px] font-black px-3 py-1 rounded-full capitalize"
                            style={{ backgroundColor: primaryColor + "12", color: primaryColor }}
                          >
                            {a.subject}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary chips */}
            {assignments.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-50">
                {[
                  { label: "Unique Classes",  items: uniqueClasses,  color: primaryColor },
                  { label: "Unique Subjects", items: uniqueSubjects, color: "#f97316" },
                  // ✅ FIX: only show Sections chip if there are actual non-null sections
                  ...(uniqueSections.length > 0
                    ? [{ label: "Unique Sections", items: uniqueSections, color: "#8b5cf6" }]
                    : []
                  ),
                ].map(({ label, items, color }) => (
                  <div
                    key={label} className="flex-1 min-w-[160px] rounded p-3 border"
                    style={{ backgroundColor: color + "08", borderColor: color + "20" }}
                  >
                    <p className="text-[9px] font-black uppercase tracking-wider mb-2" style={{ color }}>{label}</p>
                    <div className="flex flex-wrap gap-1">
                      {items.map(item => (
                        <span
                          key={item}
                          className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: color + "15", color }}
                        >
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

        <p className="text-center text-[11px] text-gray-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}