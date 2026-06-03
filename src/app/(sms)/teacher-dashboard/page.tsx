"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  Users, BookOpen, School,
  Layers, ClipboardList, Calendar, Bell,
  AlertCircle, ChevronRight,
  Clock, CheckCircle2, Clock3,
  BarChart2, Star, Award,
  Hash, RefreshCw,
} from "lucide-react";
import { TeacherServices } from "@/services/teacherServices";
import { LeaveServices }   from "@/services/leaveServices";
import { NotificationServices } from "@/services/notificationServices";
import { AttendanceServices }   from "@/services/attendanceServices";
import {
  BarChart, Bar,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import useAuth from "@/lib/hooks/useAuth";
import DashboardCalendar from "@/components/ui/dashboardCalendar";
import CalendarGrid from "@/components/ui/CalendarGrid";
import NepaliDate from "nepali-date-converter";

// ─── Backend response types ───────────────────────────────────────────────────

interface TeacherDashboardResponse {
  teacher: {
    id: number;
    name: string;
    email: string;
    code: string;
    photo?: string;
  };
  assignments: Assignment[];
  note?: any[];
  homework?: Homework[];
  recent_homeworks?: Homework[];  // ✅ FIX: backend key is recent_homeworks
  recent_notes?: any[];
}

interface Assignment {
  class: string;
  section: string | null;   // ✅ FIX: section can be null
  subject: string;
}

interface Homework {
  id?: number;
  title?: string;
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
      className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
      style={{ width: w, height: h, borderRadius: r }}
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Ava({ name, color, size = 32, photo }: { name: string; color: string; size?: number; photo?: string }) {
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

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded shadow-xl px-3 py-2.5 min-w-[130px]">
      <p className="text-[11px] font-extrabold text-gray-700 mb-2 uppercase tracking-wide">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
            <span className="text-[10px] text-gray-500 font-medium">{p.name}</span>
          </div>
          <span className="text-[11px] font-extrabold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, loading }: {
  label: string; value: number | string; icon: any;
  color: string; bg: string; loading: boolean;
}) {
  return (
    <div className="bg-white rounded border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
      <div className="w-11 h-11 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
        <Icon size={19} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <><Sk w={48} h={22} /><div className="mt-1.5"><Sk w={72} h={9} /></div></>
        ) : (
          <>
            <p className="text-[24px] font-black text-gray-800 tabular-nums leading-none">{value}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">{label}</p>
          </>
        )}
      </div>
      <div className="absolute -right-5 -bottom-5 w-20 h-20 rounded-full opacity-[0.07]" style={{ backgroundColor: color }} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-300 gap-2">
      <Icon size={28} />
      <p className="text-[11px] text-gray-400 font-medium">{message}</p>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, badge, icon: Icon, primaryColor }: {
  title: string; subtitle?: string; badge?: string | number;
  icon?: any; primaryColor: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-[14px] font-black text-gray-800 tracking-tight flex items-center gap-2">
          {Icon && <Icon size={14} style={{ color: primaryColor }} />}
          {title}
        </h3>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {badge !== undefined && (
        <span
          className="text-[11px] font-black px-3 py-1 rounded-full"
          style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TeacherDashboardPage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastSync,   setLastSync]   = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Data from my_dashboard ─────────────────────────────────────────────────
  const [teacherInfo,  setTeacherInfo]  = useState<TeacherDashboardResponse["teacher"] | null>(null);
  const [assignments,  setAssignments]  = useState<Assignment[]>([]);
  const [homeworks,    setHomeworks]    = useState<Homework[]>([]);

  // ── Secondary data ─────────────────────────────────────────────────────────
  const [leaves,        setLeaves]        = useState<any[]>([]);
  const [attendance,    setAttendance]    = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(new NepaliDate().getMonth());
  const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000); // हरेक १ सेकेन्डमा अपडेट हुने

      return () => clearInterval(timer); // कम्पोनेन्ट अनमाउन्ट हुँदा क्लियर गर्ने
}, []);
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [dashR, lvR, attR, ntR] = await Promise.allSettled([
        TeacherServices.getTeacherDashboard(),
        LeaveServices.getAllLeaves?.(),
        AttendanceServices.getStudentAttendance?.(),
        NotificationServices.getAllNotifications?.(),
      ]);

      const v = (r: PromiseSettledResult<any>) =>
        r.status === "fulfilled" ? r.value : null;

      const dash: TeacherDashboardResponse | null = v(dashR);
      setTeacherInfo(dash?.teacher ?? null);
      setAssignments(dash?.assignments ?? []);

      // ✅ FIX: read recent_homeworks first, fallback to homework
      setHomeworks(getItems(dash?.recent_homeworks ?? dash?.homework));

      setLeaves(getItems(v(lvR)).slice(0, 4));
      setAttendance(getItems(v(attR)));
      setNotifications(getItems(v(ntR)).slice(0, 5));

      setLastSync(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived counts — ✅ FIX: filter out null sections ─────────────────────
  const uniqueClasses  = useMemo(
    () => [...new Set(assignments.map(a => a.class).filter(Boolean))],
    [assignments]
  );
  const uniqueSections = useMemo(
    () => [...new Set(assignments.map(a => a.section).filter(Boolean))],  // ✅ filters null
    [assignments]
  );
  const uniqueSubjects = useMemo(
    () => [...new Set(assignments.map(a => a.subject).filter(Boolean))],
    [assignments]
  );

  // ── Homework stats ─────────────────────────────────────────────────────────
  const hwStats = useMemo(() => {
    const total     = homeworks.length;
    const submitted = homeworks.filter(h => h.status === "submitted" || h.is_submitted).length;
    const graded    = homeworks.filter(h => h.status === "graded"    || h.is_graded).length;
    const overdue   = homeworks.filter(h => h.status === "overdue"   || h.is_overdue).length;
    const pending   = homeworks.filter(h => h.status === "pending"   || (!h.is_submitted && h.status !== "graded")).length;
    const pct       = total > 0 ? Math.round(((submitted + graded) / total) * 100) : 0;
    return { total, submitted, graded, overdue, pending, pct };
  }, [homeworks]);

  // ── Homework chart (by month) ──────────────────────────────────────────────
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
    return MONTHS.map(m => ({ month: m, ...map[m] })).filter(d => d.assigned > 0);
  }, [homeworks]);

  // ── Attendance chart (by weekday) ──────────────────────────────────────────
  const attChartData = useMemo(() => {
    const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat"];
    const map: Record<string, { present: number; absent: number }> = {};
    DAYS.forEach(d => { map[d] = { present: 0, absent: 0 }; });
    attendance.forEach((a: any) => {
      const d = new Date(a.date || a.created_at || "");
      if (isNaN(d.getTime())) return;
      const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
      if (!map[day]) return;
      (a.status || "").toLowerCase().startsWith("p") ? map[day].present++ : map[day].absent++;
    });
    return DAYS.map(day => ({ day, ...map[day] })).filter(d => d.present > 0 || d.absent > 0);
  }, [attendance]);

  const presentTotal  = attendance.filter(a => (a.status||"").toLowerCase().startsWith("p")).length;
  const absentTotal   = attendance.length - presentTotal;
  const attendancePct = attendance.length > 0 ? Math.round((presentTotal / attendance.length) * 100) : 0;

  // ── Teacher fields ─────────────────────────────────────────────────────────
  const teacherName  = teacherInfo?.name  || user?.name  || "Teacher";
  const teacherEmail = teacherInfo?.email || user?.email || "—";
  const teacherCode  = teacherInfo?.code  || "—";

  const getGreeting = () => {
    const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })).getHours();
    if (h >= 5  && h < 12) return "Good Morning ☀️";
    if (h >= 12 && h < 17) return "Good Afternoon 🌤";
    if (h >= 17 && h < 21) return "Good Evening 🌆";
    return "Good Night 🌙";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-2xl mx-auto space-y-5">

        {/* ══ HERO BANNER ════════════════════════════════════════════════════ */}
        <div
          className="relative rounded overflow-hidden shadow-md"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 55%, ${primaryColor}88 100%)` }}
        >
          <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full bg-white/[0.08] pointer-events-none" />
          <div className="absolute top-6 -right-2 w-28 h-28 rounded-full bg-white/[0.07] pointer-events-none" />
          <div className="absolute -bottom-10 left-24 w-44 h-44 rounded-full bg-white/[0.05] pointer-events-none" />

          <div className="relative p-5 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-white/65 text-[10px] font-black uppercase tracking-[0.18em] mb-0.5">{getGreeting()}</p>
              <h1 className="text-white text-[24px] font-black tracking-tight leading-tight truncate">
                {loading ? "Loading..." : teacherName}
              </h1>
              <p className="text-white/55 text-[11px] flex items-center gap-1.5 mt-0.5">
                {loading ? "—" : teacherEmail}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 backdrop-blur-sm">
                  Teacher
                </span>
                {!loading && teacherCode !== "—" && (
                  <span className="bg-white/15 text-white/90 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/15">
                    {teacherCode}
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

            {/* Assignment summary badges */}
            {!loading && (
              <div className="flex gap-3 flex-wrap shrink-0">
                {[
                  { label: "Classes",  value: uniqueClasses.length },
                  { label: "Sections", value: uniqueSections.length },
                  { label: "Subjects", value: uniqueSubjects.length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/15 backdrop-blur-sm border border-white/25 rounded px-5 py-3 text-center shadow-inner min-w-[72px]">
                    <p className="text-white/55 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
                    <p className="text-white text-[26px] font-black tabular-nums leading-none">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} className={`text-white/70 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded px-4 py-3">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
            <p className="text-xs text-rose-700 flex-1">{error}</p>
            <button onClick={() => fetchAll()} className="text-[11px] font-bold text-rose-500 underline">Retry</button>
          </div>
        )}

        {/* ══ STAT CARDS ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { label: "Classes",   value: uniqueClasses.length,  icon: School,        color: primaryColor, bg: primaryColor + "14" },
            { label: "Sections",  value: uniqueSections.length, icon: Layers,        color: "#8b5cf6",    bg: "#ede9fe" },
            { label: "Subjects",  value: uniqueSubjects.length, icon: BookOpen,      color: "#f97316",    bg: "#ffedd5" },
            { label: "Homeworks", value: hwStats.total,         icon: ClipboardList, color: "#10b981",    bg: "#d1fae5" },
          ] as const).map(s => (
            <StatCard key={s.label} {...s} loading={loading} />
          ))}
        </div>

        {/* ══ MAIN GRID ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── Left 2 cols ── */}
          <div className="xl:col-span-2 space-y-4">

            {/* ── Assignments Table ── */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-5">
              <SectionHeader
                title="My Assignments"
                subtitle="Classes, sections and subjects you teach"
                badge={`${assignments.length} total`}
                primaryColor={primaryColor}
              />

              {loading ? (
                <div className="space-y-3">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex gap-3">
                      <Sk w={36} h={36} r={8} />
                      <div className="flex-1 space-y-2"><Sk w="50%" h={12} /><Sk w="30%" h={9} /></div>
                    </div>
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <EmptyState icon={School} message="No assignments found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Class</th>
                        <th className="text-left py-2 px-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Section</th>
                        <th className="text-left py-2 px-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Subject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: primaryColor }}>
                              <School size={11} />
                              {a.class}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-600">
                              <Layers size={11} className="text-gray-400" />
                              {/* ✅ FIX: show "—" when section is null */}
                              {a.section ?? <span className="text-gray-300">—</span>}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className="inline-block text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
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
            </div>

            {/* ── Two-col: Homework Analytics + Weekly Attendance ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Homework Analytics */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-4">
                <SectionHeader
                  title="Homework Analytics"
                  subtitle="Assigned vs submitted · monthly"
                  badge={!loading && hwStats.total > 0 ? `#${hwStats.total}` : undefined}
                  primaryColor={primaryColor}
                />

                {/* KPI row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded px-3 py-2.5" style={{ backgroundColor: primaryColor + "10", border: `1px solid ${primaryColor}20` }}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: primaryColor }}>Assigned</p>
                    {loading ? <Sk w="70%" h={16} /> : (
                      <p className="text-[18px] font-black tabular-nums" style={{ color: primaryColor }}>{hwStats.total}</p>
                    )}
                  </div>
                  <div className="rounded px-3 py-2.5 bg-emerald-50 border border-emerald-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Submitted</p>
                    {loading ? <Sk w="70%" h={16} /> : (
                      <p className="text-[18px] font-black tabular-nums text-emerald-700">{hwStats.submitted}</p>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="h-[140px] flex items-center justify-center"><Sk w="85%" h={90} r={10} /></div>
                ) : hwChartData.length === 0 ? (
                  <EmptyState icon={ClipboardList} message="No homework data yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={hwChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="hwAssigned" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={primaryColor} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="hwSubmitted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#10b981" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="assigned"  name="Assigned"  stroke={primaryColor} strokeWidth={2.5} fill="url(#hwAssigned)"  dot={false} activeDot={{ r: 4, fill: primaryColor, stroke: "#fff", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#10b981"      strokeWidth={2.5} fill="url(#hwSubmitted)" dot={false} activeDot={{ r: 4, fill: "#10b981",   stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {/* Status pills */}
                <div className="grid grid-cols-3 gap-1.5 mt-4">
                  {([
                    { label: "Graded",  value: hwStats.graded,  color: primaryColor, bg: primaryColor + "10", icon: Star },
                    { label: "Pending", value: hwStats.pending,  color: "#d97706",   bg: "#fffbeb",           icon: Clock3 },
                    { label: "Overdue", value: hwStats.overdue,  color: "#dc2626",   bg: "#fff1f2",           icon: AlertCircle },
                  ] as const).map(({ label, value, color, bg, icon: Icon }) => (
                    <div key={label} className="rounded px-2 py-2 flex items-center gap-1.5" style={{ backgroundColor: bg }}>
                      <Icon size={11} style={{ color }} />
                      <div>
                        {loading ? <Sk w={20} h={12} /> : (
                          <p className="text-[13px] font-black tabular-nums leading-none" style={{ color }}>{value}</p>
                        )}
                        <p className="text-[8px] font-black uppercase tracking-wide mt-0.5" style={{ color }}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Attendance */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-4">
                <SectionHeader
                  title="Weekly Attendance"
                  subtitle="Present vs absent by weekday"
                  badge={!loading && attendance.length > 0 ? `${attendancePct}%` : undefined}
                  primaryColor={primaryColor}
                />

                {loading ? (
                  <div className="h-[160px] flex items-center justify-center"><Sk w="85%" h={110} r={10} /></div>
                ) : attChartData.length === 0 ? (
                  <EmptyState icon={Users} message="No attendance records yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={attChartData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }} barSize={18} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="present" name="Present" stackId="a" fill={primaryColor} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent"  name="Absent"  stackId="a" fill="#e2e8f0" />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {!loading && attendance.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                    {([
                      { label: "Total",   value: attendance.length, color: "#64748b", bg: "#f8fafc" },
                      { label: "Present", value: presentTotal,      color: "#10b981", bg: "#f0fdf4" },
                      { label: "Absent",  value: absentTotal,       color: "#f43f5e", bg: "#fff1f2" },
                    ] as const).map(({ label, value, color, bg }) => (
                      <div key={label} className="text-center rounded py-2" style={{ backgroundColor: bg }}>
                        <p className="text-[14px] font-black tabular-nums" style={{ color }}>{value}</p>
                        <p className="text-[9px] font-black uppercase tracking-wider mt-0.5 text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Recent Homeworks List ── */}
            {homeworks.length > 0 && (
              <div className="bg-white rounded shadow-sm border border-gray-100 p-5">
                <SectionHeader
                  title="Recent Homeworks"
                  icon={BookOpen}
                  primaryColor={primaryColor}
                />
                <div className="space-y-2">
                  {homeworks.slice(0, 6).map((hw, i) => {
                    const status = hw.status || (hw.is_submitted ? "submitted" : hw.is_graded ? "graded" : hw.is_overdue ? "overdue" : "pending");
                    const MAP: Record<string, { color: string; bg: string }> = {
                      submitted: { color: "#6366f1", bg: "#eef2ff" },
                      graded:    { color: "#10b981", bg: "#f0fdf4" },
                      pending:   { color: "#f59e0b", bg: "#fffbeb" },
                      overdue:   { color: "#ef4444", bg: "#fff1f2" },
                    };
                    const s = MAP[status] ?? MAP.pending;
                    return (
                      <div key={hw.id ?? i} className="flex items-center gap-3 p-2.5 rounded border border-gray-50 hover:bg-gray-50 transition-colors">
                        <div
                          className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: primaryColor + "15" }}
                        >
                          <BookOpen size={14} style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-gray-700">{hw.title || hw.subject || "Homework"}</p>
                          <p className="text-[10px] text-gray-400">
                            {hw.class && `Class ${hw.class}`}
                            {hw.section && ` · ${hw.section}`}
                            {hw.due_date && ` · Due: ${hw.due_date}`}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 capitalize"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Homework Summary */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4">
              <SectionHeader
                title="Homework Summary"
                icon={ClipboardList}
                primaryColor={primaryColor}
              />
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: "Submitted", value: hwStats.submitted, color: "#6366f1", bg: "#eef2ff" },
                  { label: "Graded",    value: hwStats.graded,    color: "#10b981", bg: "#f0fdf4" },
                  { label: "Pending",   value: hwStats.pending,   color: "#f59e0b", bg: "#fffbeb" },
                  { label: "Overdue",   value: hwStats.overdue,   color: "#ef4444", bg: "#fff1f2" },
                ] as const).map(({ label, value, color, bg }) => (
                  <div key={label} className="flex flex-col items-center rounded py-3" style={{ backgroundColor: bg }}>
                    {loading ? <Sk w={24} h={18} /> : (
                      <p className="text-lg font-black tabular-nums" style={{ color }}>{value}</p>
                    )}
                    <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color }}>{label}</p>
                  </div>
                ))}
              </div>
              {!loading && hwStats.total > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                    <span>Submission rate</span>
                    <span className="font-black" style={{ color: primaryColor }}>{hwStats.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${hwStats.pct}%`, backgroundColor: primaryColor }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT SIDEBAR ════════════════════════════════════════════════ */}
          <div className="space-y-3">

            {/* Teacher Profile Card */}
            <div className="rounded overflow-hidden shadow-md border border-gray-100">
              <div
                className="relative p-2 flex items-center gap-3 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}a0)` }}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                <Ava name={teacherName} color="rgba(255,255,255,0.25)" size={46} photo={teacherInfo?.photo} />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">Teacher Profile</p>
                  <p className="text-[15px] font-black text-white truncate">{loading ? "—" : teacherName}</p>
                  <p className="text-[10px] text-white/60 mt-0.5 truncate">{loading ? "—" : teacherEmail}</p>
                </div>
              </div>
              <div className="bg-white px-4 py-3 space-y-2.5">
                {([
                  { label: "Teacher Code", value: teacherCode },
                  { label: "Classes",      value: uniqueClasses.join(", ") || "—" },
                  // ✅ FIX: show "—" when no sections
                  { label: "Sections",     value: uniqueSections.length > 0 ? uniqueSections.join(", ") : "—" },
                  { label: "Subjects",     value: uniqueSubjects.join(", ") || "—" },
                ] as const).map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 shrink-0 mt-0.5">{label}</span>
                    <span className="text-[11px] font-black text-right text-gray-700 break-words max-w-[160px]">{loading ? "—" : value}</span>
                  </div>
                ))}
              </div>
            </div>

            

            {/* Leave Requests */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-black text-gray-800 flex items-center gap-2">
                  Leave Requests
                  {leaves.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                      {leaves.length}
                    </span>
                  )}
                </h3>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[0,1].map(i => (
                    <div key={i} className="flex gap-2.5 items-center">
                      <Sk w={32} h={32} r={99} />
                      <div className="flex-1 space-y-1.5"><Sk w="65%" h={11} /><Sk w="40%" h={9} /></div>
                    </div>
                  ))}
                </div>
              ) : leaves.length === 0 ? (
                <EmptyState icon={Calendar} message="No leave requests" />
              ) : (
                <div className="space-y-3">
                  {leaves.map((l, i) => {
                    const name   = l.teacher_name || l.student_name || l.name || `Leave #${l.id ?? i + 1}`;
                    const type   = l.leave_type || l.type || "Leave";
                    const status = (l.status || "pending").toLowerCase();
                    const photo  = l.teacher_photo || l.student_photo || l.photo || undefined;
                    return (
                      <div key={l.id ?? i} className="flex gap-2.5 items-center p-2 rounded hover:bg-gray-50 transition-colors">
                        <Ava
                          name={name}
                          color={status === "approved" ? "#16A34A" : status === "rejected" ? "#DC2626" : "#D97706"}
                          size={32}
                          photo={photo}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 truncate">{name}</p>
                          <p className="text-[10px] text-gray-400">{type}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          status === "rejected" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
                        }`}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ✅ IMPROVED: Notifications */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-black text-gray-800 flex items-center gap-2">
                  <Bell size={13} style={{ color: primaryColor }} />
                  Notifications
                </h3>
                {notifications.length > 0 && (
                  <span
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    {notifications.length}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="space-y-1">
                  {[0,1].map(i => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <Sk w={32} h={32} r={99} />
                      <div className="flex-1 space-y-1 pt-0.5"><Sk w="70%" h={11} /><Sk w="45%" h={9} /></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState icon={Bell} message="No notifications" />
              ) : (
                <div className="space-y-1">
                  {notifications.map((n, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start p-1 rounded hover:bg-gray-50 transition-colors"
                    >
                      {/* ✅ FIX: icon properly vertically centered with content */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: primaryColor + "12" }}
                      >
                        <Bell size={12} style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-gray-800 leading-snug">
                          {n.title || n.message || "Notification"}
                        </p>
                        {(n.created_at) && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(n.created_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric"
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ IMPROVED: Calendar wrapper for consistent rounding */}
            <div className="rounded overflow-hidden shadow-sm border border-gray-100">
                 <CalendarGrid 
              selectedMonthIndex={selectedMonthIndex} 
              setSelectedMonthIndex={setSelectedMonthIndex} 
              className="bg-white rounded shadow-sm border border-gray-100 p-2 !h-full"
            />
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}