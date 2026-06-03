"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import useAuth from "@/lib/hooks/useAuth";
import { ParentServices }       from "@/services/parentServices";
import { HomeworkServices }     from "@/services/homeworkServices";
import { LeaveServices }        from "@/services/leaveServices";
import { NotificationServices } from "@/services/notificationServices";
import { AttendanceServices }   from "@/services/attendanceServices";
import {
  GraduationCap, Bell, Clock, AlertCircle, ChevronRight,
  CheckCircle2, School, CalendarDays, Fingerprint,
  CalendarCheck, Award, Mail, User, Baby, BookOpen,
  ClipboardList, RefreshCw, Users, Layers,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import CalendarGrid from "@/components/ui/CalendarGrid";
import NepaliDate from "nepali-date-converter";

// ─── Base URL + resolvePhoto ──────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  return photo.startsWith("http") ? photo : `${BASE_URL}${photo}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardResponse {
  parent: {
    id: number;
    name: string;
    email: string;
  };
  children: DashboardChild[];
}

interface DashboardChild {
  student_id: string;
  name: string;
  photo: string | null;
  enrollments: Enrollment[];
}

interface Enrollment {
  class: string | null;
  section: string | null;
  session: string;
}

interface Homework {
  subject?: string;
  title?: string;
  status: "submitted" | "graded" | "pending" | "overdue";
  due_date?: string;
  is_submitted?: boolean;
  is_graded?: boolean;
  is_overdue?: boolean;
  class_assigned?: string;
  class?: string;
  class_id?: string;
}

interface Leave {
  leave_type?: string;
  type?: string;
  from_date?: string;
  start_date?: string;
  status: "approved" | "pending" | "rejected";
  student?: string;
  student_id?: string;
  applied_by?: string;
}

interface Notification {
  title?: string;
  message?: string;
  created_at?: string;
}

interface AttStats   { total: number; present: number; absent: number; pct: number }
interface HwStats    { total: number; submitted: number; pending: number; graded: number; overdue: number; pct: number }
interface LeaveStats { total: number; approved: number; pending: number; rejected: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getItems(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (d?.results) return d.results;
  if (d?.data && Array.isArray(d.data)) return d.data;
  return [];
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

// ─── Ring Progress ────────────────────────────────────────────────────────────
function RingProgress({
  pct, size = 110, stroke = 11, color, trackColor = "#e2e8f0", children,
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

// ─── Child Avatar ─────────────────────────────────────────────────────────────
const CHILD_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function ChildAvatar({
  name, color, size = 36, photo,
}: { name: string; color: string; size?: number; photo?: string | null }) {
  const [imgError, setImgError] = useState(false);

  // ✅ FIX: resolve the photo URL before using it
  const resolvedPhoto = resolvePhoto(photo);

  if (resolvedPhoto && !imgError) {
    return (
      <img
        src={resolvedPhoto}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = (name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.33 }}
    >
      {initials}
    </div>
  );
}

// ─── Status Map ───────────────────────────────────────────────────────────────
const HW_STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  submitted: { color: "#6366f1", bg: "#eef2ff", label: "Submitted" },
  graded:    { color: "#10b981", bg: "#f0fdf4", label: "Graded" },
  pending:   { color: "#f59e0b", bg: "#fffbeb", label: "Pending" },
  overdue:   { color: "#ef4444", bg: "#fff1f2", label: "Overdue" },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ParentDashboard() {
  const { primaryColor } = useTheme();
  const { user }         = useAuth();

  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastSync,     setLastSync]     = useState<Date | null>(null);

  const [parentInfo,   setParentInfo]   = useState<DashboardResponse["parent"] | null>(null);
  const [children,     setChildren]     = useState<DashboardChild[]>([]);
  const [selectedChildIdx, setSelectedChildIdx] = useState<number>(0);

  const [homeworks,     setHomeworks]     = useState<Homework[]>([]);
  const [leaves,        setLeaves]        = useState<Leave[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [attendance,    setAttendance]    = useState<any[]>([]);

  const child      = children[selectedChildIdx] ?? null;
  const childColor = CHILD_COLORS[selectedChildIdx % CHILD_COLORS.length];

  const activeEnrollment: Enrollment | null = child?.enrollments?.[0] ?? null;
  const className   = activeEnrollment?.class   ?? "—";
  const sectionName = activeEnrollment?.section ?? "—";
  const sessionName = activeEnrollment?.session ?? user?.active_session?.name ?? "—";
      const [selectedMonthIndex, setSelectedMonthIndex] = useState(new NepaliDate().getMonth());
    const [currentTime, setCurrentTime] = useState(new Date());
  
      useEffect(() => {
        const timer = setInterval(() => {
          setCurrentTime(new Date());
        }, 1000); // हरेक १ सेकेन्डमा अपडेट हुने
  
        return () => clearInterval(timer); // कम्पोनेन्ट अनमाउन्ट हुँदा क्लियर गर्ने
  }, []);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res: DashboardResponse = await ParentServices.getParentDashboard();
      setParentInfo(res.parent ?? null);
      setChildren(res.children ?? []);
      setLastSync(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchChildData = useCallback(async (c: DashboardChild) => {
    if (!c) return;
    try {
      const [hwR, lvR, attR, ntR] = await Promise.allSettled([
        HomeworkServices.getAllHomeworks(),
        LeaveServices.getAllLeaves(),
        AttendanceServices.getStudentAttendance(),
        NotificationServices.getAllNotifications?.() ?? Promise.resolve([]),
      ]);

      const v = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? r.value : null;

      const allHw   = getItems(v(hwR));
      const classId = c.enrollments?.[0]?.class;
      const myHw    = classId
        ? allHw.filter((h: any) =>
            h.class_assigned === classId ||
            h.class           === classId ||
            h.class_name      === classId
          )
        : allHw;

      const sid    = c.student_id;
      const allAtt = getItems(v(attR));
      const myAtt  = sid
        ? allAtt.filter((a: any) => a.student_id === sid || a.student === sid)
        : allAtt;

      const allLv = getItems(v(lvR));
      const myLv  = sid
        ? allLv.filter((l: any) => l.student_id === sid || l.student === sid)
        : allLv;

      setHomeworks(myHw.slice(0, 5));
      setLeaves(myLv);
      setAttendance(myAtt);
      setNotifications(getItems(v(ntR)).slice(0, 5));
    } catch (e: any) {
      console.error("Failed to fetch child data:", e);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    if (children.length > 0) {
      fetchChildData(children[selectedChildIdx]);
    }
  }, [selectedChildIdx, children, fetchChildData]);

  const parentName    = parentInfo?.name  || user?.name || user?.username || "Parent";
  const parentEmail   = parentInfo?.email || user?.email || "—";
  const parentId      = parentInfo?.id    ? `#${parentInfo.id}` : "—";
  const schoolName    = typeof user?.school === "object" ? (user.school?.name ?? "—") : (user?.school || "—");
  const totalChildren = children.length;

  const attStats = useMemo<AttStats>(() => {
    const total   = attendance.length;
    const present = attendance.filter(a =>
      ["present", "late"].includes((a.status || "").toLowerCase())
    ).length;
    const absent = total - present;
    const pct    = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, pct };
  }, [attendance]);

  const hwStats = useMemo<HwStats>(() => {
    const total     = homeworks.length;
    const submitted = homeworks.filter(h => h.status === "submitted" || h.is_submitted).length;
    const pending   = homeworks.filter(h => h.status === "pending").length;
    const graded    = homeworks.filter(h => h.status === "graded"   || h.is_graded).length;
    const overdue   = homeworks.filter(h => h.status === "overdue"  || h.is_overdue).length;
    const pct       = total > 0 ? Math.round(((submitted + graded) / total) * 100) : 0;
    return { total, submitted, pending, graded, overdue, pct };
  }, [homeworks]);

  const leaveStats = useMemo<LeaveStats>(() => {
    const total    = leaves.length;
    const approved = leaves.filter(l => l.status === "approved").length;
    const pending  = leaves.filter(l => l.status === "pending").length;
    const rejected = leaves.filter(l => l.status === "rejected").length;
    return { total, approved, pending, rejected };
  }, [leaves]);

  const attChartData = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<string, { present: number; absent: number }> = {};
    MONTHS.forEach(m => { map[m] = { present: 0, absent: 0 }; });
    attendance.forEach((a: any) => {
      const d = new Date(a.date || a.created_at || "");
      if (isNaN(d.getTime())) return;
      const m = MONTHS[d.getMonth()];
      const s = (a.status || "").toLowerCase();
      if (s === "present" || s === "late") map[m].present++;
      else map[m].absent++;
    });
    return MONTHS.map(month => ({ month, ...map[month] })).filter(d => d.present > 0 || d.absent > 0);
  }, [attendance]);

  const attColor = attStats.pct >= 80 ? "#10b981" : attStats.pct >= 60 ? "#f59e0b" : "#ef4444";
  const hwColor  = hwStats.pct  >= 80 ? primaryColor : hwStats.pct >= 60 ? "#f59e0b" : "#ef4444";

  const greeting = (): string => {
    const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })).getHours();
    if (h >= 5  && h < 12) return "Good Morning ☀️";
    if (h >= 12 && h < 17) return "Good Afternoon 🌤";
    if (h >= 17 && h < 21) return "Good Evening 🌆";
    return "Good Night 🌙";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-2xl mx-auto space-y-4">

        {/* ══ HERO BANNER ══════════════════════════════════════════════════ */}
        <div
          className="relative rounded overflow-hidden shadow-md"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 55%, ${primaryColor}88 100%)` }}
        >
          <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full bg-white/[0.08] pointer-events-none" />
          <div className="absolute top-6  -right-2  w-28 h-28 rounded-full bg-white/[0.07] pointer-events-none" />
          <div className="absolute -bottom-10 left-24 w-44 h-44 rounded-full bg-white/[0.05] pointer-events-none" />

          <div className="relative p-4 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-white/65 text-[10px] font-black uppercase tracking-[0.18em] mb-0.5">{greeting()}</p>
              <h1 className="text-white text-[22px] font-black tracking-tight leading-tight truncate">
                {loading ? "Loading..." : parentName}
              </h1>
              <p className="text-white/55 text-[11px] flex items-center gap-1.5 mt-0.5">
                <Mail size={10} className="shrink-0" />
                {loading ? "—" : parentEmail}
              </p>
              <div className="flex items-center gap-7 mt-2 flex-wrap">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 backdrop-blur-sm">
                  Parent
                </span>
                {!loading && schoolName !== "—" && (
                  <span className="bg-white/15 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/15">
                    <School size={9} />{schoolName}
                  </span>
                )}
                {/* {!loading && parentId !== "—" && (
                  <span className="bg-white/15 text-white/90 text-[10px] font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/15">
                    <Fingerprint size={10} />{parentId}
                  </span>
                )} */}
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

            {!loading && (
              <div className="shrink-0 bg-white/15 backdrop-blur-sm border border-white/25 rounded px-6 py-4 text-center shadow-inner">
                <p className="text-white/55 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Children</p>
                <p className="text-white text-3xl font-black tabular-nums leading-none">{totalChildren}</p>
                <p className="text-white/50 text-[9px] font-bold mt-1">Enrolled</p>
              </div>
            )}

            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            >
              <RefreshCw size={13} className={`text-white/70 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded px-4 py-3">
            <AlertCircle size={14} className="text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 flex-1">{error}</p>
            <button onClick={() => fetchDashboard()} className="text-[11px] font-bold text-rose-500 underline">Retry</button>
          </div>
        )}

        {/* ══ CHILD SELECTOR TABS ══════════════════════════════════════════ */}
        {!loading && children.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">Select Child:</span>
            {children.map((c, idx) => {
              const color    = CHILD_COLORS[idx % CHILD_COLORS.length];
              const isActive = idx === selectedChildIdx;
              return (
                <button
                  key={c.student_id}
                  onClick={() => setSelectedChildIdx(idx)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black transition-all border"
                  style={{
                    backgroundColor: isActive ? color : "#fff",
                    color:           isActive ? "#fff" : color,
                    borderColor:     color,
                    boxShadow:       isActive ? `0 2px 10px ${color}40` : "none",
                  }}
                >
                  {/* ✅ ChildAvatar now internally resolves the photo */}
                  <ChildAvatar name={c.name} color={isActive ? "rgba(255,255,255,0.3)" : color} size={20} photo={c.photo} />
                  {c.name}
                  {isActive && <CheckCircle2 size={11} />}
                </button>
              );
            })}
          </div>
        )}

        {/* ══ QUICK STAT CARDS ════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { icon: ClipboardList, label: "Homeworks",     value: hwStats.total,        color: primaryColor, bg: primaryColor + "14" },
            { icon: CalendarCheck, label: "Days Present",  value: attStats.present,     color: "#10b981",    bg: "#d1fae5" },
            { icon: CalendarDays,  label: "Leave Applied", value: leaveStats.total,     color: "#f97316",    bg: "#ffedd5" },
            { icon: Bell,          label: "Notifications", value: notifications.length, color: "#8b5cf6",    bg: "#ede9fe" },
          ] as const).map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label}
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

        {/* ══ MAIN GRID ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── LEFT 2 cols ── */}
          <div className="xl:col-span-2 space-y-3">

            {/* Child Info Banner */}
            {!loading && child && (
              <div className="bg-white rounded shadow-sm border border-slate-100 p-4">
                <div className="flex items-center gap-4">
                  {/* ✅ photo resolved inside ChildAvatar */}
                  <ChildAvatar name={child.name} color={childColor} size={52} photo={child.photo} />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[16px] font-black text-slate-800 truncate">{child.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {className !== "—" && (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <School size={9} className="text-slate-400" />{className}
                        </span>
                      )}
                      {sectionName !== "—" && (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Layers size={9} className="text-slate-400" />Section: {sectionName}
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold flex items-center gap-1" style={{ color: childColor }}>
                        <Fingerprint size={9} />{child.student_id}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Student ID</p>
                    <p className="text-[11px] font-mono font-black" style={{ color: childColor }}>{child.student_id}</p>
                    {sessionName !== "—" && (
                      <p className="text-[9px] text-slate-400 mt-1">{sessionName}</p>
                    )}
                  </div>
                </div>

                {child.enrollments.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">All Enrollments</p>
                    <div className="flex flex-wrap gap-2">
                      {child.enrollments.map((e, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-50 text-slate-600">
                          {[e.class, e.section, e.session].filter(Boolean).join(" · ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No children state */}
            {!loading && children.length === 0 && (
              <div className="bg-white rounded shadow-sm border border-slate-100 p-8 flex flex-col items-center gap-3">
                <Baby size={36} className="text-slate-200" />
                <p className="text-[13px] font-black text-slate-400">No children enrolled yet</p>
                <p className="text-[11px] text-slate-400">
                  Children will appear here once their enrollment is linked to your account.
                </p>
              </div>
            )}

            {/* Performance Rings */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Performance Overview</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {loading ? "Loading..." : child ? `${child.name}'s attendance & homework` : "Select a child to view"}
                  </p>
                </div>
                <Award size={17} style={{ color: primaryColor }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Attendance Ring */}
                <div className="flex flex-col items-center gap-4">
                  {loading ? <Sk w={110} h={110} r={55} /> : (
                    <RingProgress pct={attStats.pct} size={110} stroke={12} color={attColor}>
                      <span className="text-[22px] font-black tabular-nums leading-none" style={{ color: attColor }}>{attStats.pct}%</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] mt-0.5 text-slate-400">Attendance</span>
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
                          <p className="text-[15px] font-black tabular-nums leading-none" style={{ color }}>{value}</p>
                        )}
                        <p className="text-[9px] font-black uppercase tracking-wider mt-0.5 text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Homework Ring */}
                <div className="flex flex-col items-center gap-4">
                  {loading ? <Sk w={110} h={110} r={55} /> : (
                    <RingProgress pct={hwStats.pct} size={110} stroke={12} color={hwColor}>
                      <span className="text-[22px] font-black tabular-nums leading-none" style={{ color: hwColor }}>{hwStats.pct}%</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] mt-0.5 text-slate-400">Done</span>
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
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: color }} />
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
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Present vs absent days by month</p>
                </div>
                {!loading && attStats.total > 0 && (
                  <span className="text-[11px] font-black px-3 py-1 rounded-full"
                    style={{ backgroundColor: attColor + "15", color: attColor }}>
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
                      <linearGradient id="attPresentG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={primaryColor} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="attAbsentG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#f87171" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="present" name="Present" stroke={primaryColor} strokeWidth={2.5}
                      fill="url(#attPresentG)" dot={false} activeDot={{ r: 5, fill: primaryColor, stroke: "#fff", strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="absent"  name="Absent"  stroke="#f87171"    strokeWidth={2}
                      fill="url(#attAbsentG)"  dot={false} activeDot={{ r: 4, fill: "#f87171",   stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Homework List */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Recent Homeworks</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {loading ? "..." : child ? `Assigned to ${child.name}` : "Select a child"}
                  </p>
                </div>
                <BookOpen size={16} style={{ color: primaryColor }} />
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[0,1,2,3].map(i => (
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
                  {homeworks.map((hw, i) => {
                    const status = hw.status || (hw.is_submitted ? "submitted" : hw.is_graded ? "graded" : hw.is_overdue ? "overdue" : "pending");
                    const s = HW_STATUS_MAP[status] ?? HW_STATUS_MAP.pending;
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: primaryColor + "15" }}>
                          <BookOpen size={14} style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-slate-700">{hw.subject || hw.title || "Homework"}</p>
                          <p className="text-[10px] text-slate-400">Due: {hw.due_date || "—"}</p>
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0"
                          style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT SIDEBAR ════════════════════════════════════════════════ */}
          <div className="space-y-3">

            {/* Parent ID Card */}
            <div className="rounded overflow-hidden shadow-md border border-slate-100">
              <div
                className="relative p-3 flex items-center gap-3 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}a0)` }}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">Parent Profile</p>
                  <p className="text-[13px] font-black text-white truncate leading-tight">{loading ? "—" : parentName}</p>
                  <p className="text-[10px] text-white/55 mt-0.5 flex items-center gap-1 truncate">
                    <Mail size={9} />{loading ? "—" : parentEmail}
                  </p>
                </div>
              </div>
              <div className="bg-white px-3 py-3">
                {loading ? (
                  <div className="space-y-3">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="flex justify-between items-center gap-3">
                        <Sk w="36%" h={10} /><Sk w="44%" h={10} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {([
                      { label: "Parent ID", value: parentId,                   icon: Fingerprint },
                      { label: "School",    value: schoolName,                  icon: School },
                      { label: "Session",   value: sessionName,                 icon: CalendarDays },
                      { label: "Children",  value: `${totalChildren} Enrolled`, icon: Baby },
                    ] as const).map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Icon size={10} className="text-slate-300" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</span>
                        </div>
                        <span className="text-[11px] font-black text-right truncate max-w-[130px] text-slate-700">{value}</span>
                      </div>
                    ))}

                    {children.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">My Children</p>
                        <div className="space-y-2">
                          {children.map((c, idx) => {
                            const cc    = CHILD_COLORS[idx % CHILD_COLORS.length];
                            const isAct = idx === selectedChildIdx;
                            const enr   = c.enrollments[0];
                            return (
                              <button
                                key={c.student_id}
                                onClick={() => setSelectedChildIdx(idx)}
                                className="w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all text-left"
                                style={{
                                  borderColor:     isAct ? cc + "60" : "#f1f5f9",
                                  backgroundColor: isAct ? cc + "08" : "transparent",
                                }}
                              >
                                {/* ✅ photo resolved inside ChildAvatar */}
                                <ChildAvatar name={c.name} color={cc} size={28} photo={c.photo} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-slate-700 truncate">{c.name}</p>
                                  <p className="text-[9px] text-slate-400 font-mono">
                                    {enr ? [enr.class, enr.section].filter(Boolean).join(" · ") : c.student_id}
                                  </p>
                                </div>
                                {isAct && <CheckCircle2 size={12} style={{ color: cc, flexShrink: 0 }} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Leave Summary */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-black text-slate-800">Leave Summary</h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {loading ? "—" : child?.name.split(" ")[0] ?? "—"}
                </span>
              </div>
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
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-700 truncate">{l.leave_type || l.type || "Leave"}</p>
                          <p className="text-[10px] text-slate-400">{l.from_date || l.start_date || "—"}</p>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0"
                          style={{ backgroundColor: ac + "15", color: ac }}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                  Notifications
                  {!loading && notifications.length > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor + "15", color: primaryColor }}>
                      {notifications.length}
                    </span>
                  )}
                </h3>
              </div>
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
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: primaryColor + "12" }}>
                        <Bell size={12} style={{ color: primaryColor }} />
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
            {/* All Children Overview */}
            {!loading && children.length > 1 && (
              <div className="bg-white rounded shadow-sm border border-slate-100 p-3">
                <h3 className="text-[13px] font-black text-slate-800 mb-3 flex items-center gap-2">
                  <Users size={13} className="text-slate-400" /> All Children Overview
                </h3>
                <div className="space-y-3">
                  {children.map((c, idx) => {
                    const cc  = CHILD_COLORS[idx % CHILD_COLORS.length];
                    const enr = c.enrollments[0];
                    return (
                      <button
                        key={c.student_id}
                        onClick={() => setSelectedChildIdx(idx)}
                        className="w-full p-2.5 rounded-lg border text-left transition-all"
                        style={{
                          borderColor:     idx === selectedChildIdx ? cc + "60" : "#f1f5f9",
                          backgroundColor: idx === selectedChildIdx ? cc + "08" : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {/* ✅ photo resolved inside ChildAvatar */}
                          <ChildAvatar name={c.name} color={cc} size={24} photo={c.photo} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-700 truncate">{c.name}</p>
                            <p className="text-[9px] text-slate-400">{enr?.session ?? "—"}</p>
                          </div>
                          {idx === selectedChildIdx && <CheckCircle2 size={11} style={{ color: cc }} />}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: cc + "12", color: cc }}>
                            {c.student_id}
                          </span>
                          {enr?.class && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">
                              {enr.class}
                            </span>
                          )}
                          {enr?.section && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">
                              {enr.section}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}