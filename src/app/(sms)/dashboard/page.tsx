"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  Users, GraduationCap, UserCog, BookOpen, School,
  Layers, ClipboardList, Calendar, Bell, TrendingUp,
  AlertCircle, ChevronRight, UserCheck, Hash,
  Clock,  Wallet, CheckCircle2, Clock3,
  CircleDollarSign,  ArrowUpRight, 
  BarChart2, 
  
} from "lucide-react";
import { StudentServices } from "@/services/studentServices";
import { ParentServices } from "@/services/parentServices";
import { ClassServices } from "@/services/classServices";
import { SubjectServices } from "@/services/subjectServices";
import { SectionServices } from "@/services/sectionServices";
import { EnrollmentServices } from "@/services/studentEnrollment";
import { HomeworkServices } from "@/services/homeworkServices";
import { LeaveServices } from "@/services/leaveServices";
import { NotificationServices } from "@/services/notificationServices";
import { AttendanceServices } from "@/services/attendanceServices";
import { FeeServices } from "@/services/feeServices";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, 
} from "recharts";
import { SessionServices } from "@/services/sessionsServices";
import { TeacherServices } from "@/services/teacherServices";
import { StaffServices } from "@/services/staffServices";
import useAuth from "@/lib/hooks/useAuth";

import CalendarGrid from "@/components/ui/CalendarGrid";
import NepaliDate from "nepali-date-converter";
import Link from "next/link";

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
function splitStaffAndTeachers(items: any[]) {
  const teachers: any[] = [], staff: any[] = [];
  items.forEach((u) => {
    const role = (u.role || u.user_type || "").toLowerCase();
    const isTeacher = role === "teacher" || u.is_teacher === true || u.qualification !== undefined;
    if (isTeacher) teachers.push(u); else staff.push(u);
  });
  return { teachers, staff };
}
function formatRs(val: number): string {
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return val.toLocaleString();
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

// ─── Enhanced Earnings Chart Tooltip ─────────────────────────────────────────
function EarningsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const earnings = payload.find((p: any) => p.dataKey === "earnings");
  const expenses = payload.find((p: any) => p.dataKey === "expenses");
  const net = (earnings?.value || 0) - (expenses?.value || 0);
  const isProfit = net >= 0;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-xl px-2 py-1.5 min-w-[150px]" style={{ backdropFilter: "blur(12px)" }}>
      <p className="text-[10px] font-black text-gray-800 mb-1 uppercase tracking-widest border-b border-gray-100 pb-2">{label}</p>
      {earnings && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: earnings.fill || earnings.stroke }} />
            <span className="text-[11px] text-gray-500 font-semibold">Payment Record</span>
          </div>
          <span className="text-[10px] font-black text-gray-900 tabular-nums">Rs. {Number(earnings.value).toLocaleString()}</span>
        </div>
      )}
      {expenses && (
        <div className="flex items-center justify-between gap-6 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-sm bg-rose-400" />
            <span className="text-[10px] text-gray-500 font-semibold">Expenses</span>
          </div>
          <span className="text-[10px] font-black text-rose-600 tabular-nums">Rs. {Number(expenses.value).toLocaleString()}</span>
        </div>
      )}
      
    </div>
  );
}

// ─── Standard Chart Tooltip ───────────────────────────────────────────────────
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
      className="relative bg-white rounded border border-gray-100 p-3 flex items-center gap-4 overflow-hidden group hover:shadow-md hover:hover:-translate-y-0.5  transition-all duration-200 shadow-sm"
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 shadow-md  transition-transform duration-200"
        style={{ background: `linear-gradient(135deg, ${bg}dd, ${bg})` }}
      >
        <Icon size={18} className="text-white" />
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
      className="bg-white rounded border border-gray-100 p-2 flex items-center gap-2.5 hover:shadow-md hover:hover:-translate-y-0.5 transition-all duration-200 group shadow-sm"
    >
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-transform"
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastSync, setLastSync]     = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [counts, setCounts] = useState({
    students: 0, teachers: 0, staff: 0, staffTeachers: 0,
    parents: 0, classes: 0, subjects: 0, sections: 0,
    enrollments: 0, homeworks: 0, leaves: 0, notifications: 0,
  });
  const [allStudents,    setAllStudents]    = useState<any[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [allAttendance,  setAllAttendance]  = useState<any[]>([]);
  const [allPayments,    setAllPayments]    = useState<any[]>([]);
  const [allExpenses,    setAllExpenses]    = useState<any[]>([]);
  const [allStudentFees, setAllStudentFees] = useState<any[]>([]);
  const [students,       setStudents]       = useState<any[]>([]);
  const [leaves,         setLeaves]         = useState<any[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new NepaliDate().getMonth());
 const [currentTime, setCurrentTime] = useState(new Date());

  
  const fetchAll = useCallback(async (isRefresh = false) => {
    
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await Promise.allSettled([
        StudentServices.getAllStudents(),
        TeacherServices.getAllTeachers(),
        ParentServices.getAllParents(),
        StaffServices.getAllstaffs(),
        ClassServices.getAllClasses(),
        SessionServices.getSessions(),
        SubjectServices.getAllSubjects(),
        SectionServices.getAllSections(),
        EnrollmentServices.getAllEnrollments(),
        HomeworkServices.getAllHomeworks(),
        LeaveServices.getAllLeaves(),
        NotificationServices.getAllNotifications(),
        AttendanceServices.getStudentAttendance(),
        FeeServices.getAllPayments(),
        FeeServices.getAllExpenses(),
        FeeServices.getAllStudentFees(),
      ]);

      const v = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? r.value : null;
      const [
        studR, tchR, parR, stfR,
        clsR, _sesR, subR, secR,
        enrR, hwR, lvR, ntR,
        attR, payR, expR, sfR,
      ] = res.map(v);

      // const rawTeachers = getItems(tchR), rawStaff = getItems(stfR);
      // let resolvedTeachers: any[], resolvedStaff: any[];
      // if (rawTeachers.length > 0 || rawStaff.length > 0) {
      //   resolvedTeachers = rawTeachers; resolvedStaff = rawStaff;
      // } else {
      //   const split = splitStaffAndTeachers(rawTeachers.length ? rawTeachers : rawStaff);
      //   resolvedTeachers = split.teachers; resolvedStaff = split.staff;
      // }

        const rawTeachers = getItems(tchR);
        const rawStaff = getItems(stfR);

         

        let resolvedTeachers: any[] = rawTeachers;
        let resolvedStaff: any[] = rawStaff;

        // Only fall back to splitting if BOTH dedicated endpoints returned nothing
        if (rawTeachers.length === 0 && rawStaff.length === 0) {
          const combined = getItems(tchR).length ? getItems(tchR) : getItems(stfR);
          const split = splitStaffAndTeachers(combined);
          resolvedTeachers = split.teachers;
          resolvedStaff = split.staff;
        }
console.log("rawTeachers:", rawTeachers.length, "rawStaff:", rawStaff.length);
console.log("stfR result:", stfR);

      setCounts({
        students: getCount(studR), 
        teachers: resolvedTeachers.length,
        staff: resolvedStaff.length,
        staffTeachers: [...resolvedTeachers, ...resolvedStaff].length,
        parents: getCount(parR), classes: getCount(clsR),
        subjects: getCount(subR), sections: getCount(secR),
        enrollments: getCount(enrR), homeworks: getCount(hwR),
        leaves: getCount(lvR), notifications: getCount(ntR),
      });

      setAllStudents(getItems(studR));
      setAllEnrollments(getItems(enrR));
      setAllAttendance(getItems(attR));
      setAllPayments(getItems(payR));
      setAllExpenses(getItems(expR));
      setAllStudentFees(getItems(sfR));
      setStudents(getItems(studR).slice(0, 5));
      setLeaves(getItems(lvR).slice(0, 2));
      setLastSync(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);


useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000); // हरेक १ सेकेन्डमा अपडेट हुने

  return () => clearInterval(timer); // कम्पोनेन्ट अनमाउन्ट हुँदा क्लियर गर्ने
}, []);

  // ── Gender ────────────────────────────────────────────────────────────────
  const genderData = useMemo(() => {
    const boys  = allStudents.filter(s => (s.gender || "").toLowerCase() === "male").length;
    const girls = allStudents.filter(s => (s.gender || "").toLowerCase() === "female").length;
    const other = allStudents.length - boys - girls;
    const fallbackBoys  = Math.round(allStudents.length * 0.45);
    const fallbackGirls = allStudents.length - fallbackBoys;
    return [
      { name: "Boys",  value: boys  || fallbackBoys,  color: "#1e293b" },
      { name: "Girls", value: girls || fallbackGirls, color: primaryColor },
      ...(other > 0 && (boys > 0 || girls > 0)
        ? [{ name: "Other", value: other, color: "#94a3b8" }]
        : []),
    ].filter(d => d.value > 0);
  }, [allStudents, primaryColor]);

  // ── Enrollment by class ───────────────────────────────────────────────────
  const enrollmentByClass = useMemo(() => {
    if (!allEnrollments.length) return [];
    const map: Record<string, { total: number; active: number }> = {};
    allEnrollments.forEach((e: any) => {
      const cls = e.class_name || e.class_assigned_name || `Class ${e.class_assigned}` || "Unknown";
      if (!map[cls]) map[cls] = { total: 0, active: 0 };
      map[cls].total++;
      if (e.is_active !== false) map[cls].active++;
    });
    return Object.entries(map)
      .map(([name, { total, active }]) => ({
        name, enrolled: total, active,
        pct: total > 0 ? Math.round((active / total) * 100) : 0,
      }))
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 8);
  }, [allEnrollments]);

  // ── Earnings chart (Total Amount + Expenses only) ─────────────────────────
  const earningsChartData = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<string, { earnings: number; expenses: number }> = {};
    MONTHS.forEach(m => { map[m] = { earnings: 0, expenses: 0 }; });

    allPayments.forEach((p: any) => {
      const d = new Date(p.paid_at || p.created_at || p.date || "");
      if (isNaN(d.getTime())) return;
      const m = MONTHS[d.getMonth()];
      map[m].earnings += Number(p.amount) || 0;
    });
    allExpenses.forEach((e: any) => {
      const d = new Date(e.date || e.created_at || "");
      if (isNaN(d.getTime())) return;
      map[MONTHS[d.getMonth()]].expenses += Number(e.amount) || 0;
    });
    return MONTHS.map(month => ({
      month,
      earnings: map[month].earnings,
      expenses: map[month].expenses,
      net: map[month].earnings - map[month].expenses,
    })).filter(d => d.earnings > 0 || d.expenses > 0);
  }, [allPayments, allExpenses]);

  // ── Student fee summary ───────────────────────────────────────────────────
  const feeSummary = useMemo(() => {
    const totalFee       = allStudentFees.reduce((s, i) => s + Number(i.total_amount     || 0), 0);
    const totalPaid      = allStudentFees.reduce((s, i) => s + Number(i.paid_amount      || 0), 0);
    const totalRemaining = allStudentFees.reduce((s, i) => s + Number(i.remaining_amount || 0), 0);
    const paidCount      = allStudentFees.filter(i => i.status === "paid").length;
    const partialCount   = allStudentFees.filter(i => i.status === "partial").length;
    const unpaidCount    = allStudentFees.filter(i => i.status === "unpaid").length;
    const collectionPct  = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;
    return { totalFee, totalPaid, totalRemaining, paidCount, partialCount, unpaidCount, collectionPct };
  }, [allStudentFees]);

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

  // ── Derived ───────────────────────────────────────────────────────────────
  const presentTotal  = allAttendance.filter(a => ["present","late"].includes((a.status||"").toLowerCase())).length;
  const absentTotal   = allAttendance.length - presentTotal;
  const attendancePct = allAttendance.length > 0 ? Math.round((presentTotal / allAttendance.length) * 100) : 0;
  const totalEarnings = earningsChartData.reduce((s, d) => s + d.earnings, 0);
  const totalExpenses = earningsChartData.reduce((s, d) => s + d.expenses, 0);
  const netAmount     = totalEarnings - totalExpenses;
  const isNetPositive = netAmount >= 0;
  const totalPayCount = allPayments.length;
  const avgEnrollPct  = enrollmentByClass.length
    ? Math.round(enrollmentByClass.reduce((s, d) => s + d.pct, 0) / enrollmentByClass.length) : 0;

  // Best month for net
  const bestMonth = earningsChartData.length
    ? earningsChartData.reduce((best, d) => d.net > best.net ? d : best, earningsChartData[0])
    : null;

  const topStats = [
    { label: "Registered Students", value: counts.students,  icon: Users,       bg: "#10b981",    href: "/student" },
    { label: "Active Teachers",   value: counts.teachers,  icon: GraduationCap, bg: primaryColor, href: "/teacher" },
    { label: "Active Staffs",     value: counts.staff,     icon: UserCog,       bg: "#ec4899",    href: "/staff" },
    { label: "Total Parents",     value: counts.parents,   icon: UserCheck,     bg: "#f97316",    href: "/parent" },
  ];
  const secondaryStats = [
    { label: "Classes",       value: counts.classes,       icon: School,        bg: "#EFF6FF", ic: "#2563EB", href: "/classe" },
    { label: "Subjects",      value: counts.subjects,      icon: BookOpen,      bg: "#FFFBEB", ic: "#D97706", href: "/subject" },
    { label: "Sections",      value: counts.sections,      icon: Layers,        bg: "#FFF7ED", ic: "#EA580C", href: "/section" },
    { label: "Enrollments",   value: counts.enrollments,   icon: TrendingUp,    bg: primaryColor+"15", ic: primaryColor, href: "/enrollment" },
    { label: "Homeworks",     value: counts.homeworks,     icon: ClipboardList, bg: "#F0FDF4", ic: "#16A34A", href: "/homework" },
    { label: "Leaves",        value: counts.leaves,        icon: Calendar,      bg: "#FFF1F2", ic: "#E11D48", href: "/leave" },
    { label: "Notifications", value: counts.notifications, icon: Bell,          bg: "#EFF6FF", ic: "#2563EB", href: "/notification" },
    {
      label: "Total People",
      value: counts.students + counts.staffTeachers + counts.parents,
      icon: Users, bg: "#F0FDFA", ic: "#0D9488", href: "#",
    },
  ];


  const getGreeting = () => {
  const now = new Date();
  
  // Nepal Time (UTC +5:45)
  const nepalTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })
  );
  
  const hour = nepalTime.getHours();

  if (hour >= 5 && hour < 12) return "Good Morning ";
  if (hour >= 12 && hour < 17) return "Good Afternoon ";
  if (hour >= 17 && hour < 21) return "Good Evening ";
  return "Good Night ";
};

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-2xl mx-auto space-y-5">

 {/* ── Welcome Header Section ── */}
<div className="flex items-center justify-between gap-4">
  {/* Left Side: Greeting */}
  <div className="flex items-center gap-4">
    <div>
      <h1 className="text-2xl font-black text-slate-700 tracking-tight">
        {getGreeting()},{" "}
        <span style={{ color: primaryColor }}>
          {user?.full_name?.split(" ")[0] || "User"}
        </span>
      </h1>

      <div className="flex items-center gap-3 mt-1">
        {/* <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
          {user?.role || "Staff"}
        </span> */}

        <p className="text-[13px] text-slate-700 font-medium flex items-center gap-1">
  <Clock size={14} className="text-slate-500" />
  {/* यहाँ lastSync को सट्टा currentTime प्रयोग गर्नुहोस् */}
  {`Time: ${currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit", // सेकेन्ड पनि देखाउन चाहनुहुन्छ भने
  })}`}
</p>
      </div>
    </div>
  </div>

  {/* Right Side: Admission Button */}
  <Link href="/student-admissions">
    <button
      style={{ backgroundColor: primaryColor }}
      className="flex items-center gap-2 px-4 cursor-pointer py-2 text-white text-sm font-semibold rounded-md shadow-sm hover:opacity-90 transition-opacity"
    >
      <span>Admission</span>
    </button>
  </Link>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 ">
          {topStats.map(s => <TopStatCard key={s.label} {...s} loading={loading} />)}
        </div> 

        {/* ── Secondary 8 cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {secondaryStats.map(s => <MiniStatCard key={s.label} {...s} loading={loading} />)}
        </div>

        {/* ── Main 3-col grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Left 2/3 */}
          <div className="xl:col-span-2 space-y-4">

            {/* Row 1: Enrollment + Earnings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Enrollment by Class ── */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Enrollment by Class</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Active enrollment % per class</p>
                  </div>
                  {!loading && (
                    <span
                      className="text-[11px] font-extrabold px-2.5 py-1 rounded"
                      style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                    >
                      Avg {avgEnrollPct}%
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Sk key={i} h={14} />)}</div>
                ) : enrollmentByClass.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-[11px] text-gray-400">No enrollment data</div>
                ) : (
                  <div className="space-y-3">
                    {enrollmentByClass.map(({ name, enrolled, active, pct }) => {
                      const bc = pct >= 80 ? "#10b981" : pct >= 60 ? primaryColor : "#f59e0b";
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[120px]">{name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{active}/{enrolled}</span>
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
                {!loading && enrollmentByClass.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                    {[
                      { label: "Classes",  value: enrollmentByClass.length },
                      { label: "Enrolled", value: enrollmentByClass.reduce((s, d) => s + d.enrolled, 0) },
                      { label: "Active",   value: enrollmentByClass.reduce((s, d) => s + d.active, 0) },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center bg-gray-50 rounded py-2">
                        <p className="text-[14px] font-extrabold text-gray-800 tabular-nums">{value}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── ENHANCED Earnings Card ── */}
              <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                {/* Card header with gradient accent */}
                <div className="px-3 pt-3 pb-2" style={{ background: `linear-gradient(135deg, ${primaryColor}08 0%, #fff 60%)` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: primaryColor + "20" }}>
                          <BarChart2 size={11} style={{ color: primaryColor }} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 tracking-tight">Earnings Analytics</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium ml-7">Total income vs expenses · monthly</p>
                    </div>
                    {!loading && totalPayCount > 0 && (
                      <div
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border"
                        style={{ backgroundColor: primaryColor + "10", borderColor: primaryColor + "30", color: primaryColor }}
                      >
                        <Hash size={9} /> {totalPayCount}
                      </div>
                    )}
                  </div>

                  {/* KPI row — 3 big numbers */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {/* Total Income */}
                    <div className="rounded px-3 py-2.5" style={{ backgroundColor: primaryColor + "10", border: `1px solid ${primaryColor}20` }}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: primaryColor }}>Income</p>
                      {loading
                        ? <Sk w="80%" h={16} />
                        : <p className="text-[15px] font-black tabular-nums leading-none" style={{ color: primaryColor }}>
                            Rs.{formatRs( feeSummary.totalPaid.toLocaleString())}
                          </p>
                      }
                    </div>
                    {/* Total Expenses */}
                    <div className="rounded px-3 py-2.5 bg-rose-50 border border-rose-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1">Expenses</p>
                      {loading
                        ? <Sk w="80%" h={16} />
                        : <p className="text-[15px] font-black tabular-nums leading-none text-rose-600">
                            Rs.{totalExpenses.toLocaleString('en-IN')}
                          </p>
                      }
                    </div>
                   
                  </div>
                </div>

                {/* Chart area */}
                <div className="px-3 pb-2 flex-1">
                  {loading ? (
                    <div className="h-[148px] flex items-center justify-center">
                      <Sk w="85%" h={90} r={10} />
                    </div>
                  ) : earningsChartData.length === 0 ? (
                    <div className="h-[148px] flex flex-col items-center justify-center text-gray-300">
                      <Wallet size={30} className="mb-2" />
                      <p className="text-[11px] font-bold text-gray-400">No payment data yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={148}>
                      <AreaChart
                        data={earningsChartData}
                        margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
                      >
                        <defs>
                          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={primaryColor} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#f43f5e" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={v => formatRs(v)}
                        />
                        <Tooltip content={<EarningsTooltip />} />

                        {/* Income area — bold, primary color */}
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          name="Income"
                          stroke={primaryColor}
                          strokeWidth={2.5}
                          fill="url(#incomeGrad)"
                          dot={false}
                          activeDot={{ r: 5, fill: primaryColor, stroke: "#fff", strokeWidth: 2.5 }}
                        />

                        {/* Expenses area — rose/red */}
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          name="Expenses"
                          stroke="#f43f5e"
                          strokeWidth={2.5}
                          fill="url(#expenseGrad)"
                          dot={false}
                          activeDot={{ r: 5, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2.5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Legend + best month footer */}
                <div className="px-5 pb-4 pt-1 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    {/* Income legend */}
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                      <span className="w-5 h-[2.5px] rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                      Income
                    </span>
                    {/* Expenses legend */}
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                      <span className="w-5 h-[2.5px] rounded-full inline-block bg-rose-400" />
                      Expenses
                    </span>
                  </div>

                  {/* Best month callout */}
                  {!loading && bestMonth && bestMonth.net > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                      <ArrowUpRight size={10} className="text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700">
                        Peak: {bestMonth.month} · Rs.{formatRs(bestMonth.net)}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Student Fee Summary ── */}
                <div className="mx-1  mb-5  overflow-hidden" >
                  {/* Fee header */}
                  <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 bg-white">
                    <span className="text-[11px] font-black text-gray-700 flex items-center gap-1.5">
                      <CircleDollarSign size={12} style={{ color: primaryColor }} />
                      Student Fee Collection
                    </span>
                    {!loading && feeSummary.totalFee > 0 && (
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                      >
                        {feeSummary.collectionPct}% collected
                      </span>
                    )}
                  </div>

                  <div className="p-2 space-y-3">
                    {/* Progress bar */}
                    {!loading && feeSummary.totalFee > 0 && (
                      <div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          {/* Paid portion */}
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${feeSummary.collectionPct}%`, backgroundColor: primaryColor }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[9px] text-gray-500 font-semibold">
                            Rs. {feeSummary.totalPaid.toLocaleString()} paid
                          </span>
                          <span className="text-[9px] text-gray-400">
                            of Rs. {feeSummary.totalFee.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    {loading && (
                      <div>
                        <Sk h={10} r={5} />
                        <div className="flex justify-between mt-1.5">
                          <Sk w="38%" h={9} />
                          <Sk w="30%" h={9} />
                        </div>
                      </div>
                    )}

                    {/* Donut row — 2 items only: Paid & Remaining */}
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
                          {
                            label:  "Paid",
                            value:  feeSummary.totalPaid.toLocaleString(),
                            pct:    feeSummary.collectionPct,
                            color:  primaryColor,
                            track:  primaryColor + "22",
                            bg:     primaryColor + "0d",
                          },
                          {
                            label:  "Remaining",
                            value:  feeSummary.totalRemaining.toLocaleString(),
                            pct:    100 - feeSummary.collectionPct,
                            color:  "#f43f5e",
                            track:  "#fee2e2",
                            bg:     "#fff1f2",
                          },
                        ].map(({ label, value, pct, color, track, bg }) => {
                          const safe = Math.max(0, Math.min(100, pct));
                          return (
                            <div key={label} className="flex flex-col items-center rounded py-3 px-2" style={{ backgroundColor: bg }}>
                              <div className="relative" style={{ width: 62, height: 62 }}>
                                <ResponsiveContainer width={62} height={62}>
                                  <RechartsPie>
                                    <Pie
                                      data={[{ v: safe }, { v: 100 - safe }]}
                                      cx="50%" cy="50%"
                                      innerRadius={20} outerRadius={28}
                                      startAngle={90} endAngle={-270}
                                      dataKey="v"
                                      stroke="none"
                                      paddingAngle={safe > 0 && safe < 100 ? 2 : 0}
                                    >
                                      <Cell fill={color} />
                                      <Cell fill={track} />
                                    </Pie>
                                  </RechartsPie>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[11px] font-black tabular-nums" style={{ color }}>{safe}%</span>
                                </div>
                              </div>
                              <p className="text-[12px] font-black tabular-nums mt-1.5 leading-tight text-center" style={{ color }}>
                                Rs.{formatRs(value)}
                              </p>
                              <p className="text-[8px] font-black uppercase tracking-wider mt-0.5" style={{ color }}>{label}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Status pills */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "Paid",    value: feeSummary.paidCount,    color: primaryColor, bg: primaryColor + "10", icon: CheckCircle2 },
                        { label: "Partial", value: feeSummary.partialCount, color: "#d97706",    bg: "#fffbeb",            icon: Clock3 },
                        { label: "Unpaid",  value: feeSummary.unpaidCount,  color: "#dc2626",    bg: "#fff1f2",            icon: AlertCircle },
                      ].map(({ label, value, color, bg, icon: Icon }) => (
                        <div
                          key={label}
                          className="rounded px-2.5 py-2 flex items-center gap-1.5"
                          style={{ backgroundColor: bg }}
                        >
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
              {/* end Earnings Card */}

            </div>

            {/* Row 2: Gender + Attendance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Gender ── */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800">Students by Gender</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                    {counts.students} total
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="w-[160px] h-[160px] flex items-center justify-center">
                      <Sk w={160} h={160} r={80} />
                    </div>
                  ) : (
                    <div className="relative">
                      <ResponsiveContainer width={180} height={180}>
                        <RechartsPie>
                          <Pie
                            data={genderData}
                            cx="50%" cy="50%"
                            innerRadius={52} outerRadius={75}
                            paddingAngle={3} dataKey="value"
                            startAngle={90} endAngle={-270}
                          >
                            {genderData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                          </Pie>
                          <Tooltip
                            formatter={(value: any, name: any) => {
                              return [value.toLocaleString(), name] as [any, any];
                            }}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-2xl font-extrabold text-gray-800 tabular-nums leading-none">{counts.students.toLocaleString()}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Students</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-5 mt-3 flex-wrap justify-center">
                    {genderData.map(({ name, value, color }) => (
                      <div key={name} className="text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                          <span className="text-[11px] font-bold text-gray-700">{name}</span>
                        </div>
                        <p className="text-base font-extrabold text-gray-800 mt-0.5 tabular-nums">{value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Attendance ── */}
              <div className="bg-white rounded shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Student Attendance</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Weekly attendance breakdown</p>
                  </div>
                  {!loading && allAttendance.length > 0 && (
                    <span
                      className="text-[11px] font-extrabold px-2.5 py-1 rounded"
                      style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                    >
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
                    <BarChart
                      data={attendanceChartData}
                      margin={{ top: 0, right: 0, bottom: 0, left: -30 }}
                      barSize={18}
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
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

            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-3">

            {/* School Summary */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
              <h3 className="text-sm font-bold text-gray-800 mb-3">School Summary</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Classes",  value: counts.classes,     color: "#2563EB", icon: School },
                  { label: "Sections", value: counts.sections,    color: primaryColor, icon: Layers },
                  { label: "Subjects", value: counts.subjects,    color: "#D97706", icon: BookOpen },
                  { label: "Enrolled", value: counts.enrollments, color: "#16A34A", icon: UserCheck },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded p-3 flex items-center gap-2"
                    style={{ backgroundColor: color + "10" }}
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ backgroundColor: color + "20" }}
                    >
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
                <a
                  href="/leaves"
                  className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5"
                >
                  View all <ChevronRight size={12} />
                </a>
              </div>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-2.5 animate-pulse">
                      <Sk w={30} h={30} r={99} />
                      <div className="flex-1">
                        <Sk w="65%" h={12} />
                        <div className="mt-1"><Sk w="40%" h={10} /></div>
                      </div>
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
                  <h3 className="text-sm font-bold text-gray-800">Recent Students</h3>
                  {counts.students > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                    >
                      {counts.students}
                    </span>
                  )}
                </div>
                <a
                  href="/students"
                  className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5"
                >
                  View all <ChevronRight size={12} />
                </a>
              </div>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-2.5 animate-pulse">
                      <Sk w={30} h={30} r={99} />
                      <div className="flex-1">
                        <Sk w="65%" h={12} />
                        <div className="mt-1"><Sk w="40%" h={10} /></div>
                      </div>
                    </div>
                  ))
                ) : students.length === 0 ? (
                  <p className="text-center text-[11px] text-gray-400 py-4">No students found</p>
                ) : (
                  students.map((s, i) => {
                    const name  = getName(s);
                    const email = s.user_email || s.email || `ID: ${s.student_id || s.id}`;
                    return (
                      <div key={s.id ?? i} className="flex gap-2.5 items-center">
                        <Ava name={name} color={primaryColor} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 uppercase truncate leading-tight">{name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{email}</p>
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

            {/* Calendar Section */}
            <CalendarGrid 
              selectedMonthIndex={selectedMonthIndex} 
              setSelectedMonthIndex={setSelectedMonthIndex} 
              className="bg-white rounded shadow-sm border border-gray-100 p-2 !h-full"
            />

          </div>
        </div>

        {/* Footer */}
        <p className="text-center border-t mt-5  text-[11px] text-gray-600 p-4">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
}