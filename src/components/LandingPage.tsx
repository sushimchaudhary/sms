"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  BarChart3,
  ClipboardList,
  LogIn,
  BadgeCheck,
  BadgeX,
  Globe,
  ChevronDown,
  Check,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Dropdown, Select } from "antd";
import type { MenuProps } from "antd";
import { PublicServices } from "@/services/publicsServices";
import Image from "next/image";
import { useTheme } from "@/lib/context/ThemeContext";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface StudentAttendance {
  id: number;
  student_name: string;
  student_id: string;
  class_name: string;
  section_name: string | null;
  date: string;
  status: "present" | "absent";
  remarks: string | null;
}

interface StaffAttendance {
  id: number;
  full_name: string;
  user_email: string;
  date: string;
  status: "present" | "absent";
  check_in: string;
  check_out: string;
  remarks: string;
  is_self_marked: boolean;
}

interface LeaveSummaryDetail {
  casual: number;
  sick: number;
  festival: number;
  maternity: number;
  funeral: number;
}

interface LeaveSummary {
  allocated: LeaveSummaryDetail;
  used: LeaveSummaryDetail;
  remaining: LeaveSummaryDetail;
  total_allocated: number;
  total_used: number;
  total_remaining: number;
}

interface LeaveAllocation {
  id: number;
  teacher_name: string | null;
  staff_name: string | null;
  summary: LeaveSummary;
  casual_leave: number;
  sick_leave: number;
  festival_leave: number;
  maternity_leave: number;
  funeral_leave: number;
}

interface WeekDay {
  label: string;
  date: string;
  present: number;
  absent: number;
}

const LANGUAGES = [
  { code: "ne", label: "नेपाली" },
  { code: "en", label: "English" },
];

function triggerGoogleTranslate(langCode: string) {
  const selectEl = document.querySelector<HTMLSelectElement>(
    "#google_translate_element select",
  );
  if (!selectEl) return;
  selectEl.value = langCode;
  selectEl.dispatchEvent(new Event("change"));
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const today = new Date().toISOString().split("T")[0];

function getLast7Days<T extends { date: string; status: string }>(
  data: T[],
): WeekDay[] {
  const days: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const records = data.filter((r) => r.date === ds);
    days.push({
      label,
      date: ds,
      present: records.filter((r) => r.status === "present").length,
      absent: records.filter((r) => r.status === "absent").length,
    });
  }
  return days;
}

/* ─── Status Badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) =>
  status === "present" ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
      <BadgeCheck size={12} /> Present
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
      <BadgeX size={12} /> Absent
    </span>
  );

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: "blue" | "green" | "red" | "amber";
}) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white border border-gray-100 rounded p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-semibold text-gray-800">{value}</div>
        <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
};

/* ─── Leave Type Config ──────────────────────────────────────────────────── */
const LEAVE_TYPE_KEYS: {
  key: keyof LeaveSummaryDetail;
  label: string;
  allocatedCls: string;
  dot: string;
}[] = [
  { key: "casual",   label: "Casual",   allocatedCls: "bg-blue-50 text-blue-700",   dot: "bg-blue-400"   },
  { key: "sick",     label: "Sick",     allocatedCls: "bg-red-50 text-red-700",     dot: "bg-red-400"    },
  { key: "festival", label: "Festival", allocatedCls: "bg-purple-50 text-purple-700", dot: "bg-purple-400" },
  { key: "maternity",label: "Maternity",allocatedCls: "bg-orange-50 text-orange-700", dot: "bg-orange-400" },
  { key: "funeral",  label: "Funeral",  allocatedCls: "bg-slate-50 text-slate-700",  dot: "bg-slate-400"  },
];

/* ─── Leave Allocation Card ──────────────────────────────────────────────── */
const LeaveAllocationCard = ({ l }: { l: LeaveAllocation }) => {
  const name = l.teacher_name || l.staff_name || "Unknown";
  const role = l.teacher_name ? "Teacher" : "Staff";
  const { total_allocated, total_used, total_remaining } = l.summary;
  const usagePercent =
    total_allocated > 0
      ? Math.min(100, Math.round((total_used / total_allocated) * 100))
      : 0;
  const overUsed = total_remaining < 0;

  return (
    <div className="py-4 border-b border-gray-50 last:border-0">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[13px] font-semibold text-gray-800">{name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{role}</div>
        </div>
        <div className="text-[11px] text-gray-400 space-y-0.5 text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-gray-500">Allocated</span>
            <span className="font-semibold text-gray-700 min-w-[24px] text-right">{total_allocated}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-gray-500">Used</span>
            <span className="font-semibold text-amber-600 min-w-[24px] text-right">{total_used}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-gray-500">Remaining</span>
            <span className={`font-semibold min-w-[24px] text-right ${overUsed ? "text-red-600" : "text-green-600"}`}>
              {total_remaining}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {/* <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400">Usage</span>
          <span className={`text-[10px] font-medium ${overUsed ? "text-red-600" : "text-gray-500"}`}>
            {usagePercent}%{overUsed && " (over limit)"}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              overUsed ? "bg-red-500" : usagePercent >= 80 ? "bg-amber-400" : "bg-green-400"
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div> */}

      {/* Per-type breakdown table */}
      {/* <div className="rounded border border-gray-100 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-1.5 text-left font-semibold text-gray-400 w-[80px]">Type</th>
              <th className="px-3 py-1.5 text-center font-semibold text-gray-400">Allocated</th>
              <th className="px-3 py-1.5 text-center font-semibold text-gray-400">Used</th>
              <th className="px-3 py-1.5 text-center font-semibold text-gray-400">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {LEAVE_TYPE_KEYS.map((t) => {
              const allocated = l.summary.allocated[t.key];
              const used = l.summary.used[t.key];
              const remaining = l.summary.remaining[t.key];
              const isOver = remaining < 0;
              return (
                <tr key={t.key} className="border-t border-gray-50 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
                      <span className="text-gray-600 font-medium">{t.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${t.allocatedCls}`}>{allocated}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${used > 0 ? "bg-amber-50 text-amber-700" : "text-gray-400"}`}>
                      {used > 0 ? used : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${
                      isOver ? "bg-red-50 text-red-700"
                      : remaining === allocated ? "text-gray-400"
                      : "bg-green-50 text-green-700"
                    }`}>
                      {isOver ? `${remaining}` : remaining === allocated ? "—" : remaining}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div> */}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [staff, setStaff] = useState<StaffAttendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const { primaryColor } = useTheme();

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[1]);

  const handleLangChange = (lang: (typeof LANGUAGES)[0]) => {
    setSelectedLang(lang);
    setLangOpen(false);
    triggerGoogleTranslate(lang.code);
  };

  useEffect(() => {
    (async () => {
      try {
        const [sa, sta, la] = await Promise.all([
          PublicServices.getPublicStudentAttendance(),
          PublicServices.getPublicStaffAttendance(),
          PublicServices.getPublicLeaveAllocations(),
        ]);
        setStudents(sa);
        setStaff(sta);
        setLeaves(la);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayStudents = useMemo(() => students.filter((s) => s.date === today), [students]);
  const todayStaff    = useMemo(() => staff.filter((s) => s.date === today),    [staff]);

  // Only show first 5 staff rows on the landing page
  const previewStaff = useMemo(() => todayStaff.slice(0, 5), [todayStaff]);

  // Only show first 5 leave allocations on the landing page
  const previewLeaves = useMemo(() => leaves.slice(0, 5), [leaves]);

  const classes = useMemo(
    () => [...new Set(todayStudents.map((s) => s.class_name))].sort(),
    [todayStudents],
  );
  const sections = useMemo(
    () =>
      [
        ...new Set(
          todayStudents
            .filter((s) => !classFilter || s.class_name === classFilter)
            .map((s) => s.section_name)
            .filter(Boolean),
        ),
      ] as string[],
    [todayStudents, classFilter],
  );

  const filteredStudents = useMemo(
    () =>
      todayStudents.filter(
        (s) =>
          (!classFilter  || s.class_name   === classFilter)  &&
          (!sectionFilter|| s.section_name === sectionFilter) &&
          (!statusFilter || s.status       === statusFilter),
      ),
    [todayStudents, classFilter, sectionFilter, statusFilter],
  );

  const stuWeek   = useMemo(() => getLast7Days(students), [students]);
  const staffWeek = useMemo(() => getLast7Days(staff),    [staff]);

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const langMenuItems: MenuProps["items"] = LANGUAGES.map((lang) => ({
    key: lang.code,
    label: (
      <div className="flex items-center justify-between gap-6 min-w-[110px] py-0.5">
        <span className={selectedLang.code === lang.code ? "font-semibold" : "text-gray-600"}>
          {lang.label}
        </span>
        {selectedLang.code === lang.code && (
          <Check size={14} style={{ color: primaryColor }} />
        )}
      </div>
    ),
  }));

  const onLangMenuClick: MenuProps["onClick"] = ({ key }) => {
    const lang = LANGUAGES.find((l) => l.code === key);
    if (lang) handleLangChange(lang);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 shadow-sm relative z-10">
            <Image src="/edify.png" alt="Loading..." width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div className="absolute w-24 h-24 border-4 border-transparent border-t-[#2b98e1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-1 md:py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-14 h-10 md:w-26 md:h-10 flex items-center justify-center shrink-0">
            <Link href="https://edifynepal.com" target="_blank" rel="noopener noreferrer">
              <Image width={100} height={100} src="/logo_edify.png" alt="Logo" className="w-full h-auto" />
            </Link>
          </div>
          <div>
            <div className="text-[16px] md:text-[24px] font-bold text-gray-800 leading-tight">Mahachuni</div>
            <div className="text-[10px] md:text-[11px] text-gray-400">School Management System</div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Dropdown
            menu={{ items: langMenuItems, onClick: onLangMenuClick, selectedKeys: [selectedLang.code] }}
            trigger={["click"]}
            open={langOpen}
            onOpenChange={setLangOpen}
            placement="bottomRight"
            overlayStyle={{ minWidth: 130 }}
          >
            <button className="flex items-center gap-1.5 cursor-pointer rounded px-1 md:px-3 py-1.5 text-[11px] md:text-xs font-medium border transition-colors hover:shadow-sm">
              <Globe className="w-3 h-3 md:w-4 md:h-4" style={{ color: primaryColor }} />
              <span className="hidden sm:inline">{selectedLang.label}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
            </button>
          </Dropdown>

          <Link
            href="/login"
            className="flex items-center gap-1.5 bg-[#34b6d8] text-white text-[12px] md:text-[13px] font-medium px-1.5 py-1.5 rounded transition-colors"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Login</span>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#34b6d8] via-[#243c5a] to-[#243c5a] px-6 py-10 text-center">
        <p className="text-blue-200 text-[11px] tracking-widest uppercase mb-2">{dateLabel}</p>
        <h1 className="text-white text-2xl font-semibold mb-1">Edify Nepal — Live Overview</h1>
        <p className="text-blue-300 text-sm">Today's attendance, staff status and leave allocations</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Stat Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={UserCheck} value={todayStudents.filter((s) => s.status === "present").length} label="Students present today" color="green" />
          <StatCard icon={UserX}     value={todayStudents.filter((s) => s.status === "absent").length}  label="Students absent today"  color="red"   />
          <StatCard icon={Users}     value={todayStaff.filter((s) => s.status === "present").length}    label="Staff present today"     color="blue"  />
          <StatCard icon={CalendarDays} value={leaves.length}                                           label="Leave allocations"       color="amber" />
        </div>

        {/* ── Student Attendance Table ── */}
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-700">
              <ClipboardList size={16} className="text-blue-600" />
              Student attendance — today
              <span className="text-xs font-normal text-gray-400 ml-1">({filteredStudents.length} records)</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select
                size="small" style={{ width: 130 }} placeholder="All classes" allowClear
                value={classFilter || undefined}
                onChange={(value) => { setClassFilter(value ?? ""); setSectionFilter(""); }}
                options={classes.map((c) => ({ value: c, label: `Class ${c}` }))}
              />
              {sections.length > 0 && (
                <Select
                  size="small" style={{ width: 130 }} placeholder="All sections" allowClear
                  value={sectionFilter || undefined}
                  onChange={(value) => setSectionFilter(value ?? "")}
                  options={sections.map((s) => ({ value: s, label: s }))}
                />
              )}
              <Select
                size="small" style={{ width: 130 }} placeholder="All statuses" allowClear
                value={statusFilter || undefined}
                onChange={(value) => setStatusFilter(value ?? "")}
                options={[{ value: "present", label: "Present" }, { value: "absent", label: "Absent" }]}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                {todayStudents.length === 0 ? "No student attendance recorded for today." : "No records match the selected filters."}
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    {["Student","ID","Class","Section","Status","Date"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.student_name}</td>
                      <td className="px-4 py-3 text-gray-400 text-[11px]">{s.student_id}</td>
                      <td className="px-4 py-3 text-gray-600">Class {s.class_name}</td>
                      <td className="px-4 py-3 text-gray-400 text-[11px]">{s.section_name || "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-[11px]">{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Staff + Leave row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Staff Attendance (fixed height, 5 rows preview) ── */}
          <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                <span className="text-[14px] font-semibold text-gray-700">Staff attendance — today</span>
              </div>
              <span className="text-[11px] text-gray-400">
                {todayStaff.length} total
              </span>
            </div>

            {/* Fixed-height table body — shows exactly 5 rows */}
            <div className="overflow-hidden" style={{ height: 225 }}>
              {todayStaff.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No staff attendance recorded for today.
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Name","Email","Check-in","Check-out","Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 border-b border-gray-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewStaff.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{s.full_name}</td>
                        <td className="px-4 py-2.5 text-gray-400 text-[11px]">{s.user_email}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.check_in || "—"}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.check_out || "—"}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* "View all" footer — only when there are more than 5 */}
            {todayStaff.length > 5 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
                <span className="text-[11px] text-gray-400">
                  Showing 5 of {todayStaff.length} staff members
                </span>
                <Link
                  href="/public/staff-attendance"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#2b98e1] hover:text-[#1a7ab8] transition-colors"
                >
                  View all
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* ── Leave Allocations (preview: 5 rows) ── */}
          <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-amber-500" />
                <span className="text-[14px] font-semibold text-gray-700">Leave allocations</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-gray-300 inline-block" /> Allocated
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-amber-300 inline-block" /> Used
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-green-300 inline-block" /> Remaining
                </span>
              </div>
            </div>

            {/* Fixed-height scrollable body showing up to 5 allocations */}
            <div className="px-5 overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
              {leaves.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No leave allocations found.
                </div>
              ) : (
                previewLeaves.map((l) => <LeaveAllocationCard key={l.id} l={l} />)
              )}
            </div>

            {/* "View all" footer — only when there are more than 5 */}
            {leaves.length > 5 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
                <span className="text-[11px] text-gray-400">
                  Showing 5 of {leaves.length} allocations
                </span>
                <Link
                  href="/public/leave-allocations"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#2b98e1] hover:text-[#1a7ab8] transition-colors"
                >
                  View all
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── 7-Day Student Chart ── */}
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={16} className="text-green-600" />
            <span className="text-[14px] font-semibold text-gray-700">7-day student attendance trend</span>
          </div>
          <div className="px-5 py-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stuWeek} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e2e8f0" }} cursor={{ fill: "#f8fafc" }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Present" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent"  name="Absent"  fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 7-Day Staff Chart ── */}
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" />
            <span className="text-[14px] font-semibold text-gray-700">7-day staff attendance trend</span>
          </div>
          <div className="px-5 py-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={staffWeek} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e2e8f0" }} cursor={{ fill: "#f8fafc" }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Present" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent"  name="Absent"  fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-center pb-4">
          <p className="text-[12px] text-gray-500">
            © {new Date().getFullYear()} School Management System · Mahachuni
          </p>
          <p className="text-[12px] text-gray-500 mt-1">
            Developed by{" "}
            <Link
              href="https://sempatech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-500 hover:text-[#2b98e1] transition-colors hover:underline decoration-gray-500 hover:decoration-[#2b98e1]"
            >
              Sempa Tech
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}