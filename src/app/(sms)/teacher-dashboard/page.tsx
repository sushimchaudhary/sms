"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  Users, GraduationCap, BookOpen, School,
  Layers, ClipboardList, Calendar, Bell,
  AlertCircle, ChevronRight, UserCheck, Hash,
  Clock, CheckCircle2, Clock3,
  CircleDollarSign, BarChart2,
  FileText, Star, TrendingUp, Award,
  BookMarked, UserX, CalendarCheck,
} from "lucide-react";
import { ClassServices } from "@/services/classServices";
import { SubjectServices } from "@/services/subjectServices";
import { SectionServices } from "@/services/sectionServices";
import { HomeworkServices } from "@/services/homeworkServices";
import { LeaveServices } from "@/services/leaveServices";
import { NotificationServices } from "@/services/notificationServices";
import { AttendanceServices } from "@/services/attendanceServices";
import { EnrollmentServices } from "@/services/studentEnrollment";
import {
  BarChart, Bar,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import useAuth from "@/lib/hooks/useAuth";
import DashboardCalendar from "@/components/ui/dashboardCalendar";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCount(d: any): number {
  if (!d) return 0;
  if (Array.isArray(d)) return d.length;
  if (typeof d?.count === "number") return d.count;
  if (d?.results) return Array.isArray(d.results) ? d.results.length : 0;
  if (d?.data) return Array.isArray(d.data) ? d.data.length : 0;
  return 0;
}
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
function getName(obj: any): string {
  return obj?.full_name || obj?.name || obj?.username || obj?.user?.full_name || `#${obj?.id ?? "?"}`;
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
function Ava({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
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
    <div className="bg-white border border-gray-100 rounded shadow-xl px-2 py-4 min-w-[140px]">
      <p className="text-[11px] font-extrabold text-gray-700 mb-2 uppercase tracking-wide">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
            <span className="text-[10px] text-gray-500 font-medium">{p.name}</span>
          </div>
          <span className="text-[11px] font-extrabold text-gray-800">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Top Stat Card ────────────────────────────────────────────────────────────
function TopStatCard({ label, value, icon: Icon, bg, href, loading }: {
  label: string; value: number; icon: any; bg: string; href: string; loading: boolean;
}) {
  return (
    <a
      href={href}
      className="relative bg-white rounded border border-gray-100 p-2 flex items-center gap-4 overflow-hidden group hover:shadow-md transition-all duration-200 shadow-sm"
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200"
        style={{ background: `linear-gradient(135deg, ${bg}dd, ${bg})` }}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <><Sk w={56} h={28} /><div className="mt-2"><Sk w={80} h={11} /></div></>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-700 tabular-nums leading-none">{value.toLocaleString()}</p>
            <p className="text-[11px] text-gray-400 mt-1.5 font-semibold truncate">{label}</p>
          </>
        )}
      </div>
      <div className="absolute -right-5 -bottom-5 w-18 h-18 rounded-full opacity-[0.07]" style={{ backgroundColor: bg }} />
      <ChevronRight size={14} className="text-gray-300 flex-shrink-0 group-hover:text-gray-500 transition-colors" />
    </a>
  );
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
function MiniStatCard({ label, value, icon: Icon, bg, ic, href, loading }: {
  label: string; value: number; icon: any; bg: string; ic: string; href: string; loading: boolean;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded border border-gray-100 p-2 flex items-center gap-2.5 hover:shadow-md transition-all duration-200 group shadow-sm"
    >
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 group-hover:scale-115 transition-transform"
        style={{ backgroundColor: bg }}
      >
        <Icon size={15} style={{ color: ic }} />
      </div>
      <div className="min-w-0">
        {loading ? (
          <><Sk w={36} h={18} /><div className="mt-1"><Sk w={56} h={10} /></div></>
        ) : (
          <>
            <p className="text-lg font-extrabold text-gray-900 tabular-nums leading-none">{value.toLocaleString()}</p>
            <p className="text-[9px] text-gray-400 mt-0.5 font-semibold truncate">{label}</p>
          </>
        )}
      </div>
    </a>
  );
}

// ─── Main Teacher Dashboard ───────────────────────────────────────────────────
export default function TeacherDashboardPage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastSync, setLastSync]     = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [counts, setCounts] = useState({
    myClasses: 0, myStudents: 0, mySubjects: 0, mySections: 0,
    homeworks: 0, leaves: 0, notifications: 0, enrollments: 0,
  });

  const [allAttendance,  setAllAttendance]  = useState<any[]>([]);
  const [allHomeworks,   setAllHomeworks]   = useState<any[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [leaves,         setLeaves]         = useState<any[]>([]);
  const [myClasses,      setMyClasses]      = useState<any[]>([]);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await Promise.allSettled([
        ClassServices.getAllClasses(),
        SubjectServices.getAllSubjects(),
        SectionServices.getAllSections(),
        HomeworkServices.getAllHomeworks(),
        LeaveServices.getAllLeaves(),
        NotificationServices.getAllNotifications(),
        AttendanceServices.getStudentAttendance(),
        EnrollmentServices.getAllEnrollments(),
      ]);

      const v = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? r.value : null;
      const [clsR, subR, secR, hwR, lvR, ntR, attR, enrR] = res.map(v);

      const classes     = getItems(clsR);
      const subjects    = getItems(subR);
      const sections    = getItems(secR);
      const homeworks   = getItems(hwR);
      const leavesData  = getItems(lvR);
      const attendance  = getItems(attR);
      const enrollments = getItems(enrR);

      // Filter for current teacher (by user id or assigned teacher field)
      const teacherId = user?.id;
     const myClassList = classes.filter((c: any) => 
  c.teacher == teacherId || 
  c.teacher_id == teacherId || 
  c.assigned_teacher == teacherId
);
      const mySubjectList = subjects.filter((s: any) =>
        s.teacher === teacherId || s.teacher_id === teacherId
      );
      const mySectionList = sections.filter((s: any) =>
        s.teacher === teacherId || s.class_teacher === teacherId
      );
    const myHomeworks = homeworks.filter((h: any) => 
  h.teacher == teacherId || 
  h.assigned_by == teacherId || 
  h.created_by == teacherId
);

      // Fallback: if no teacher-specific data, show all (useful when API doesn't filter by teacher)
      const resolvedClasses  = myClassList.length  > 0 ? myClassList  : classes;
      const resolvedSubjects = mySubjectList.length > 0 ? mySubjectList : subjects;
      const resolvedSections = mySectionList.length > 0 ? mySectionList : sections;
      const resolvedHomeworks = myHomeworks.length  > 0 ? myHomeworks  : homeworks;

      // My students = students enrolled in my classes
      const myClassIds = new Set(resolvedClasses.map((c: any) => c.id));
      const myEnrollments = enrollments.filter((e: any) =>
        myClassIds.has(e.class_assigned) || myClassIds.has(e.class_id)
      );
      const myStudentCount = myEnrollments.length || enrollments.length;

      setCounts({
        myClasses:     resolvedClasses.length,
        myStudents:    myStudentCount,
        mySubjects:    resolvedSubjects.length,
        mySections:    resolvedSections.length,
        homeworks:     resolvedHomeworks.length,
        leaves:        leavesData.length,
        notifications: getCount(ntR),
        enrollments:   myEnrollments.length || getCount(enrR),
      });

      setAllAttendance(attendance);
      setAllHomeworks(resolvedHomeworks);
      setAllEnrollments(myEnrollments.length ? myEnrollments : enrollments);
      setMyClasses(resolvedClasses.slice(0, 8));
      // Recent students from enrollments
      setRecentStudents(
        (myEnrollments.length ? myEnrollments : enrollments).slice(0, 5)
      );
      setLeaves(leavesData.slice(0, 2));
      setLastSync(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Attendance by weekday ─────────────────────────────────────────────────
  const attendanceChartData = useMemo(() => {
    const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat"];
    const map: Record<string, { present: number; absent: number }> = {};
    DAYS.forEach(d => { map[d] = { present: 0, absent: 0 }; });
    allAttendance.forEach((a: any) => {
      const d = new Date(a.date || a.created_at || "");
      if (isNaN(d.getTime())) return;
      const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
      if (!map[day]) return;
      const s = (a.status || "").toLowerCase();
      if (s === "present" || s === "late") map[day].present++;
      else map[day].absent++;
    });
    const res = DAYS.map(day => ({ day, ...map[day] })).filter(d => d.present > 0 || d.absent > 0);
    return res.length > 0 ? res : null;
  }, [allAttendance]);

  // ── Homework by status ────────────────────────────────────────────────────
  const homeworkStats = useMemo(() => {
    const submitted  = allHomeworks.filter(h => h.status === "submitted"  || h.is_submitted).length;
    const pending    = allHomeworks.filter(h => h.status === "pending"    || (!h.is_submitted && h.status !== "graded")).length;
    const graded     = allHomeworks.filter(h => h.status === "graded"     || h.is_graded).length;
    const overdue    = allHomeworks.filter(h => h.status === "overdue"    || h.is_overdue).length;
    const total      = allHomeworks.length;
    const submissionPct = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return { submitted, pending, graded, overdue, total, submissionPct };
  }, [allHomeworks]);

  // ── Homework chart data (by month) ────────────────────────────────────────
  const homeworkChartData = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<string, { assigned: number; submitted: number }> = {};
    MONTHS.forEach(m => { map[m] = { assigned: 0, submitted: 0 }; });
    allHomeworks.forEach((h: any) => {
      const d = new Date(h.due_date || h.created_at || h.date || "");
      if (isNaN(d.getTime())) return;
      const m = MONTHS[d.getMonth()];
      map[m].assigned++;
      if (h.status === "submitted" || h.is_submitted) map[m].submitted++;
    });
    return MONTHS.map(month => ({
      month,
      assigned:  map[month].assigned,
      submitted: map[month].submitted,
    })).filter(d => d.assigned > 0);
  }, [allHomeworks]);

  // ── Class attendance breakdown ────────────────────────────────────────────
  const classAttendanceData = useMemo(() => {
    if (!myClasses.length || !allAttendance.length) return [];
    return myClasses.map((cls: any) => {
      const clsAtt = allAttendance.filter((a: any) =>
        a.class_id === cls.id || a.class === cls.id || a.class_name === cls.name
      );
      const present = clsAtt.filter(a => ["present","late"].includes((a.status||"").toLowerCase())).length;
      const absent  = clsAtt.length - present;
      const pct     = clsAtt.length > 0 ? Math.round((present / clsAtt.length) * 100) : 0;
      return { name: cls.name || `Class ${cls.id}`, present, absent, pct, total: clsAtt.length };
    }).filter(d => d.total > 0).slice(0, 6);
  }, [myClasses, allAttendance]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const presentTotal  = allAttendance.filter(a => ["present","late"].includes((a.status||"").toLowerCase())).length;
  const absentTotal   = allAttendance.length - presentTotal;
  const attendancePct = allAttendance.length > 0 ? Math.round((presentTotal / allAttendance.length) * 100) : 0;

  const topStats = [
    { label: "My Classes",    value: counts.myClasses,  icon: School,        bg: primaryColor, href: "/classe" },
    { label: "My Students",   value: counts.myStudents, icon: Users,         bg: "#10b981",    href: "/student" },
    { label: "My Subjects",   value: counts.mySubjects, icon: BookOpen,      bg: "#f97316",    href: "/subject" },
    { label: "Homeworks",     value: counts.homeworks,  icon: ClipboardList, bg: "#8b5cf6",    href: "/homework" },
  ];

  const secondaryStats = [
    { label: "Sections",      value: counts.mySections,    icon: Layers,       bg: "#FFF7ED", ic: "#EA580C", href: "/section" },
    { label: "Enrollments",   value: counts.enrollments,   icon: TrendingUp,   bg: primaryColor+"15", ic: primaryColor, href: "/enrollment" },
    { label: "Leave Taken",   value: counts.leaves,        icon: Calendar,     bg: "#FFF1F2", ic: "#E11D48", href: "/leave" },
    { label: "Notifications", value: counts.notifications, icon: Bell,         bg: "#EFF6FF", ic: "#2563EB", href: "/notification" },
    { label: "Submitted",     value: homeworkStats.submitted, icon: CheckCircle2, bg: "#F0FDF4", ic: "#16A34A", href: "/homework" },
    { label: "Pending",       value: homeworkStats.pending,   icon: Clock3,       bg: "#FFFBEB", ic: "#D97706", href: "/homework" },
    { label: "Graded",        value: homeworkStats.graded,    icon: Star,         bg: "#F5F3FF", ic: "#7C3AED", href: "/homework" },
    { label: "Overdue",       value: homeworkStats.overdue,   icon: AlertCircle,  bg: "#FFF1F2", ic: "#DC2626", href: "/homework" },
  ];

  const getGreeting = () => {
    const now = new Date();
    const nepalTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
    const hour = nepalTime.getHours();
    if (hour >= 5  && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-2xl mx-auto space-y-5">

        {/* ── Welcome Header ── */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-700 tracking-tight">
              {getGreeting()},{" "}
              <span style={{ color: primaryColor }}>
                {user?.name?.split(" ")[0] || "Teacher"}
              </span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                {user?.role || "Teacher"}
              </span>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Clock size={10} className="text-slate-300" />
                {lastSync
                  ? `Updated: ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Fetching..."}
              </p>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded px-4 py-3">
            <AlertCircle size={15} className="text-rose-500 flex-shrink-0" />
            <p className="text-xs text-rose-700 flex-1">{error}</p>
            <button onClick={() => fetchAll()} className="text-[11px] font-bold text-rose-500 underline">Retry</button>
          </div>
        )}

        {/* ── Top 4 cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {topStats.map(s => <TopStatCard key={s.label} {...s} loading={loading} />)}
        </div>

        {/* ── Secondary 8 cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {secondaryStats.map(s => <MiniStatCard key={s.label} {...s} loading={loading} />)}
        </div>

        {/* ── Main 3-col grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* ── Left 2/3 ── */}
          <div className="xl:col-span-2 space-y-4">

            {/* Row 1: Class Attendance + Homework Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Class-wise Attendance ── */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Class Attendance</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Attendance % per class</p>
                  </div>
                  {!loading && allAttendance.length > 0 && (
                    <span
                      className="text-[11px] font-extrabold px-2.5 py-1 rounded"
                      style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                    >
                      {attendancePct}% avg
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Sk key={i} h={14} />)}</div>
                ) : classAttendanceData.length === 0 ? (
                  /* Fallback: weekly bar chart when no per-class data */
                  !attendanceChartData ? (
                    <div className="flex items-center justify-center h-32 text-[11px] text-gray-400">No attendance data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={attendanceChartData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }} barSize={18} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                        <Bar dataKey="present" name="Present" stackId="a" fill={primaryColor} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="absent"  name="Absent"  stackId="a" fill="#e2e8f0" />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="space-y-3">
                    {classAttendanceData.map(({ name, present, total, pct }) => {
                      const bc = pct >= 80 ? "#10b981" : pct >= 60 ? primaryColor : "#f59e0b";
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[120px]">{name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{present}/{total}</span>
                              <span className="text-[11px] font-extrabold tabular-nums" style={{ color: bc }}>{pct}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: bc }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loading && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                    {[
                      { label: "Total",   value: allAttendance.length },
                      { label: "Present", value: presentTotal },
                      { label: "Absent",  value: absentTotal },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center bg-gray-50 rounded py-2">
                        <p className="text-[14px] font-extrabold text-gray-800 tabular-nums">{value}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Homework Analytics Card ── */}
              <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-3 pt-3 pb-2" style={{ background: `linear-gradient(135deg, ${primaryColor}08 0%, #fff 60%)` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: primaryColor + "20" }}>
                          <BarChart2 size={11} style={{ color: primaryColor }} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 tracking-tight">Homework Analytics</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium ml-7">Assigned vs submitted · monthly</p>
                    </div>
                    {!loading && homeworkStats.total > 0 && (
                      <div
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border"
                        style={{ backgroundColor: primaryColor + "10", borderColor: primaryColor + "30", color: primaryColor }}
                      >
                        <Hash size={9} /> {homeworkStats.total}
                      </div>
                    )}
                  </div>

                  {/* KPI row */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded px-3 py-2.5" style={{ backgroundColor: primaryColor + "10", border: `1px solid ${primaryColor}20` }}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: primaryColor }}>Assigned</p>
                      {loading ? <Sk w="80%" h={16} /> : (
                        <p className="text-[15px] font-black tabular-nums leading-none" style={{ color: primaryColor }}>
                          {homeworkStats.total}
                        </p>
                      )}
                    </div>
                    <div className="rounded px-3 py-2.5 bg-emerald-50 border border-emerald-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Submitted</p>
                      {loading ? <Sk w="80%" h={16} /> : (
                        <p className="text-[15px] font-black tabular-nums leading-none text-emerald-700">
                          {homeworkStats.submitted}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="px-3 pb-2 flex-1">
                  {loading ? (
                    <div className="h-[148px] flex items-center justify-center"><Sk w="85%" h={90} r={10} /></div>
                  ) : homeworkChartData.length === 0 ? (
                    <div className="h-[148px] flex flex-col items-center justify-center text-gray-300">
                      <ClipboardList size={30} className="mb-2" />
                      <p className="text-[11px] font-bold text-gray-400">No homework data yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={148}>
                      <AreaChart data={homeworkChartData} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
                        <defs>
                          <linearGradient id="assignedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={primaryColor} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="submittedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#10b981" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="assigned"  name="Assigned"  stroke={primaryColor} strokeWidth={2.5} fill="url(#assignedGrad)"  dot={false} activeDot={{ r: 5, fill: primaryColor, stroke: "#fff", strokeWidth: 2.5 }} />
                        <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#10b981"      strokeWidth={2.5} fill="url(#submittedGrad)" dot={false} activeDot={{ r: 5, fill: "#10b981",   stroke: "#fff", strokeWidth: 2.5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Legend footer */}
                <div className="px-5 pb-4 pt-1 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                      <span className="w-5 h-[2.5px] rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                      Assigned
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                      <span className="w-5 h-[2.5px] rounded-full inline-block bg-emerald-400" />
                      Submitted
                    </span>
                  </div>
                  {!loading && homeworkStats.total > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                      <CheckCircle2 size={10} className="text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700">
                        {homeworkStats.submissionPct}% submission rate
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Homework Status Summary ── */}
                <div className="mx-1 mb-5 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 bg-white">
                    <span className="text-[11px] font-black text-gray-700 flex items-center gap-1.5">
                      <ClipboardList size={12} style={{ color: primaryColor }} />
                      Homework Status
                    </span>
                    {!loading && homeworkStats.total > 0 && (
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                      >
                        {homeworkStats.submissionPct}% submitted
                      </span>
                    )}
                  </div>

                  <div className="p-2 space-y-3">
                    {/* Progress bar */}
                    {!loading && homeworkStats.total > 0 && (
                      <div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${homeworkStats.submissionPct}%`, backgroundColor: primaryColor }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[9px] text-gray-500 font-semibold">{homeworkStats.submitted} submitted</span>
                          <span className="text-[9px] text-gray-400">of {homeworkStats.total} assigned</span>
                        </div>
                      </div>
                    )}
                    {loading && (
                      <div>
                        <Sk h={10} r={5} />
                        <div className="flex justify-between mt-1.5"><Sk w="38%" h={9} /><Sk w="30%" h={9} /></div>
                      </div>
                    )}

                    {/* Donut row */}
                    {loading ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[0,1].map(i => (
                          <div key={i} className="flex flex-col items-center gap-1 py-2">
                            <Sk w={60} h={60} r={30} />
                            <Sk w="70%" h={10} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Submitted", value: homeworkStats.submitted, pct: homeworkStats.submissionPct, color: primaryColor, track: primaryColor + "22", bg: primaryColor + "0d" },
                          { label: "Pending",   value: homeworkStats.pending,   pct: homeworkStats.total > 0 ? Math.round((homeworkStats.pending / homeworkStats.total) * 100) : 0, color: "#f59e0b", track: "#fef3c7", bg: "#fffbeb" },
                        ].map(({ label, value, pct, color, track, bg }) => {
                          const safe = Math.max(0, Math.min(100, pct));
                          return (
                            <div key={label} className="flex flex-col items-center rounded py-3 px-2" style={{ backgroundColor: bg }}>
                              <div className="relative" style={{ width: 62, height: 62 }}>
                                <ResponsiveContainer width={62} height={62}>
                                  <RechartsPie>
                                    <Pie data={[{ v: safe }, { v: 100 - safe }]} cx="50%" cy="50%" innerRadius={20} outerRadius={28} startAngle={90} endAngle={-270} dataKey="v" stroke="none" paddingAngle={safe > 0 && safe < 100 ? 2 : 0}>
                                      <Cell fill={color} />
                                      <Cell fill={track} />
                                    </Pie>
                                  </RechartsPie>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[11px] font-black tabular-nums" style={{ color }}>{safe}%</span>
                                </div>
                              </div>
                              <p className="text-[12px] font-black tabular-nums mt-1.5 leading-tight text-center" style={{ color }}>{value}</p>
                              <p className="text-[8px] font-black uppercase tracking-wider mt-0.5" style={{ color }}>{label}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Status pills */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "Graded",  value: homeworkStats.graded,  color: primaryColor, bg: primaryColor + "10", icon: Star },
                        { label: "Pending", value: homeworkStats.pending,  color: "#d97706",   bg: "#fffbeb",            icon: Clock3 },
                        { label: "Overdue", value: homeworkStats.overdue,  color: "#dc2626",   bg: "#fff1f2",            icon: AlertCircle },
                      ].map(({ label, value, color, bg, icon: Icon }) => (
                        <div key={label} className="rounded px-2.5 py-2 flex items-center gap-1.5" style={{ backgroundColor: bg }}>
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
                </div>
              </div>
            </div>

            {/* Row 2: Weekly Attendance + Gender/Subject Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Weekly Attendance Bar ── */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Weekly Attendance</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Present vs absent by weekday</p>
                  </div>
                  {!loading && allAttendance.length > 0 && (
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded" style={{ backgroundColor: primaryColor + "15", color: primaryColor }}>
                      {attendancePct}%
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="h-[150px] flex items-center justify-center"><Sk w="80%" h={100} /></div>
                ) : !attendanceChartData ? (
                  <div className="h-[150px] flex flex-col items-center justify-center text-gray-400">
                    <Users size={28} className="mb-2 opacity-30" />
                    <p className="text-[11px] font-semibold">No attendance records yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={attendanceChartData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }} barSize={18} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="present" name="Present" stackId="a" fill={primaryColor} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent"  name="Absent"  stackId="a" fill="#e2e8f0" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {!loading && allAttendance.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                        <span className="text-[10px] text-gray-500 font-medium">Present <b className="text-gray-700">{presentTotal}</b></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="text-[10px] text-gray-500 font-medium">Absent <b className="text-gray-700">{absentTotal}</b></span>
                      </div>
                    </div>
                    <span className="text-[14px] font-extrabold tabular-nums" style={{ color: primaryColor }}>{attendancePct}%</span>
                  </div>
                )}
              </div>

              {/* ── Teaching Summary Stats ── */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Teaching Summary</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Overview of your academic load</p>
                  </div>
                  <Award size={16} style={{ color: primaryColor }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "My Classes",  value: counts.myClasses,  color: primaryColor, icon: School,        desc: "Assigned classes" },
                    { label: "My Subjects", value: counts.mySubjects, color: "#f97316",    icon: BookOpen,      desc: "Subjects teaching" },
                    { label: "Sections",    value: counts.mySections, color: "#8b5cf6",    icon: Layers,        desc: "Class sections" },
                    { label: "Students",    value: counts.myStudents, color: "#10b981",    icon: Users,         desc: "Total students" },
                  ].map(({ label, value, color, icon: Icon, desc }) => (
                    <div key={label} className="rounded p-3" style={{ backgroundColor: color + "0d", border: `1px solid ${color}20` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                          <Icon size={12} style={{ color }} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>{label}</span>
                      </div>
                      {loading ? <Sk w="60%" h={20} /> : (
                        <p className="text-xl font-black tabular-nums leading-none" style={{ color }}>{value.toLocaleString()}</p>
                      )}
                      <p className="text-[9px] text-gray-400 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-3">

            {/* Teaching Summary Mini */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
              <h3 className="text-sm font-bold text-gray-800 mb-3">My Overview</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Classes",    value: counts.myClasses,  color: primaryColor, icon: School },
                  { label: "Sections",   value: counts.mySections, color: "#8b5cf6",    icon: Layers },
                  { label: "Subjects",   value: counts.mySubjects, color: "#f97316",    icon: BookOpen },
                  { label: "Homeworks",  value: counts.homeworks,  color: "#10b981",    icon: ClipboardList },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="rounded p-3 flex items-center gap-2" style={{ backgroundColor: color + "10" }}>
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-gray-800 tabular-nums leading-none">
                        {loading ? "—" : value.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Requests */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-800">Leave Requests</h3>
                  {counts.leaves > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                      {counts.leaves}
                    </span>
                  )}
                </div>
                <a href="/leave" className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5">
                  View all <ChevronRight size={12} />
                </a>
              </div>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex gap-2.5 animate-pulse">
                      <Sk w={30} h={30} r={99} />
                      <div className="flex-1"><Sk w="65%" h={12} /><div className="mt-1"><Sk w="40%" h={10} /></div></div>
                    </div>
                  ))
                ) : leaves.length === 0 ? (
                  <p className="text-center text-[11px] text-gray-400 py-4">No leave requests</p>
                ) : (
                  leaves.map((l, i) => {
                    const name   = l.teacher_name || l.student_name || l.name || getName(l);
                    const type   = l.leave_type || l.type || "Leave";
                    const status = (l.status || "pending").toLowerCase();
                    const ac = status === "approved" ? "#16A34A" : status === "rejected" ? "#DC2626" : "#D97706";
                    return (
                      <div key={l.id ?? i} className="flex gap-2.5 items-center">
                        <Ava name={name} color={ac} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 uppercase truncate leading-tight">{name}</p>
                          <p className="text-[10px] text-gray-400">{type}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                          status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          status === "rejected" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
                        }`}>{status}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Students */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-800">My Students</h3>
                  {counts.myStudents > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                    >
                      {counts.myStudents}
                    </span>
                  )}
                </div>
                <a href="/student" className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5">
                  View all <ChevronRight size={12} />
                </a>
              </div>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-2.5 animate-pulse">
                      <Sk w={30} h={30} r={99} />
                      <div className="flex-1"><Sk w="65%" h={12} /><div className="mt-1"><Sk w="40%" h={10} /></div></div>
                    </div>
                  ))
                ) : recentStudents.length === 0 ? (
                  <p className="text-center text-[11px] text-gray-400 py-4">No students found</p>
                ) : (
                  recentStudents.map((s, i) => {
                    const name  = s.student_name || getName(s);
                    const info  = s.class_name || s.class_assigned_name || s.roll_number || `ID: ${s.id}`;
                    return (
                      <div key={s.id ?? i} className="flex gap-2.5 items-center">
                        <Ava name={name} color={primaryColor} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 uppercase truncate leading-tight">{name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{info}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          s.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                        }`}>{s.is_active !== false ? "active" : "inactive"}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Calendar */}
            <DashboardCalendar primaryColor={primaryColor} />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
}