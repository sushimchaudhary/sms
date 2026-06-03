"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import useAuth from "@/lib/hooks/useAuth";
import { StudentServices } from "@/services/studentServices";
import { LeaveServices }   from "@/services/leaveServices";
import { NotificationServices } from "@/services/notificationServices";
import {
  GraduationCap, BookOpen, Calendar, Bell, Clock,
  AlertCircle, ChevronRight, CheckCircle2, Clock3,
  Layers, School, ClipboardList, CalendarDays, Star,
  Fingerprint, CalendarCheck, Award, Mail,
  User, FileText, ExternalLink,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import NepaliDate from "nepali-date-converter";
import CalendarGrid from "@/components/ui/CalendarGrid";

// ─── Base URL + resolvePhoto (fixes dashboard photo not showing) ──────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  return photo.startsWith("http") ? photo : `${BASE_URL}${photo}`;
}

// ─── Backend response types ───────────────────────────────────────────────────

/** Shape returned by GET /api/students/my_dashboard/ */
interface StudentDashboardResponse {
  student: {
    id: number;
    name: string;
    student_id: string;   // e.g. "SCH012-STU012"
    photo?: string;       // ← profile photo URL
  };
  enrollment: {
    roll_number: number;
    enrollment_code: string;   // e.g. "SCH012-STU012-3"
    class: string;             // e.g. "3"
    section: string;           // e.g. "a"
    session: string;           // e.g. "2082-2084"
  } | null;
  attendance: AttendanceRecord[];
  recent_homeworks: Homework[];
  recent_notes: Note[];
}

interface AttendanceRecord {
  id?: number;
  date?: string;
  status?: string;   // "present" | "absent" | "late"
  created_at?: string;
}

interface Homework {
  id: number;
  title: string;
  description?: string;
  subject?: string;
  due_date?: string;
  status?: "submitted" | "graded" | "pending" | "overdue";
  is_submitted?: boolean;
  is_graded?: boolean;
  is_overdue?: boolean;
  class?: string;
  section?: string;
  created_at?: string;
}

interface Note {
  id: number;
  title: string;
  file: string;   // absolute URL, e.g. "http://…/media/notes/file.pdf"
  description?: string;
  subject?: string;
  created_at?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getItems(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (d?.results) return d.results;
  if (d?.data && Array.isArray(d.data)) return d.data;
  return [];
}

function initials(name: string) {
  return (name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ w = "100%", h = 14, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"
      style={{ width: w, height: h, borderRadius: r }}
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Ava({
  name,
  color,
  size = 32,
  photo,
}: {
  name: string;
  color: string;
  size?: number;
  photo?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover flex-shrink-0 border-2 border-white/30"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-extrabold flex-shrink-0 uppercase"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.34 }}
    >
      {initials(name)}
    </span>
  );
}

// ─── Ring Progress ────────────────────────────────────────────────────────────
function RingProgress({
  pct, size = 130, stroke = 12, color, trackColor = "#e2e8f0", children,
}: {
  pct: number; size?: number; stroke?: number; color: string;
  trackColor?: string; children?: React.ReactNode;
}) {
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  const cx     = size / 2;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded shadow-2xl px-3 py-2.5 text-[11px]">
      <p className="font-black text-slate-500 mb-2 uppercase tracking-widest text-[9px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-5 mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.fill }} />
            <span className="text-slate-500 font-semibold">{p.name}</span>
          </div>
          <span className="font-black text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Homework status map ──────────────────────────────────────────────────────
const HW_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  submitted: { color: "#6366f1", bg: "#eef2ff", label: "Submitted" },
  graded:    { color: "#10b981", bg: "#f0fdf4", label: "Graded"    },
  pending:   { color: "#f59e0b", bg: "#fffbeb", label: "Pending"   },
  overdue:   { color: "#ef4444", bg: "#fff1f2", label: "Overdue"   },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentDashboardPage() {
  const { primaryColor } = useTheme();
  const { user }         = useAuth();

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastSync,   setLastSync]   = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Primary data from my_dashboard ───────────────────────────────────────
  const [studentInfo,  setStudentInfo]  = useState<StudentDashboardResponse["student"] | null>(null);
  const [enrollment,   setEnrollment]   = useState<StudentDashboardResponse["enrollment"]>(null);
  const [attendance,   setAttendance]   = useState<AttendanceRecord[]>([]);
  const [homeworks,    setHomeworks]    = useState<Homework[]>([]);
  const [notes,        setNotes]        = useState<Note[]>([]);

  // ── Secondary optional data ───────────────────────────────────────────────
  const [leaves,        setLeaves]        = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // ─────────────────────────────────────────────────────────────────────────
// ─── Add this helper just above fetchAll ─────────────────────────────────────
// Matches a leave row to the currently logged-in student
function isMyLeave(item: any, user: any): boolean {
  if (!user) return false;

  // 1. Primary: student profile id vs student_enrollment field
  const myProfileId = user?.student?.id ?? user?.id;
  if (myProfileId != null && item.student_enrollment === myProfileId) return true;

  // 2. Fallback: name comparison
  const myName  = (user?.student?.name || user?.name || "").toLowerCase().trim();
  const rowName = (item.student_name   || "").toLowerCase().trim();
  return myName !== "" && rowName !== "" && rowName === myName;
}

// ─── Replace fetchAll ─────────────────────────────────────────────────────────
const fetchAll = useCallback(async (isRefresh = false) => {
  if (isRefresh) setRefreshing(true); else setLoading(true);
  setError(null);
  try {
    const [dashR, lvR, ntR] = await Promise.allSettled([
      StudentServices.getStudentDashboard(),
      LeaveServices.getAllLeaves?.(),
      NotificationServices.getAllNotifications?.(),
    ]);

    const v = (r: PromiseSettledResult<any>) =>
      r.status === "fulfilled" ? r.value : null;

    // ── Primary ─────────────────────────────────────────────────────────
    const dash: StudentDashboardResponse | null = v(dashR);
    setStudentInfo(dash?.student        ?? null);
    setEnrollment(dash?.enrollment      ?? null);
    setAttendance(dash?.attendance      ?? []);
    setHomeworks(dash?.recent_homeworks ?? []);
    setNotes(dash?.recent_notes         ?? []);

    // ── Leaves — filter to THIS student's rows only ──────────────────────
    const allLeaves = getItems(v(lvR));
    const myLeaves  = allLeaves.filter((item: any) => isMyLeave(item, user));
    setLeaves(myLeaves.slice(0, 5));

    // ── Notifications ────────────────────────────────────────────────────
    setNotifications(getItems(v(ntR)).slice(0, 5));

    setLastSync(new Date());
  } catch (e: any) {
    setError(e?.message || "Failed to load dashboard");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [user]); // ← add `user` to deps so the filter has the latest auth data

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Resolved display fields ───────────────────────────────────────────────
  const studentName  = studentInfo?.name       || user?.name  || "Student";
  const studentId    = studentInfo?.student_id  || "—";
  const studentEmail = user?.email              || "—";

  // ✅ FIX: Use resolvePhoto() so relative paths get BASE_URL prepended
  const studentPhoto = resolvePhoto(studentInfo?.photo);

  const schoolName   =
    typeof user?.school === "object"
      ? (user.school?.name ?? "—")
      : (user?.school || "—");

  // enrollment fields
  const rollNo      = enrollment?.roll_number    != null ? String(enrollment.roll_number) : "—";
  const enrollCode  = enrollment?.enrollment_code ?? "—";
  const className   = enrollment?.class           ?? "—";
  const sectionName = enrollment?.section         ?? "—";
  const sessionName = enrollment?.session         ?? user?.active_session?.name ?? "—";

  // ── Stats ─────────────────────────────────────────────────────────────────
const attStats = useMemo(() => {
  const total   = attendance.length;

  const present = attendance.filter(a =>
    ["present", "late"].includes((a.status || "").toLowerCase().trim())
  ).length;

  const absent = attendance.filter(a =>
    (a.status || "").toLowerCase().trim() === "absent"
  ).length;

  const leave = attendance.filter(a =>
    (a.status || "").toLowerCase().trim() === "leave"
  ).length;

  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, absent, leave, pct };
}, [attendance]);


useEffect(() => {
  console.log("Attendance records:", attendance);
  console.log("Attendance count:", attendance.length);
}, [attendance]);

  const hwStats = useMemo(() => {
    const total     = homeworks.length;
    const submitted = homeworks.filter(h => h.status === "submitted" || h.is_submitted).length;
    const graded    = homeworks.filter(h => h.status === "graded"    || h.is_graded).length;
    const overdue   = homeworks.filter(h => h.status === "overdue"   || h.is_overdue).length;
    const pending   = homeworks.filter(h =>
      h.status === "pending" || (!h.is_submitted && h.status !== "graded")
    ).length;
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return { total, submitted, graded, overdue, pending, pct };
  }, [homeworks]);

  const leaveStats = useMemo(() => {
    const total    = leaves.length;
    const approved = leaves.filter(l => l.status === "approved").length;
    const pending  = leaves.filter(l => l.status === "pending").length;
    const rejected = leaves.filter(l => l.status === "rejected").length;
    return { total, approved, pending, rejected };
  }, [leaves]);

      const [selectedMonthIndex, setSelectedMonthIndex] = useState(new NepaliDate().getMonth());
  const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000); // हरेक १ सेकेन्डमा अपडेट हुने

      return () => clearInterval(timer); // कम्पोनेन्ट अनमाउन्ट हुँदा क्लियर गर्ने
}, []);

  // ── Charts ────────────────────────────────────────────────────────────────
  const attChartData = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<string, { present: number; absent: number }> = {};
    MONTHS.forEach(m => { map[m] = { present: 0, absent: 0 }; });
    attendance.forEach(a => {
      const d = new Date(a.date || a.created_at || "");
      if (isNaN(d.getTime())) return;
      const m = MONTHS[d.getMonth()];
      (a.status || "").toLowerCase().startsWith("p")
        ? map[m].present++
        : map[m].absent++;
    });
    return MONTHS.map(month => ({ month, ...map[month] }))
      .filter(d => d.present > 0 || d.absent > 0);
  }, [attendance]);

  const hwChartData = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<string, { assigned: number; submitted: number }> = {};
    MONTHS.forEach(m => { map[m] = { assigned: 0, submitted: 0 }; });
    homeworks.forEach(h => {
      const d = new Date(h.due_date || h.created_at || "");
      if (isNaN(d.getTime())) return;
      const m = MONTHS[d.getMonth()];
      map[m].assigned++;
      if (h.status === "submitted" || h.is_submitted) map[m].submitted++;
    });
    return MONTHS.map(month => ({ month, ...map[month] })).filter(d => d.assigned > 0);
  }, [homeworks]);

  const attColor = attStats.pct >= 80 ? "#10b981" : attStats.pct >= 60 ? "#f59e0b" : "#ef4444";
  const hwColor  = hwStats.pct  >= 80 ? primaryColor : hwStats.pct >= 60 ? "#f59e0b" : "#ef4444";

  const greeting = () => {
    const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })).getHours();
    if (h >= 5  && h < 12) return "Good Morning ☀️";
    if (h >= 12 && h < 17) return "Good Afternoon 🌤";
    if (h >= 17 && h < 21) return "Good Evening 🌆";
    return "Good Night 🌙";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-2xl mx-auto space-y-4">

        {/* ══ HERO BANNER ════════════════════════════════════════════════ */}
        <div
          className="relative rounded overflow-hidden shadow-md"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 55%, ${primaryColor}88 100%)` }}
        >
          <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full bg-white/[0.08] pointer-events-none" />
          <div className="absolute top-6 -right-2  w-28 h-28 rounded-full bg-white/[0.07] pointer-events-none" />
          <div className="absolute -bottom-10 left-24 w-44 h-44 rounded-full bg-white/[0.05] pointer-events-none" />

          <div className="relative p-4 flex flex-col md:flex-row md:items-center gap-5">

           

            <div className="flex-1 min-w-0">
              <p className="text-white/65 text-[10px] font-black uppercase tracking-[0.18em] mb-0.5">{greeting()}</p>
              <h1 className="text-white text-[22px] font-black tracking-tight leading-tight truncate">
                {loading ? "Loading..." : studentName}
              </h1>
              <p className="text-white/55 text-[11px] flex items-center gap-1.5 mt-0.5">
                <Mail size={10} className="shrink-0" />{studentEmail}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 backdrop-blur-sm">
                  Student
                </span>
                {!loading && studentId !== "—" && (
                  <span className="bg-white/15 text-white/90 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                    <Fingerprint size={9} />{studentId}
                  </span>
                )}
                {!loading && schoolName !== "—" && (
                  <span className="bg-white/15 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/15">
                    <School size={9} />{schoolName}
                  </span>
                )}
                {!loading && sessionName !== "—" && (
                  <span className="bg-white/10 text-white/70 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                    <CalendarDays size={8} />{sessionName}
                  </span>
                )}
                 <p className="text-[13px] text-white font-medium flex items-center gap-1">
                      <Clock size={14} className="text-white" />
                      {/* यहाँ lastSync को सट्टा currentTime प्रयोग गर्नुहोस् */}
                      {`Time: ${currentTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit", // सेकेन्ड पनि देखाउन चाहनुहुन्छ भने
                      })}`}
                    </p>
              </div>
            </div>

            {/* Roll No badge */}
            {!loading && rollNo !== "—" && (
              <div className="shrink-0 bg-white/15 backdrop-blur-sm border border-white/25 rounded px-6 py-4 text-center shadow-inner">
                <p className="text-white/55 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Roll No.</p>
                <p className="text-white text-3xl font-black tabular-nums leading-none">{rollNo}</p>
                {className !== "—" && (
                  <p className="text-white/50 text-[9px] font-bold mt-1">
                    Class {className}{sectionName !== "—" ? ` · ${sectionName}` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            >
              <ClipboardList size={13} className={`text-white/70 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded px-4 py-3">
            <AlertCircle size={14} className="text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 flex-1">{error}</p>
            <button onClick={() => fetchAll()} className="text-[11px] font-bold text-rose-500 underline">Retry</button>
          </div>
        )}

        {/* ══ QUICK STAT CARDS ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { icon: ClipboardList, label: "Homeworks",     value: hwStats.total,        color: primaryColor, bg: primaryColor + "14" },
            { icon: CalendarCheck, label: "Days Present",  value: attStats.present,     color: "#10b981",    bg: "#d1fae5" },
            { icon: CalendarDays,  label: "Leave Applied", value: leaveStats.total,     color: "#f97316",    bg: "#ffedd5" },
            { icon: Bell,          label: "Notifications", value: notifications.length, color: "#8b5cf6",    bg: "#ede9fe" },
          ] as const).map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded border border-slate-100 p-3 flex items-center gap-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 shadow-sm relative overflow-hidden"
            >
              <div className="w-11 h-11 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                {loading ? (
                  <><Sk w={40} h={22} /><div className="mt-1.5"><Sk w={68} h={9} /></div></>
                ) : (
                  <>
                    <p className="text-[22px] font-black text-slate-800 tabular-nums leading-none">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{label}</p>
                  </>
                )}
              </div>
              <div className="absolute -right-5 -bottom-5 w-20 h-20 rounded-full opacity-[0.07]" style={{ backgroundColor: color }} />
            </div>
          ))}
        </div>

        {/* ══ MAIN GRID ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── Left 2 cols ── */}
          <div className="xl:col-span-2 space-y-4">

            {/* Performance Rings */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Performance Overview</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Attendance &amp; homework completion</p>
                </div>
                <Award size={17} style={{ color: primaryColor }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

                {/* Attendance Ring */}
                <div className="flex flex-col items-center gap-4">
                  {loading ? <Sk w={130} h={130} r={65} /> : (
                    <RingProgress pct={attStats.pct} size={130} stroke={13} color={attColor}>
                      <span className="text-[24px] font-black tabular-nums" style={{ color: attColor }}>{attStats.pct}%</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.18em] mt-0.5 text-slate-400">Attendance</span>
                    </RingProgress>
                  )}
                  <div className="w-full grid grid-cols-3 gap-2">
                    {([
                      { label: "Total",   value: attStats.total,   color: "#64748b", bg: "#f8fafc" },
                      { label: "Present", value: attStats.present, color: "#10b981", bg: "#f0fdf4" },
                      { label: "Absent",  value: attStats.absent,  color: "#f43f5e", bg: "#fff1f2" },
                    ] as const).map(({ label, value, color, bg }) => (
                      <div key={label} className="text-center rounded py-2.5" style={{ backgroundColor: bg }}>
                        {loading ? <Sk w="55%" h={16} /> : (
                          <p className="text-[15px] font-black tabular-nums" style={{ color }}>{value}</p>
                        )}
                        <p className="text-[9px] font-black uppercase tracking-wider mt-0.5 text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Homework Ring */}
                <div className="flex flex-col items-center gap-4">
                  {loading ? <Sk w={130} h={130} r={65} /> : (
                    <RingProgress pct={hwStats.pct} size={130} stroke={13} color={hwColor}>
                      <span className="text-[24px] font-black tabular-nums" style={{ color: hwColor }}>{hwStats.pct}%</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.18em] mt-0.5 text-slate-400">Submitted</span>
                    </RingProgress>
                  )}
                  <div className="w-full space-y-2.5">
                    {([
                      { label: "Submitted", value: hwStats.submitted, color: primaryColor },
                      { label: "Pending",   value: hwStats.pending,   color: "#f59e0b" },
                      { label: "Graded",    value: hwStats.graded,    color: "#10b981" },
                      { label: "Overdue",   value: hwStats.overdue,   color: "#ef4444" },
                    ] as const).map(({ label, value, color }) => {
                      const pct = hwStats.total > 0 ? Math.round((value / hwStats.total) * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-[11px] font-bold text-slate-600">{label}</span>
                            </div>
                            {loading ? <Sk w={36} h={10} /> : (
                              <span className="text-[11px] font-black tabular-nums" style={{ color }}>
                                {value} <span className="text-slate-400 font-medium text-[10px]">({pct}%)</span>
                              </span>
                            )}
                          </div>
                          {loading ? <Sk h={5} r={99} /> : (
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Attendance Chart */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Monthly Attendance</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Present vs absent days by month</p>
                </div>
                {!loading && attStats.total > 0 && (
                  <span
                    className="text-[11px] font-black px-3 py-1 rounded-full"
                    style={{ backgroundColor: attColor + "15", color: attColor }}
                  >
                    {attStats.pct}% rate
                  </span>
                )}
              </div>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center"><Sk w="92%" h={155} r={12} /></div>
              ) : attChartData.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-slate-300">
                  <CalendarCheck size={40} className="mb-3" />
                  <p className="text-sm font-bold text-slate-400">No attendance records yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={attChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="attPG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={primaryColor} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="attAG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#f87171" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="present" name="Present" stroke={primaryColor} strokeWidth={2.5} fill="url(#attPG)" dot={false} activeDot={{ r: 5, fill: primaryColor, stroke: "#fff", strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="absent"  name="Absent"  stroke="#f87171"    strokeWidth={2}   fill="url(#attAG)"  dot={false} activeDot={{ r: 4, fill: "#f87171",   stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent Homeworks */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Recent Homeworks</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Latest assignments from your class</p>
                </div>
                <BookOpen size={16} style={{ color: primaryColor }} />
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex gap-3">
                      <Sk w={36} h={36} r={8} />
                      <div className="flex-1 space-y-2"><Sk w="55%" h={12} /><Sk w="35%" h={9} /></div>
                      <Sk w={60} h={22} r={99} />
                    </div>
                  ))}
                </div>
              ) : homeworks.length === 0 ? (
                <p className="text-center text-[11px] text-slate-400 py-8">No homework records found</p>
              ) : (
                <div className="space-y-2">
                  {homeworks.map((hw) => {
                    const status = hw.status || (hw.is_submitted ? "submitted" : hw.is_graded ? "graded" : hw.is_overdue ? "overdue" : "pending");
                    const s = HW_STATUS[status] ?? HW_STATUS.pending;
                    return (
                      <div
                        key={hw.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: primaryColor + "15" }}
                        >
                          <BookOpen size={14} style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-slate-700">{hw.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {hw.subject && `${hw.subject} · `}
                            {hw.due_date ? `Due: ${hw.due_date}` : hw.created_at ? new Date(hw.created_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Notes */}
            {(loading || notes.length > 0) && (
              <div className="bg-white rounded shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Recent Notes</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Study materials shared by your teacher</p>
                  </div>
                  <FileText size={16} style={{ color: primaryColor }} />
                </div>
                {loading ? (
                  <div className="space-y-3">
                    {[0,1].map(i => (
                      <div key={i} className="flex gap-3">
                        <Sk w={36} h={36} r={8} />
                        <div className="flex-1 space-y-2"><Sk w="60%" h={12} /><Sk w="40%" h={9} /></div>
                        <Sk w={70} h={28} r={6} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notes.map((note) => {
                      const isPdf = note.file?.toLowerCase().endsWith(".pdf");
                      return (
                        <div
                          key={note.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-rose-50">
                            <FileText size={14} className="text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-slate-700">{note.title}</p>
                            <p className="text-[10px] text-slate-400">
                              {note.subject && `${note.subject} · `}
                              {isPdf ? "PDF" : "File"}
                              {note.created_at && ` · ${new Date(note.created_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <a
                            href={note.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: primaryColor + "12", color: primaryColor }}
                          >
                            <ExternalLink size={10} /> Open
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Homework Chart */}
            {hwChartData.length > 0 && (
              <div className="bg-white rounded shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Homework Progress</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Assigned vs submitted by month</p>
                  </div>
                  {hwStats.total > 0 && (
                    <span
                      className="text-[11px] font-black px-3 py-1 rounded-full"
                      style={{ backgroundColor: primaryColor + "12", color: primaryColor }}
                    >
                      {hwStats.pct}% submitted
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={hwChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barSize={13} barGap={4}>
                    <defs>
                      <linearGradient id="hwA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={primaryColor} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.45} />
                      </linearGradient>
                      <linearGradient id="hwS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#34d399" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.45} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="assigned"  name="Assigned"  fill="url(#hwA)" radius={[4,4,0,0]} />
                    <Bar dataKey="submitted" name="Submitted" fill="url(#hwS)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ══ RIGHT SIDEBAR ══════════════════════════════════════════════ */}
          <div className="space-y-3">

            {/* Student ID Card */}
            <div className="rounded overflow-hidden shadow-md border border-slate-100">
              {/* ── Gradient header with photo ── */}
              <div
                className="relative p-4 flex items-center gap-3 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}a0)` }}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

                {/* Avatar — shows resolved photo or initials fallback */}
                <div className="rounded-full p-0.5 bg-white/20 backdrop-blur-sm shrink-0">
                  <Ava
                    name={studentName}
                    color="rgba(255,255,255,0.3)"
                    size={48}
                    photo={studentPhoto}
                  />
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">Student Profile</p>
                  <p className="text-[14px] font-black text-white truncate">{loading ? "—" : studentName}</p>
                  <p className="text-[10px] text-white/55 mt-0.5 truncate">{loading ? "—" : studentEmail}</p>
                </div>
              </div>

              {/* ── Info rows ── */}
              <div className="bg-white px-3 py-3">
                {loading ? (
                  <div className="space-y-3">
                    {[0,1,2,3,4,5,6].map(i => (
                      <div key={i} className="flex justify-between items-center gap-3">
                        <Sk w="36%" h={10} /><Sk w="44%" h={10} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {([
                      { label: "Student ID",   value: studentId,    icon: Fingerprint },
                      { label: "Class",        value: className,    icon: School },
                      { label: "Section",      value: sectionName,  icon: Layers },
                      { label: "Roll No.",     value: rollNo,       icon: User },
                      { label: "Enroll Code",  value: enrollCode,   icon: Fingerprint },
                      { label: "Session",      value: sessionName,  icon: CalendarDays },
                    ] as const).map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Icon size={10} className="text-slate-300" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</span>
                        </div>
                        <span className="text-[11px] font-black text-right truncate max-w-[140px] text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Leave Summary */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-3">
              <h3 className="text-[13px] font-black text-slate-800 mb-3">Leave Summary</h3>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { label: "Approved", value: leaveStats.approved, color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Pending",  value: leaveStats.pending,  color: "#d97706", bg: "#fffbeb" },
                  { label: "Rejected", value: leaveStats.rejected, color: "#dc2626", bg: "#fff1f2" },
                ] as const).map(({ label, value, color, bg }) => (
                  <div key={label} className="flex flex-col items-center rounded py-3" style={{ backgroundColor: bg }}>
                    {loading ? <Sk w={24} h={18} /> : (
                      <p className="text-lg font-black tabular-nums" style={{ color }}>{value}</p>
                    )}
                    <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color }}>{label}</p>
                  </div>
                ))}
              </div>
              {!loading && leaves.length > 0 && (
                <div className="space-y-2 border-t border-slate-50 pt-3 mt-3">
                  {leaves.slice(0, 3).map((l, i) => {
                    const status = (l.status || "pending").toLowerCase();
                    const ac = status === "approved" ? "#16A34A" : status === "rejected" ? "#DC2626" : "#D97706";
                    return (
                      <div key={l.id ?? i} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-700 truncate">{l.leave_type || l.type || "Leave"}</p>
                          <p className="text-[10px] text-slate-400">{l.from_date || l.start_date || "—"}</p>
                        </div>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0"
                          style={{ backgroundColor: ac + "15", color: ac }}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-3">
              <h3 className="text-[13px] font-black text-slate-800 mb-3 flex items-center gap-2">
                <Bell size={12} style={{ color: primaryColor }} /> Notifications
                {!loading && notifications.length > 0 && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    {notifications.length}
                  </span>
                )}
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {[0,1].map(i => (
                    <div key={i} className="flex gap-2.5">
                      <Sk w={28} h={28} r={99} />
                      <div className="flex-1 space-y-1.5"><Sk w="70%" h={11} /><Sk w="45%" h={9} /></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-center text-[11px] text-slate-400 py-5">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n, i) => (
                    <div key={n.id ?? i} className="flex gap-3 items-start">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: primaryColor + "12" }}
                      >
                        <Bell size={11} style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 leading-snug">{n.title || n.message || "Notification"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

              <CalendarGrid 
              selectedMonthIndex={selectedMonthIndex} 
              setSelectedMonthIndex={setSelectedMonthIndex} 
              className="bg-white rounded shadow-sm border border-gray-100 p-2 !h-full"
            />
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}