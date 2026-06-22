"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  GraduationCap,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  BarChart3,
  ClipboardList,
  LogIn,
  School,
  BadgeCheck,
  BadgeX,
  Globe,
  ChevronDown,
  Check,
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

interface LeaveAllocation {
  id: number;
  teacher_name: string | null;
  staff_name: string | null;
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
  // "en" means restore original — Google uses "/" as the cookie value for that
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
      <div
        className={`w-10 h-10 rounded flex items-center justify-center ${colors[color]}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-semibold text-gray-800">{value}</div>
        <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
};

/* ─── Leave pills ────────────────────────────────────────────────────────── */
const LEAVE_TYPES: {
  key: keyof LeaveAllocation;
  label: string;
  cls: string;
}[] = [
  { key: "casual_leave", label: "Casual", cls: "bg-blue-50 text-[#2b98e1]" },
  { key: "sick_leave", label: "Sick", cls: "bg-red-50 text-red-700" },
  {
    key: "festival_leave",
    label: "Festival",
    cls: "bg-purple-50 text-purple-700",
  },
  {
    key: "maternity_leave",
    label: "Maternity",
    cls: "bg-orange-50 text-orange-700",
  },
  { key: "funeral_leave", label: "Funeral", cls: "bg-slate-50 text-slate-600" },
];

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

  // Filters
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

  /* derived */
  const todayStudents = useMemo(
    () => students.filter((s) => s.date === today),
    [students],
  );
  const todayStaff = useMemo(
    () => staff.filter((s) => s.date === today),
    [staff],
  );

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
          (!classFilter || s.class_name === classFilter) &&
          (!sectionFilter || s.section_name === sectionFilter) &&
          (!statusFilter || s.status === statusFilter),
      ),
    [todayStudents, classFilter, sectionFilter, statusFilter],
  );

  const stuWeek = useMemo(() => getLast7Days(students), [students]);
  const staffWeek = useMemo(() => getLast7Days(staff), [staff]);

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /* ── language dropdown menu ── */
  const langMenuItems: MenuProps["items"] = LANGUAGES.map((lang) => ({
    key: lang.code,
    label: (
      <div className="flex items-center justify-between gap-6 min-w-[110px] py-0.5">
        <span
          className={
            selectedLang.code === lang.code
              ? "font-semibold"
              : "text-gray-600"
          }
        >
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
        <div className="text-slate-400 text-sm">Loading school data…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-1 md:py-3 flex items-center justify-between sticky top-0 z-30">
        {/* Logo and Title Section */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-14 h-10 md:w-26 md:h-10 flex items-center justify-center shrink-0">
            <Link 
              href="https://edifynepal.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Image
                width={100}
                height={100}
                src={"/logo_edify.png"}
                alt="Logo"
                className="w-full h-auto"
              />
            </Link>
          </div>

          {/* School Name: Always Visible | Subtitle: Hidden on small screens */}
          <div>
            <div className="text-[16px] md:text-[24px] font-bold text-gray-800 leading-tight">
              Mahachuni
            </div>
            <div className="text-[10px] md:text-[11px] text-gray-400">
              School Management System
            </div>
          </div>
        </div>

        {/* Right Side: Language + Login */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Language Selector (antd Dropdown) */}
          <Dropdown
            menu={{
              items: langMenuItems,
              onClick: onLangMenuClick,
              selectedKeys: [selectedLang.code],
            }}
            trigger={["click"]}
            open={langOpen}
            onOpenChange={setLangOpen}
            placement="bottomRight"
            overlayStyle={{ minWidth: 130 }}
          >
            <button
              className="flex items-center gap-1.5 cursor-pointer rounded px-1 md:px-3 py-1.5 text-[11px] md:text-xs font-medium border transition-colors hover:shadow-sm"
              
            >
              <Globe
                className="w-3 h-3 md:w-4 md:h-4"
                style={{ color: primaryColor }}
              />
              <span className="hidden sm:inline">{selectedLang.label}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  langOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </Dropdown>

          {/* Login Button */}
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
        <p className="text-blue-200 text-[11px] tracking-widest uppercase mb-2">
          {dateLabel}
        </p>
        <h1 className="text-white text-2xl font-semibold mb-1">
          Edify Nepal — Live Overview
        </h1>
        <p className="text-blue-300 text-sm">
          Today's attendance, staff status and leave allocations
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stat Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={UserCheck}
            value={todayStudents.filter((s) => s.status === "present").length}
            label="Students present today"
            color="green"
          />
          <StatCard
            icon={UserX}
            value={todayStudents.filter((s) => s.status === "absent").length}
            label="Students absent today"
            color="red"
          />
          <StatCard
            icon={Users}
            value={todayStaff.filter((s) => s.status === "present").length}
            label="Staff present today"
            color="blue"
          />
          <StatCard
            icon={CalendarDays}
            value={leaves.length}
            label="Leave allocations"
            color="amber"
          />
        </div>

        {/* ── Student Attendance Table ── */}
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-700">
              <ClipboardList size={16} className="text-blue-600" />
              Student attendance — today
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({filteredStudents.length} records)
              </span>
            </div>

            {/* Filters (antd Select) */}
            <div className="flex gap-2 flex-wrap">
              <Select
                size="small"
                style={{ width: 130 }}
                placeholder="All classes"
                allowClear
                value={classFilter || undefined}
                onChange={(value) => {
                  setClassFilter(value ?? "");
                  setSectionFilter("");
                }}
                options={classes.map((c) => ({
                  value: c,
                  label: `Class ${c}`,
                }))}
              />

              {sections.length > 0 && (
                <Select
                  size="small"
                  style={{ width: 130 }}
                  placeholder="All sections"
                  allowClear
                  value={sectionFilter || undefined}
                  onChange={(value) => setSectionFilter(value ?? "")}
                  options={sections.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
              )}

              <Select
                size="small"
                style={{ width: 130 }}
                placeholder="All statuses"
                allowClear
                value={statusFilter || undefined}
                onChange={(value) => setStatusFilter(value ?? "")}
                options={[
                  { value: "present", label: "Present" },
                  { value: "absent", label: "Absent" },
                ]}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                {todayStudents.length === 0
                  ? "No student attendance recorded for today."
                  : "No records match the selected filters."}
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                      Student
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                      ID
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                      Class
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                      Section
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {s.student_name}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-[11px]">
                        {s.student_id}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        Class {s.class_name}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-[11px]">
                        {s.section_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-[11px]">
                        {s.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Staff + Leave row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Staff Attendance */}
          <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              <span className="text-[14px] font-semibold text-gray-700">
                Staff attendance — today
              </span>
            </div>
            <div className="overflow-x-auto">
              {todayStaff.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No staff attendance recorded for today.
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                        Check-in
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                        Check-out
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 border-b border-gray-100">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayStaff.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {s.full_name}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-[11px]">
                          {s.user_email}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.check_in || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.check_out || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Leave Allocations */}
          <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <CalendarDays size={16} className="text-amber-500" />
              <span className="text-[14px] font-semibold text-gray-700">
                Leave allocations
              </span>
            </div>
            <div className="divide-y divide-gray-50 px-5">
              {leaves.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No leave allocations found.
                </div>
              ) : (
                leaves.map((l) => {
                  const name = l.teacher_name || l.staff_name || "Unknown";
                  const role = l.teacher_name ? "Teacher" : "Staff";
                  return (
                    <div key={l.id} className="py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-[13px] font-semibold text-gray-800">
                            {name}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {role}
                          </div>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">
                          Total:{" "}
                          {LEAVE_TYPES.reduce(
                            (a, t) => a + (l[t.key] as number),
                            0,
                          )}{" "}
                          days
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {LEAVE_TYPES.map((t) => (
                          <span
                            key={t.key}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.cls}`}
                          >
                            {t.label}: {l[t.key] as number}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── 7-Day Student Chart ── */}
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={16} className="text-green-600" />
            <span className="text-[14px] font-semibold text-gray-700">
              7-day student attendance trend
            </span>
          </div>
          <div className="px-5 py-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stuWeek} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "0.5px solid #e2e8f0",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="present"
                  name="Present"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="absent"
                  name="Absent"
                  fill="#dc2626"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 7-Day Staff Chart ── */}
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" />
            <span className="text-[14px] font-semibold text-gray-700">
              7-day staff attendance trend
            </span>
          </div>
          <div className="px-5 py-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={staffWeek} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "0.5px solid #e2e8f0",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="present"
                  name="Present"
                  fill="#1d4ed8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="absent"
                  name="Absent"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
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