"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import useAuth from "@/lib/hooks/useAuth";
import { FeeServices }          from "@/services/feeServices";
import { StudentServices }      from "@/services/studentServices";
import { NotificationServices } from "@/services/notificationServices";
import {
  Bell, Clock, AlertCircle, RefreshCw, Mail, TrendingUp,
  TrendingDown, Wallet, Receipt, IndianRupee, CreditCard,
  Tag, Layers, CalendarDays, CheckCircle2, XCircle,
  AlertTriangle, BarChart2, PieChart, Users, Fingerprint,
  ArrowUpRight, ArrowDownRight, School, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart as RePieChart,
  Pie, Cell, Legend,
} from "recharts";
import DashboardCalendar from "@/components/ui/dashboardCalendar";
import { StaffServices } from "@/services/staffServices";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentFee {
  id: string | number;
  student_name: string;
  student_id: string;
  fee_type_name: string;
  class_name: string;
  section_name: string;
  remaining_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  due_date: string;
  status: "unpaid" | "partial" | "paid";
  enrollment: number;
  fee_type: number;
}

interface Payment {
  id: string | number;
  student_name: string;
  fee_type_name: string;
  amount: string | number;
  payment_method: string;
  paid_at: string;
  received_by_name?: string;
}

interface FeeStructure {
  id: string | number;
  fee_type_name: string;
  fee_type_code: string;
  class_name: string;
  session_name: string;
  amount: number | string;
  is_recurring: boolean;
}

interface Expense {
  id: string | number;
  title: string;
  expense_type: string;
  amount: number | string;
  date: string;
  session_name?: string;
}

interface FeeType {
  id: string | number;
  name: string;
  code: string;
}

interface Notification {
  title?: string;
  message?: string;
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

function toNum(v: any): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function fmtRs(v: number): string {
  if (v >= 1_000_000) return `Rs. ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `Rs. ${(v / 1_000).toFixed(1)}K`;
  return `Rs. ${v.toLocaleString()}`;
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

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string; icon: any }> = {
    paid:    { bg: "#f0fdf4", color: "#16a34a", label: "Paid",    icon: CheckCircle2 },
    partial: { bg: "#fffbeb", color: "#d97706", label: "Partial", icon: AlertTriangle },
    unpaid:  { bg: "#fff1f2", color: "#dc2626", label: "Unpaid",  icon: XCircle },
  };
  const s = map[status] ?? map.unpaid;
  const Icon = s.icon;
  return (
    <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0"
      style={{ backgroundColor: s.bg, color: s.color }}>
      <Icon size={9} />{s.label}
    </span>
  );
}

// ─── Payment Method Badge ─────────────────────────────────────────────────────
const METHOD_COLORS: Record<string, string> = {
  cash:   "#10b981",
  online: "#6366f1",
  cheque: "#f59e0b",
  bank:   "#0ea5e9",
  card:   "#8b5cf6",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StaffAccountingDashboard() {
  const { primaryColor } = useTheme();
  const { user }         = useAuth();

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync,   setLastSync]   = useState<Date | null>(null);

  // ── Data states ─────────────────────────────────────────────────────────────
  const [studentFees,    setStudentFees]    = useState<StudentFee[]>([]);
  const [payments,       setPayments]       = useState<Payment[]>([]);
  const [feeStructures,  setFeeStructures]  = useState<FeeStructure[]>([]);
  const [expenses,       setExpenses]       = useState<Expense[]>([]);
  const [feeTypes,       setFeeTypes]       = useState<FeeType[]>([]);
  const [totalStudents,  setTotalStudents]  = useState(0);
  const [notifications,  setNotifications]  = useState<Notification[]>([]);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [feeR, payR, strR, expR, ftR, stuR, ntR] = await Promise.allSettled([
        //  StaffServices.getStaffDashboard(),
        FeeServices.getAllStudentFees(),
        FeeServices.getAllPayments(),
        FeeServices.getAllFeeStructures(),
        FeeServices.getAllExpenses(),
        FeeServices.getAllFeeTypes(),
        StudentServices.getAllStudents(),
        NotificationServices.getAllNotifications(),
      ]);

      const v = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? r.value : null;

      setStudentFees(getItems(v(feeR)));
      setPayments(getItems(v(payR)));
      setFeeStructures(getItems(v(strR)));
      setExpenses(getItems(v(expR)));
      setFeeTypes(getItems(v(ftR)));
      setTotalStudents(getItems(v(stuR)).length);
      setNotifications(getItems(v(ntR)).slice(0, 3));
      setLastSync(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Finance Stats ─────────────────────────────────────────────────────────────
  const feeStats = useMemo(() => {
    const totalBilled  = studentFees.reduce((s, f) => s + toNum(f.total_amount), 0);
    const totalPaid    = studentFees.reduce((s, f) => s + toNum(f.paid_amount), 0);
    const totalDue     = studentFees.reduce((s, f) => s + toNum(f.remaining_amount), 0);
    const paid         = studentFees.filter(f => f.status === "paid").length;
    const partial      = studentFees.filter(f => f.status === "partial").length;
    const unpaid       = studentFees.filter(f => f.status === "unpaid").length;
    const collectionPct = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    return { totalBilled, totalPaid, totalDue, paid, partial, unpaid, collectionPct, total: studentFees.length };
  }, [studentFees]);

  const paymentStats = useMemo(() => {
    const total  = payments.reduce((s, p) => s + toNum(p.amount), 0);
    const byMethod: Record<string, number> = {};
    payments.forEach(p => {
      const m = (p.payment_method || "other").toLowerCase();
      byMethod[m] = (byMethod[m] || 0) + toNum(p.amount);
    });
    return { total, byMethod, count: payments.length };
  }, [payments]);

  const expenseStats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + toNum(e.amount), 0);
    const byType: Record<string, number> = {};
    expenses.forEach(e => {
      const t = e.expense_type || "Other";
      byType[t] = (byType[t] || 0) + toNum(e.amount);
    });
    return { total, byType, count: expenses.length };
  }, [expenses]);

  const netBalance = paymentStats.total - expenseStats.total;

  // ── Monthly revenue chart data ────────────────────────────────────────────────
   const revenueChartData = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<string, { collected: number; expense: number; billed: number }> = {};
    MONTHS.forEach(m => { map[m] = { collected: 0, expense: 0, billed: 0 }; });
 
    payments.forEach(p => {
      const d = new Date(p.paid_at || "");
      if (isNaN(d.getTime())) return;
      map[MONTHS[d.getMonth()]].collected += toNum(p.amount);
    });
    expenses.forEach(e => {
      const d = new Date(e.date || "");
      if (isNaN(d.getTime())) return;
      map[MONTHS[d.getMonth()]].expense += toNum(e.amount);
    });
    studentFees.forEach(f => {
      const d = new Date(f.due_date || "");
      if (isNaN(d.getTime())) return;
      map[MONTHS[d.getMonth()]].billed += toNum(f.total_amount);
    });
 
    return MONTHS.map(month => ({ month, ...map[month] })).filter(d => d.collected > 0 || d.expense > 0 || d.billed > 0);
  }, [payments, expenses, studentFees]);
  

  // ── Fee status pie data ────────────────────────────────────────────────────────
  const feeStatusPie = useMemo(() => [
    { name: "Paid",    value: feeStats.paid,    color: "#10b981" },
    { name: "Partial", value: feeStats.partial, color: "#f59e0b" },
    { name: "Unpaid",  value: feeStats.unpaid,  color: "#ef4444" },
  ].filter(d => d.value > 0), [feeStats]);

  // ── Expense breakdown pie ─────────────────────────────────────────────────────
  const expensePie = useMemo(() => {
    const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];
    return Object.entries(expenseStats.byType).map(([name, value], i) => ({
      name, value, color: COLORS[i % COLORS.length],
    }));
  }, [expenseStats]);

  // ── Recent overdue fees ────────────────────────────────────────────────────────
  const overdueFees = useMemo(() =>
    studentFees.filter(f => f.status === "unpaid" || f.status === "partial")
      .slice(0, 5),
  [studentFees]);

  // ── Recent payments ────────────────────────────────────────────────────────────
  const recentPayments = useMemo(() =>
    [...payments].sort((a, b) =>
      new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
    ).slice(0, 3),
  [payments]);

  const collColor = feeStats.collectionPct >= 80 ? "#10b981" : feeStats.collectionPct >= 60 ? "#f59e0b" : "#ef4444";

  const greeting = (): string => {
    const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })).getHours();
    if (h >= 5  && h < 12) return "Good Morning ☀️";
    if (h >= 12 && h < 17) return "Good Afternoon 🌤";
    if (h >= 17 && h < 21) return "Good Evening 🌆";
    return "Good Night 🌙";
  };

  const staffName  = user?.name || user?.username || "Staff";
  const staffEmail = user?.email || "—";
  const staffRole  = user?.role  || "Accountant";

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
              <h1 className="text-white text-[22px] font-black tracking-tight leading-tight truncate">{staffName}</h1>
              <p className="text-white/55 text-[11px] flex items-center gap-1.5 mt-0.5">
                <Mail size={10} className="shrink-0" />{staffEmail}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 backdrop-blur-sm">
                  {staffRole}
                </span>
                {user?.school && (
                  <span className="bg-white/15 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/15">
                    <School size={9} />
                    {typeof user.school === "object" ? user.school?.name : user.school}
                  </span>
                )}
                {lastSync && (
                  <span className="text-white/45 text-[10px] flex items-center gap-1.5">
                    <Clock size={9} />Synced {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>

            {!loading && (
              <div className="shrink-0 bg-white/15 backdrop-blur-sm border border-white/25 rounded px-5 py-3 text-center shadow-inner min-w-[140px]">
                <p className="text-white/55 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Total Billed</p>
                <p className="text-xl font-black tabular-nums leading-none text-white">
                  {fmtRs(feeStats.totalBilled)}
                </p>
                <p className="text-white/50 text-[9px] font-bold mt-1 flex items-center justify-center gap-1">
                  <IndianRupee size={9} className="text-white/60" />{feeStats.total} fee records
                </p>
              </div>
            )}

            <button
              onClick={() => fetchAll(true)}
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
            <button onClick={() => fetchAll()} className="text-[11px] font-bold text-rose-500 underline">Retry</button>
          </div>
        )}

        {/* ══ TOP STAT CARDS ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {([
            {
              icon: IndianRupee, label: "Total Billed",    value: fmtRs(feeStats.totalBilled),
              color: primaryColor,  bg: primaryColor + "14", trend: null,
            },
            {
              icon: Wallet,       label: "Total Collected", value: fmtRs(paymentStats.total),
              color: "#10b981",   bg: "#d1fae5",
              trend: { pct: feeStats.collectionPct, up: true },
            },
            {
              icon: TrendingDown, label: "Total Expenses",  value: fmtRs(expenseStats.total),
              color: "#ef4444",   bg: "#fff1f2", trend: null,
            },
           
          ] as const).map(({ icon: Icon, label, value, color, bg, trend }) => (
            <div key={label}
              className="bg-white rounded border border-slate-100 p-2 flex items-center gap-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 shadow-sm relative overflow-hidden"
            >
              <div className="w-11 h-11 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                {loading ? (
                  <><Sk w={72} h={20} /><div className="mt-1.5"><Sk w={68} h={9} /></div></>
                ) : (
                  <>
                    <p className="text-[18px] font-black text-slate-800 tabular-nums leading-none">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{label}</p>
                    {trend && (
                      <p className="text-[9px] font-black mt-0.5 flex items-center gap-0.5" style={{ color }}>
                        <ArrowUpRight size={9} />{trend.pct}% collected
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="absolute -right-5 -bottom-5 w-20 h-20 rounded-full opacity-[0.07]" style={{ backgroundColor: color }} />
            </div>
          ))}
        </div>

        {/* ══ SECONDARY STAT CARDS ═════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {([
            { icon: CreditCard, label: "Payments Received", value: paymentStats.count,     color: "#10b981", bg: "#f0fdf4" },
            { icon: Receipt,    label: "Fee Structures",    value: feeStructures.length,   color: "#f59e0b", bg: "#fffbeb" },
            { icon: Tag,        label: "Fee Types",         value: feeTypes.length,        color: "#8b5cf6", bg: "#ede9fe" },
          ] as const).map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label}
              className="bg-white rounded border border-slate-100 p-4 flex items-center gap-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 shadow-sm relative overflow-hidden"
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

          {/* ── LEFT 2 cols ──────────────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-3">

            {/* ── Fee Collection Ring + Status Breakdown ── */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Fee Collection Overview</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Total billed vs collected vs outstanding</p>
                </div>
                <BarChart2 size={17} style={{ color: primaryColor }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Collection Ring */}
                <div className="flex flex-col items-center gap-4">
                  {loading ? <Sk w={110} h={110} r={55} /> : (
                    <RingProgress pct={feeStats.collectionPct} size={110} stroke={12} color={collColor}>
                      <span className="text-[22px] font-black tabular-nums leading-none" style={{ color: collColor }}>{feeStats.collectionPct}%</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] mt-0.5 text-slate-400">Collected</span>
                    </RingProgress>
                  )}
                  <div className="w-full grid grid-cols-3 gap-2">
                    {([
                      { label: "Billed",    value: fmtRs(feeStats.totalBilled), color: "#64748b", bg: "#f8fafc" },
                      { label: "Collected", value: fmtRs(feeStats.totalPaid),   color: "#10b981", bg: "#f0fdf4" },
                      { label: "Due",       value: fmtRs(feeStats.totalDue),    color: "#f43f5e", bg: "#fff1f2" },
                    ] as const).map(({ label, value, color, bg }) => (
                      <div key={label} className="text-center rounded py-2.5" style={{ backgroundColor: bg }}>
                        {loading ? <Sk w="70%" h={12} /> : (
                          <p className="text-[11px] font-black leading-none" style={{ color }}>{value}</p>
                        )}
                        <p className="text-[9px] font-black uppercase tracking-wider mt-1 text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fee Status Bars */}
                <div className="flex flex-col justify-center gap-3">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">By Status</p>
                  {([
                    { label: "Paid",    value: feeStats.paid,    color: "#10b981", total: feeStats.total },
                    { label: "Partial", value: feeStats.partial, color: "#f59e0b", total: feeStats.total },
                    { label: "Unpaid",  value: feeStats.unpaid,  color: "#ef4444", total: feeStats.total },
                  ] as const).map(({ label, value, color, total }) => {
                    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
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
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                 
                </div>
              </div>
            </div>

            {/* ── Revenue vs Expense Area Chart ── */}
           <div className="bg-white rounded shadow-sm border border-slate-100 p-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Monthly Revenue vs Expense</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Collections and outflows by month</p>
                </div>
               
              </div>
              {loading ? (
                <div className="h-[220px] flex items-center justify-center"><Sk w="92%" h={175} r={12} /></div>
              ) : revenueChartData.length === 0 ? (
                <div className="h-[220px] flex flex-col items-center justify-center text-slate-300">
                  <BarChart2 size={40} className="mb-3" />
                  <p className="text-sm font-bold text-slate-400">No transaction data yet</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <span className="w-8 h-[3px] rounded-full inline-block bg-slate-400" />Billed
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <span className="w-8 h-[3px] rounded-full inline-block" style={{ backgroundColor: primaryColor }} />Collected
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <span className="w-8 h-[3px] rounded-full inline-block bg-rose-400" />Expense
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="bilG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#94a3b8" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="colG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={primaryColor} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#f87171" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="billed"    name="Billed"    stroke="#94a3b8"    strokeWidth={2}   fill="url(#bilG)"  dot={false} strokeDasharray="5 3" activeDot={{ r: 4, fill: "#94a3b8",   stroke: "#fff", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="collected" name="Collected" stroke={primaryColor} strokeWidth={2.5} fill="url(#colG)" dot={false} activeDot={{ r: 5, fill: primaryColor, stroke: "#fff", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="expense"   name="Expense"   stroke="#f87171"    strokeWidth={2}   fill="url(#expG)"  dot={false} activeDot={{ r: 4, fill: "#f87171",   stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
 

            {/* ── Payment Method Bar Chart ── */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Payment by Method</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Collections broken down by payment method</p>
                </div>
                <CreditCard size={16} style={{ color: primaryColor }} />
              </div>
              {loading ? (
                <div className="h-[160px] flex items-center justify-center"><Sk w="92%" h={120} r={12} /></div>
              ) : Object.keys(paymentStats.byMethod).length === 0 ? (
                <div className="h-[160px] flex flex-col items-center justify-center text-slate-300">
                  <CreditCard size={36} className="mb-3" />
                  <p className="text-sm font-bold text-slate-400">No payment data yet</p>
                </div>
              ) : (
                <>
                  {/* Method progress bars */}
                  <div className="space-y-2 mb-4">
                    {Object.entries(paymentStats.byMethod).map(([method, amount]) => {
                      const pct = paymentStats.total > 0 ? Math.round((amount / paymentStats.total) * 100) : 0;
                      const color = METHOD_COLORS[method] || "#6366f1";
                      return (
                        <div key={method}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-600 capitalize flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />{method}
                            </span>
                            <span className="text-[11px] font-black tabular-nums" style={{ color }}>
                              {fmtRs(amount)} <span className="text-slate-400 font-medium text-[10px]">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={Object.entries(paymentStats.byMethod).map(([method, amount]) => ({ method, amount }))}
                      margin={{ top: 0, right: 5, bottom: 0, left: -10 }} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="method" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                      <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="amount" name="Amount" radius={[4,4,0,0]}>
                        {Object.keys(paymentStats.byMethod).map((method, i) => (
                          <Cell key={i} fill={METHOD_COLORS[method] || primaryColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* ── Pending / Overdue Fees ── */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Pending & Overdue Fees</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Students with outstanding balances</p>
                </div>
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="flex gap-3">
                      <Sk w={36} h={36} r={8} />
                      <div className="flex-1 space-y-2"><Sk w="55%" h={12} /><Sk w="35%" h={9} /></div>
                      <Sk w={70} h={22} r={99} />
                    </div>
                  ))}
                </div>
              ) : overdueFees.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <CheckCircle2 size={36} style={{ color: primaryColor }} />
                  <p className="text-sm font-bold text-slate-400">All fees are cleared!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overdueFees.map((fee, i) => (
                    <div key={fee.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: fee.status === "unpaid" ? "#fff1f2" : "#fffbeb" }}>
                        <IndianRupee size={14} style={{ color: fee.status === "unpaid" ? "#ef4444" : "#f59e0b" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-slate-700 truncate">{fee.student_name}</p>
                        <p className="text-[10px] text-slate-400">{fee.fee_type_name} · Due: {fee.due_date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-black text-rose-600">Rs. {toNum(fee.remaining_amount).toLocaleString()}</p>
                        <StatusBadge status={fee.status} />
                      </div>
                    </div>
                  ))}
                  {studentFees.filter(f => f.status !== "paid").length > 3 && (
                    <p className="text-center text-[10px] font-bold text-slate-400 pt-2">
                      +{studentFees.filter(f => f.status !== "paid").length - 3} more outstanding
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Recent Payments ── */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight">Recent Payments</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Latest fee collections received</p>
                </div>
                <Wallet size={16} style={{ color: primaryColor }} />
              </div>
              {loading ? (
                <div className="space-y-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="flex gap-3">
                      <Sk w={36} h={36} r={8} />
                      <div className="flex-1 space-y-2"><Sk w="55%" h={12} /><Sk w="35%" h={9} /></div>
                      <Sk w={70} h={18} r={4} />
                    </div>
                  ))}
                </div>
              ) : recentPayments.length === 0 ? (
                <p className="text-center text-[11px] text-slate-400 py-3">No payments recorded yet</p>
              ) : (
                <div className="space-y-1">
                  {recentPayments.map((pay, i) => {
                    const method  = (pay.payment_method || "other").toLowerCase();
                    const mColor  = METHOD_COLORS[method] || "#6366f1";
                    const payDate = pay.paid_at ? new Date(pay.paid_at) : null;
                    return (
                      <div key={pay.id} className="flex items-center gap-2 p-1 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: mColor + "15" }}>
                          <CreditCard size={14} style={{ color: primaryColor }}  />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-slate-700 truncate">{pay.student_name}</p>
                          <p className="text-[10px] text-slate-400">{pay.fee_type_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-black text-emerald-600">Rs. {toNum(pay.amount).toLocaleString()}</p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                              style={{ backgroundColor: mColor + "15", color: mColor }}>{method}</span>
                            {payDate && (
                              <span className="text-[9px] text-slate-400">{payDate.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT SIDEBAR ════════════════════════════════════════════════ */}
          <div className="space-y-3">

            {/* Staff Profile Card */}
            <div className="rounded overflow-hidden shadow-md border border-slate-100">
              <div
                className="relative p-3 flex items-center gap-3 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}a0)` }}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">Staff Profile</p>
                  <p className="text-[13px] font-black text-white truncate leading-tight">{staffName}</p>
                  <p className="text-[10px] text-white/55 mt-0.5 flex items-center gap-1 truncate">
                    <Mail size={9} />{staffEmail}
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
                    {[
                      { label: "Role",       value: staffRole,                                         icon: Fingerprint },
                      { label: "Fee Types",  value: `${feeTypes.length} Types`,                       icon: Tag },
                      { label: "Fee Structures", value: `${feeStructures.length} Configured`,             icon: Layers },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Icon size={10} className="text-slate-300" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</span>
                        </div>
                        <span className="text-[11px] font-black text-right truncate max-w-[130px] text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Finance Summary */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-3">
              <h3 className="text-[13px] font-black text-slate-800 mb-3 flex items-center gap-2">
                <IndianRupee size={13} style={{ color: primaryColor }} /> Finance Summary
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: "Collected", value: fmtRs(paymentStats.total), color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Expenses",  value: fmtRs(expenseStats.total), color: "#dc2626", bg: "#fff1f2" },
                  { label: "Billed",    value: fmtRs(feeStats.totalBilled), color: "#0ea5e9", bg: "#f0f9ff" },
                  { label: "Due",       value: fmtRs(feeStats.totalDue),   color: "#d97706", bg: "#fffbeb" },
                ] as const).map(({ label, value, color, bg }) => (
                  <div key={label} className="flex flex-col items-center rounded py-3" style={{ backgroundColor: bg }}>
                    {loading ? <Sk w={60} h={16} /> : <p className="text-[12px] font-black tabular-nums" style={{ color }}>{value}</p>}
                    <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color }}>{label}</p>
                  </div>
                ))}
              </div>

             
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-3">
              <h3 className="text-[13px] font-black text-slate-800 mb-3 flex items-center gap-2">
                <Receipt size={13} className="text-rose-500" /> Expense Breakdown
              </h3>
              {loading ? (
                <div className="space-y-2">
                  {[0,1,2].map(i => <div key={i} className="flex justify-between"><Sk w="45%" h={10} /><Sk w="30%" h={10} /></div>)}
                </div>
              ) : expensePie.length === 0 ? (
                <p className="text-center text-[11px] text-slate-400 py-4">No expense data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={130}>
                    <RePieChart>
                      <Pie data={expensePie} cx="50%" cy="50%" innerRadius={30} outerRadius={50}
                        paddingAngle={3} dataKey="value">
                        {expensePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {expensePie.map(({ name, value, color }) => {
                      const pct = expenseStats.total > 0 ? Math.round((value / expenseStats.total) * 100) : 0;
                      return (
                        <div key={name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-bold text-slate-600 truncate">{name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-black" style={{ color }}>{fmtRs(value)}</span>
                            <span className="text-[9px] text-slate-400">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Recent Expenses */}
            <div className="bg-white rounded shadow-sm border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-black text-slate-800">Recent Expenses</h3>
                <span className="text-[10px] font-bold text-slate-400">{expenses.length} total</span>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex gap-2.5">
                      <Sk w={28} h={28} r={8} />
                      <div className="flex-1 space-y-1.5"><Sk w="70%" h={11} /><Sk w="45%" h={9} /></div>
                    </div>
                  ))}
                </div>
              ) : expenses.length === 0 ? (
                <p className="text-center text-[11px] text-slate-400 py-4">No expenses recorded</p>
              ) : (
                <div className="space-y-2.5">
                  {expenses.slice(0, 4).map((exp, i) => (
                    <div key={exp.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-rose-50">
                        <Receipt size={12} className="text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 leading-snug truncate">{exp.title}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{exp.expense_type} · {exp.date}</p>
                      </div>
                      <p className="text-[11px] font-black text-rose-600 shrink-0">Rs. {toNum(exp.amount).toLocaleString()}</p>
                    </div>
                  ))}
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
                <p className="text-center text-[11px] text-slate-400 py-4">No notifications</p>
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

            <DashboardCalendar primaryColor={primaryColor} />
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 pb-2">
          SchoolMS · Academic Management System · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}