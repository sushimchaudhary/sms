"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, XCircle, Clock, AlertCircle,
  Users, Search, Save, Loader2, RotateCcw, UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfigProvider, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import { useTheme } from "@/lib/context/ThemeContext";
import { AttendanceServices } from "@/services/attendanceServices";
import { EnrollmentServices } from "@/services/studentEnrollment";
import { ThemedButton } from "@/components/ui/themedButton";
import { CancelButton } from "@/components/ui/CancleButton";

/* ─── Types ─────────────────────────────────────────────────────── */
type AttendanceStatus = "present" | "absent" | "leave" | "late";

interface Enrollment {
  id: number;
  enrollment_no?: string;
  student?: { full_name: string };
  student_name?: string;
  class_assigned?: { id: number; name: string } | number;
  class_assigned_name?: string;
  class_assigned_id?: number;
  section?: { id: number; name: string } | number;
  section_name?: string;
  section_id?: number;
}

interface AttendanceRow {
  enrollment: number;
  status: AttendanceStatus;
  remarks: string;
}

interface BulkAttendanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/* ─── Safe getters ───────────────────────────────────────────────── */
const getClassId = (e: Enrollment): number | null => {
  if (typeof e.class_assigned === "object" && e.class_assigned !== null) return e.class_assigned.id;
  if (typeof e.class_assigned === "number") return e.class_assigned;
  return e.class_assigned_id ?? null;
};
const getClassName = (e: Enrollment): string => {
  if (typeof e.class_assigned === "object" && e.class_assigned !== null) return e.class_assigned.name;
  return e.class_assigned_name ?? `Class ${getClassId(e)}`;
};
const getSectionId = (e: Enrollment): number | null => {
  if (typeof e.section === "object" && e.section !== null) return e.section.id;
  if (typeof e.section === "number") return e.section;
  return e.section_id ?? null;
};
const getSectionName = (e: Enrollment): string => {
  if (typeof e.section === "object" && e.section !== null) return e.section.name;
  return e.section_name ?? `Section ${getSectionId(e)}`;
};

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string; pill: string; activePill: string; statColor: string; icon: React.ReactNode;
}> = {
  present: { label: "Present", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", activePill: "bg-emerald-500 text-white border-emerald-500", statColor: "text-emerald-600", icon: <CheckCircle2 size={10} /> },
  absent:  { label: "Absent",  pill: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",             activePill: "bg-rose-500 text-white border-rose-500",    statColor: "text-rose-600",    icon: <XCircle size={10} /> },
  leave:   { label: "Leave",   pill: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",             activePill: "bg-blue-500 text-white border-blue-500",    statColor: "text-blue-600",    icon: <AlertCircle size={10} /> },
  late:    { label: "Late",    pill: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",         activePill: "bg-amber-500 text-white border-amber-500",  statColor: "text-amber-600",   icon: <Clock size={10} /> },
};
const ALL_STATUSES: AttendanceStatus[] = ["present", "absent", "leave", "late"];

/* ─── Component ──────────────────────────────────────────────────── */
export default function BulkAttendanceForm({ isOpen, onClose, onSuccess }: BulkAttendanceFormProps) {
  const { primaryColor } = useTheme();

  /* ── Animation state ── */
  const [visible, setVisible]   = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimated(true));
      });
    } else {
      setAnimated(false);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const [classId, setClassId]     = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [date, setDate]           = useState<string>(dayjs().format("YYYY-MM-DD"));

  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [rows, setRows]                 = useState<Record<number, AttendanceRow>>({});
  const [selected, setSelected]         = useState<Set<number>>(new Set());
  const [search, setSearch]             = useState("");
  const [submitting, setSubmitting]     = useState(false);

  /* ── Fetch all enrollments once when modal opens ── */
  useEffect(() => {
    if (!isOpen) return;
    setLoadingOptions(true);
    EnrollmentServices.getAllEnrollments()
      .then((res) => {
        const data: Enrollment[] = res?.results || res || [];
        setAllEnrollments(data);
      })
      .catch(() => toast.error("Failed to load class/section options"))
      .finally(() => setLoadingOptions(false));
  }, [isOpen]);

  /* ── Reset on close ── */
  useEffect(() => {
    if (!isOpen) {
      setAllEnrollments([]);
      setEnrollments([]);
      setRows({});
      setSelected(new Set());
      setSearch("");
      setClassId(null);
      setSectionId(null);
    }
  }, [isOpen]);

  /* ── Auto-load students when BOTH class and section are selected ── */
  useEffect(() => {
    if (!classId || !sectionId) {
      setEnrollments([]);
      setRows({});
      setSelected(new Set());
      return;
    }
    const filtered = allEnrollments.filter(
      (e) => getClassId(e) === classId && getSectionId(e) === sectionId
    );
    if (filtered.length === 0) toast.info("No students found for this class/section");
    setEnrollments(filtered);
    const initial: Record<number, AttendanceRow> = {};
    filtered.forEach((e) => { initial[e.id] = { enrollment: e.id, status: "present", remarks: "" }; });
    setRows(initial);
    setSelected(new Set());
  }, [classId, sectionId, allEnrollments]);

  /* ── Derived options ── */
  const classOptions = useMemo(() => {
    const map = new Map<number, string>();
    allEnrollments.forEach((e) => {
      const id = getClassId(e);
      if (id !== null) map.set(id, getClassName(e));
    });
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allEnrollments]);

  const sectionOptions = useMemo(() => {
    const source = classId
      ? allEnrollments.filter((e) => getClassId(e) === classId)
      : allEnrollments;
    const map = new Map<number, string>();
    source.forEach((e) => {
      const id = getSectionId(e);
      if (id !== null) map.set(id, getSectionName(e));
    });
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allEnrollments, classId]);

  const visibleStudents = useMemo(
    () => enrollments.filter((e) => {
      const name = e.student?.full_name || e.student_name || "";
      return name.toLowerCase().includes(search.toLowerCase());
    }),
    [enrollments, search]
  );

  const stats = useMemo(() => {
    const counts = { present: 0, absent: 0, leave: 0, late: 0 };
    enrollments.forEach((e) => { const s = rows[e.id]?.status; if (s) counts[s]++; });
    return counts;
  }, [rows, enrollments]);

  const markedCount = enrollments.filter((e) => rows[e.id]?.status).length;
  const progress    = enrollments.length ? (markedCount / enrollments.length) * 100 : 0;

  const setStatus  = (id: number, status: AttendanceStatus) => setRows((p) => ({ ...p, [id]: { ...p[id], status } }));
  const setRemarks = (id: number, remarks: string)          => setRows((p) => ({ ...p, [id]: { ...p[id], remarks } }));

  const setBulkStatus = (status: AttendanceStatus) => {
    const targets = selected.size > 0 ? [...selected] : enrollments.map((e) => e.id);
    setRows((p) => { const n = { ...p }; targets.forEach((id) => { n[id] = { ...n[id], status }; }); return n; });
  };

  const toggleSelect = (id: number) =>
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSelectAll = () =>
    setSelected(selected.size === visibleStudents.length ? new Set() : new Set(visibleStudents.map((e) => e.id)));

  const resetAll = () => {
    const r: Record<number, AttendanceRow> = {};
    enrollments.forEach((e) => { r[e.id] = { enrollment: e.id, status: "present", remarks: "" }; });
    setRows(r);
    setSelected(new Set());
  };

  const handleSubmit = async () => {
    if (!enrollments.length) { toast.warning("No students loaded"); return; }
    setSubmitting(true);
    try {
      await AttendanceServices.bulkMarkStudentAttendance({
        date,
        class_id: classId,
        section_id: sectionId,
        attendances: enrollments.map((e) => ({
          enrollment: e.id,
          status: rows[e.id]?.status || "present",
          remarks: rows[e.id]?.remarks || "",
        })),
      });
      toast.success("Attendance submitted successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-250"
        style={{ opacity: animated ? 1 : 0 }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="w-full max-w-5xl bg-white rounded shadow-lg border border-gray-200 overflow-hidden font-mukta flex flex-col max-h-[90vh] transition-all duration-250"
          style={{
            opacity:   animated ? 1 : 0,
            transform: animated ? "scale(1) translateY(0)" : "scale(0.97) translateY(10px)",
          }}
        >
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-[#f5f6fa]">
              <div className="flex items-center gap-2">
                <UserCheck size={14} style={{ color: primaryColor }} />
                <span className="text-[13px] font-bold text-[#364a63]">Mark Attendance For Your Class</span>
              </div>
              <button onClick={onClose} className="text-[10px] font-bold text-red-500 hover:text-600 hover:rotate-90 transition-transform">
                <X size={14} />
              </button>
            </div>

            {/* Filters — now 3 cols, no Load button ── */}
            <div className="grid grid-cols-3 gap-3 px-5 py-3 border-b border-gray-100 bg-white">
              <div>
                <label className="text-[10px] font-bold text-[#8094ae] uppercase mb-1 block">Class</label>
                <Select
                  className="w-full h-[33px]"
                  placeholder={loadingOptions ? "Loading..." : classOptions.length === 0 ? "No classes found" : "Select class"}
                  loading={loadingOptions}
                  options={classOptions}
                  value={classId}
                  onChange={(val) => {
                    setClassId(val);
                    setSectionId(null); // reset section when class changes
                  }}
                  showSearch
                  optionFilterProp="label"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8094ae] uppercase mb-1 block">
                  Section
                  {classId && !sectionId && (
                    <span className="ml-2 text-amber-500 normal-case font-medium">← select to load students</span>
                  )}
                </label>
                <Select
                  className="w-full h-[33px]"
                  placeholder={!classId ? "Select class first" : "Select section"}
                  options={sectionOptions}
                  value={sectionId}
                  onChange={(val) => setSectionId(val)}
                  disabled={!classId}
                  showSearch
                  optionFilterProp="label"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8094ae] uppercase mb-1 block">Date</label>
                <DatePicker
                  className="w-full h-[33px]"
                  value={date ? dayjs(date) : null}
                  onChange={(d) => setDate(d ? d.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"))}
                />
              </div>
            </div>

            {/* Stats */}
            {enrollments.length > 0 && (
              <div className="grid grid-cols-5 gap-2 px-5 py-2 bg-[#f5f6fa] border-b border-gray-100">
                <div className="bg-white rounded border border-gray-200 px-3 py-1.5">
                  <div className="text-[9px] font-bold text-[#8094ae] uppercase">Total</div>
                  <div className="text-[18px] font-bold text-[#364a63]">{enrollments.length}</div>
                </div>
                {ALL_STATUSES.map((s) => (
                  <div key={s} className="bg-white rounded border border-gray-200 px-3 py-1.5">
                    <div className="text-[9px] font-bold text-[#8094ae] uppercase">{STATUS_CONFIG[s].label}</div>
                    <div className={`text-[18px] font-bold ${STATUS_CONFIG[s].statColor}`}>{stats[s]}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            {enrollments.length > 0 && (
              <div className="px-5 pt-2 pb-1 bg-white border-b border-gray-100">
                <div className="flex justify-between text-[9px] font-bold text-[#8094ae] uppercase mb-1">
                  <span>Marking Progress</span>
                  <span>{markedCount} / {enrollments.length} marked</span>
                </div>
                <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Toolbar */}
            {enrollments.length > 0 && (
              <div className="flex items-center gap-2 px-5 py-2 bg-white border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={visibleStudents.length > 0 && selected.size === visibleStudents.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-[#8094ae] font-bold uppercase mr-1">
                  {selected.size > 0 ? `${selected.size} selected` : "Select all"}
                </span>
                <div className="flex gap-1.5">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setBulkStatus(s)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold transition-all active:scale-95 ${STATUS_CONFIG[s].pill}`}
                    >
                      {STATUS_CONFIG[s].icon}
                      {selected.size > 0 ? ` Set ${STATUS_CONFIG[s].label}` : ` All ${STATUS_CONFIG[s].label}`}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="relative">
                    <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8094ae]" />
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-6 pr-3 h-[26px] text-[11px] border border-gray-200 rounded-full focus:outline-none focus:border-blue-400 bg-[#f5f6fa] text-[#364a63]"
                    />
                  </div>
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#8094ae] hover:text-[#364a63] transition-colors"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              {enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#8094ae]">
                  <Users size={36} className="mb-3 opacity-30" />
                  <span className="text-[13px] font-bold text-[#364a63]">
                    {loadingOptions ? "Loading data..." : !classId ? "Select a class to begin" : !sectionId ? "Now select a section" : "No students found"}
                  </span>
                  <span className="text-[11px] mt-1">
                    {!classId || !sectionId ? "Students will load automatically" : "Try a different class or section"}
                  </span>
                </div>
              ) : (
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 shadow-sm">
                    <tr className="bg-[#f5f6fa]">
                      <th className="px-4 py-1.5 w-8 border-b" />
                      <th className="px-4 py-1.5 text-[10px] font-bold text-[#8094ae] uppercase border-b w-8">#</th>
                      <th className="px-4 py-1.5 text-[10px] font-bold text-[#8094ae] uppercase border-b">Student</th>
                      <th className="px-4 py-1.5 text-[10px] font-bold text-[#8094ae] uppercase border-b text-center">Status</th>
                      <th className="px-4 py-1.5 text-[10px] font-bold text-[#8094ae] uppercase border-b">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleStudents.map((e, idx) => {
                      const row   = rows[e.id];
                      const name  = e.student?.full_name || e.student_name || "Unknown";
                      const isSel = selected.has(e.id);
                      return (
                        <tr key={e.id} className={`transition-colors ${isSel ? "bg-blue-50/40" : "hover:bg-gray-50"}`}>
                          <td className="px-4 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => toggleSelect(e.id)}
                              className="rounded border-gray-300 text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-1.5 text-[10px] text-[#8094ae] font-bold">{idx + 1}</td>
                          <td className="px-4 py-1.5">
                            <div className="text-[11px] font-bold text-[#364a63] uppercase">{name}</div>
                            <div className="text-[10px] text-indigo-500 font-medium">{e.enrollment_no || `ENR-${e.id}`}</div>
                          </td>
                          <td className="px-4 py-1.5">
                            <div className="flex items-center justify-center gap-1">
                              {ALL_STATUSES.map((s) => {
                                const active = row?.status === s;
                                return (
                                  <button
                                    key={s}
                                    onClick={() => setStatus(e.id, s)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold transition-all active:scale-90 ${active ? STATUS_CONFIG[s].activePill : STATUS_CONFIG[s].pill}`}
                                  >
                                    {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              type="text"
                              value={row?.remarks || ""}
                              onChange={(ev) => setRemarks(e.id, ev.target.value)}
                              placeholder="Add remark..."
                              className="w-full h-[26px] px-2 text-[11px] border border-gray-200 rounded focus:outline-none focus:border-blue-400 bg-[#f5f6fa] text-[#364a63]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-[#f5f6fa]">
              <span className="text-[11px] text-[#8094ae] font-bold">
                {enrollments.length} students • {markedCount} marked
                {selected.size > 0 && ` • ${selected.size} selected`}
              </span>
              <div className="flex gap-2">
                <CancelButton onClick={onClose} disabled={submitting} />
                <ThemedButton onClick={handleSubmit} disabled={submitting || enrollments.length === 0} size="sm">
                  <div className="flex items-center gap-1.5">
                    {submitting ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    Submit Attendance
                  </div>
                </ThemedButton>
              </div>
            </div>

          </ConfigProvider>
        </div>
      </div>
    </>
  );
}