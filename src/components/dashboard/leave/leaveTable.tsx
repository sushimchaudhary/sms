"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Pencil, Trash2, ChevronLeft, ChevronRight, Download, Printer,
  Inbox, SearchX, Calendar, User, ChevronDown, Filter, X,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import ConfirmModal from "@/components/delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { LeaveServices } from "@/services/leaveServices";
import { ThemedButton } from "@/components/ui/themedButton";
import useAuth from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/context/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Leave {
  id: number;
  user?: { id: number; name: string };
  student_enrollment?: number | null;
  teacher?: number | null;
  staff?: number | null;
  student_name?: string;
  teacher_name?: string;
  staff_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  is_half_day: boolean;
  attachment?: string | null;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  school?: number;
  session?: number | null;
}

interface LeaveTableProps {
  onEdit: (data: Leave) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";
type RoleFilter   = "all" | "student" | "teacher" | "staff";
// ✅ NEW: view filter lets teacher/staff toggle whose leaves they see
type ViewFilter   = "all" | "mine" | "student";

const PAGE_SIZE = 20;

// ─── Reusable Dropdown ────────────────────────────────────────────────────────
interface DropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string; dot?: string }[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
   primaryColor: string; 
}

const FilterDropdown = ({ label, value, options, onChange, icon, primaryColor }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isActive = value !== "all";

  return (
      <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        // ✅ active state uses primaryColor via inline style instead of hardcoded blue
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded border transition-all select-none ${
          isActive
            ? "text-white shadow-sm"
            : "bg-white text-[#526484] border-gray-200"
        }`}
        style={
          isActive
            ? { backgroundColor: primaryColor, borderColor: primaryColor }
            : undefined
        }
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.borderColor = primaryColor + "80";
            (e.currentTarget as HTMLElement).style.backgroundColor = primaryColor + "10";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.borderColor = "";
            (e.currentTarget as HTMLElement).style.backgroundColor = "";
          }
        }}
      >
        {icon && <span className="opacity-80">{icon}</span>}
        <span>{isActive ? selected?.label : label}</span>
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
 
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-100 rounded-lg shadow-xl min-w-[155px] overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              // ✅ selected item highlighted with primaryColor
              className={`w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 transition-colors ${
                value === opt.value ? "font-bold" : "text-[#526484] hover:bg-gray-50"
              }`}
              style={
                value === opt.value
                  ? { backgroundColor: primaryColor + "15", color: primaryColor }
                  : undefined
              }
            >
              {opt.dot && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: opt.dot }}  // ✅ dot color passed as hex
                />
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const LeaveTable = ({ onEdit, refreshTrigger, searchQuery = "" }: LeaveTableProps) => {
  const { primaryColor } = useTheme(); 
  const [list,          setList]          = useState<Leave[]>([]);
  const [filteredData,  setFilteredData]  = useState<Leave[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [selectedIds,   setSelectedIds]   = useState<number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId,      setDeleteId]      = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter,   setRoleFilter]   = useState<RoleFilter>("all");
  const [viewFilter,   setViewFilter]   = useState<ViewFilter>("all"); // ✅ NEW

  const { loggedInUser } = useAuth();

  // ─── Role flags ───────────────────────────────────────────────────────────
  const role      = (loggedInUser?.role || "").toLowerCase();
  const isAdmin   = role === "admin" || role === "superadmin";
  const isTeacher = role === "teacher";
  const isStaff   = role === "staff";
  const isStudent = role === "student";

  // ─── Ownership matchers ───────────────────────────────────────────────────
  const isMyTeacherLeave = (item: Leave): boolean => {
    if (!isTeacher) return false;
    const myProfileId = loggedInUser?.teacher?.id;
    if (myProfileId != null && item.teacher === myProfileId) return true;
    const myName  = (loggedInUser?.teacher?.name || loggedInUser?.name || "").toLowerCase().trim();
    const rowName = (item.teacher_name || "").toLowerCase().trim();
    return myName !== "" && rowName !== "" && rowName === myName;
  };

  const isMyStaffLeave = (item: Leave): boolean => {
    if (!isStaff) return false;
    const myProfileId = loggedInUser?.staff?.id;
    if (myProfileId != null && item.staff === myProfileId) return true;
    const myName  = (loggedInUser?.staff?.name || loggedInUser?.name || "").toLowerCase().trim();
    const rowName = (item.user?.name || "").toLowerCase().trim();
    return myName !== "" && rowName !== "" && rowName === myName;
  };

  const isMyStudentLeave = (item: Leave): boolean => {
    if (!isStudent) return false;
    const myProfileId = loggedInUser?.student?.id ?? loggedInUser?.id;
    if (myProfileId != null && item.student_enrollment === myProfileId) return true;
    const myName  = (loggedInUser?.student?.name || loggedInUser?.name || "").toLowerCase().trim();
    const rowName = (item.student_name || "").toLowerCase().trim();
    return myName !== "" && rowName !== "" && rowName === myName;
  };

  // Is this row a student leave? (used for teacher/staff view filter)
  const isStudentLeave = (item: Leave): boolean =>
    !!item.student_name || item.student_enrollment != null;

  // ─── Display helpers ──────────────────────────────────────────────────────
  const getApplicantName = (item: Leave): string =>
    item.student_name || item.teacher_name || item.user?.name || item.staff_name || "Unknown";

  const getApplicantRole = (item: Leave): string => {
    if (item.student_name  || item.student_enrollment != null) return "Student";
    if (item.teacher_name  || item.teacher != null)            return "Teacher";
    if (item.staff_name    || item.staff != null)              return "Staff";
    return "N/A";
  };

  // ─── Fetch + initial role-based visibility ────────────────────────────────
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res      = await LeaveServices.getAllLeaves();
      const allData: Leave[] = Array.isArray(res) ? res : res?.results || res?.data || [];

      let visible: Leave[];

      if (isAdmin) {
        visible = allData;
      } else if (isTeacher) {
        // Teacher base pool: own leaves + all student leaves
        visible = allData.filter(
          (item) => isMyTeacherLeave(item) || isStudentLeave(item)
        );
      } else if (isStaff) {
        // Staff base pool: own leaves + all student leaves
        visible = allData.filter(
          (item) => isMyStaffLeave(item) || isStudentLeave(item)
        );
      } else if (isStudent) {
        // Student: only own leaves
        visible = allData.filter((item) => isMyStudentLeave(item));
      } else {
        visible = [];
      }

      setList(
        [...visible].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [refreshTrigger]);

  // ─── Combined filter (search + dropdowns + viewFilter) ────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();

    const result = list.filter((item) => {
      // ── Search ──
      const name = getApplicantName(item).toLowerCase();
      const matchSearch =
        !q ||
        name.includes(q) ||
        item.leave_type?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q);

      // ── Status ──
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      // ── Role (admin only) ──
      const itemRole  = getApplicantRole(item).toLowerCase();
      const matchRole = roleFilter === "all" || itemRole === roleFilter;

      // ✅ View filter (teacher / staff):
      //   "all"     → show everything in their base pool (own + students)
      //   "mine"    → show only their own leave rows
      //   "student" → show only student leave rows
      let matchView = true;
      if ((isTeacher || isStaff) && viewFilter !== "all") {
        if (viewFilter === "mine") {
          matchView = isTeacher ? isMyTeacherLeave(item) : isMyStaffLeave(item);
        } else if (viewFilter === "student") {
          matchView = isStudentLeave(item);
        }
      }

      return matchSearch && matchStatus && matchRole && matchView;
    });

    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, list, statusFilter, roleFilter, viewFilter]);

  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const activeFilterCount = [
    statusFilter !== "all",
    roleFilter   !== "all",
    viewFilter   !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter("all");
    setRoleFilter("all");
    setViewFilter("all");
  };

  // ─── PDF ──────────────────────────────────────────────────────────────────
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Leave Request Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${dayjs().format("DD MMM, YYYY")}`, 14, 22);
    autoTable(doc, {
      head: [["S.N.", "Name", "Role", "Type", "Duration", "Days", "Status"]],
      body: paginatedItems.map((item, i) => [
        (currentPage - 1) * PAGE_SIZE + i + 1,
        getApplicantName(item),
        getApplicantRole(item),
        item.leave_type.toUpperCase(),
        `${dayjs(item.start_date).format("DD MMM")} - ${dayjs(item.end_date).format("DD MMM, YYYY")}`,
        `${dayjs(item.end_date).diff(dayjs(item.start_date), "day") + 1} Day(s)`,
        item.status.toUpperCase(),
      ]),
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Leave_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  // ─── Print ────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const rows = paginatedItems.map((item, i) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + i + 1}</td>
        <td>${getApplicantName(item)}</td>
        <td>${getApplicantRole(item)}</td>
        <td>${item.leave_type}</td>
        <td>${dayjs(item.start_date).format("DD MMM")} – ${dayjs(item.end_date).format("DD MMM, YYYY")}</td>
        <td>${dayjs(item.end_date).diff(dayjs(item.start_date), "day") + 1} Day(s)</td>
        <td>${item.status}</td>
      </tr>`).join("");
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<html><head><title>Leave List</title>
        <style>body{font-family:sans-serif;padding:30px}table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #e2e8f0;padding:10px;text-align:left;font-size:12px}
        th{background:#f8fafc;color:#64748b;text-transform:uppercase}h2{color:#1e293b}</style></head>
        <body><h2>Leave Request Report</h2>
        <p>Page ${currentPage} | Total: ${filteredData.length} records</p>
        <table><thead><tr><th>S.N.</th><th>Name</th><th>Role</th><th>Type</th>
        <th>Duration</th><th>Days</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table></body></html>`);
      w.document.close();
      w.print();
    }
  };

  // ─── Checkboxes ───────────────────────────────────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) setSelectedIds([]);
    else setSelectedIds(paginatedItems.map((i) => i.id));
  };
  const handleSelectOne = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => LeaveServices.deleteLeave(id)));
      toast.success(`${ids.length} record(s) deleted`);
      fetchLeaves();
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to delete records");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // ─── Style helpers ────────────────────────────────────────────────────────
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default:         return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "Teacher": return "bg-blue-50 text-blue-600 border-blue-100";
      case "Student": return "bg-purple-50 text-purple-600 border-purple-100";
      case "Staff":   return "bg-teal-50 text-teal-600 border-teal-100";
      default:        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 font-mukta">

    <div className="flex flex-wrap items-center gap-2 px-1">
        {/* ✅ Filter label uses primaryColor */}
        <span
          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: primaryColor }}
        >
          <Filter size={11} /> Filter:
        </span>
 
        {/* Status */}
        <FilterDropdown
          label="All Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          primaryColor={primaryColor}
          options={[
            { value: "all",      label: "All Status" },
            { value: "pending",  label: "Pending",   dot: "#f59e0b" },
            { value: "approved", label: "Approved",  dot: "#22c55e" },
            { value: "rejected", label: "Rejected",  dot: "#ef4444" },
          ]}
        />
 
        {/* Role — admin only */}
        {isAdmin && (
          <FilterDropdown
            label="All Roles"
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as RoleFilter)}
            primaryColor={primaryColor}
            options={[
              { value: "all",     label: "All Roles" },
              { value: "student", label: "Student"   },
              { value: "teacher", label: "Teacher"   },
              { value: "staff",   label: "Staff"     },
            ]}
          />
        )}
 
        {/* View — teacher & staff only */}
        {(isTeacher || isStaff) && (
          <FilterDropdown
            label="All Leaves"
            value={viewFilter}
            onChange={(v) => setViewFilter(v as ViewFilter)}
            primaryColor={primaryColor}
            icon={<User size={11} />}
            options={[
              { value: "all",     label: "All Leaves",     dot: "#94a3b8" },
              { value: "mine",    label: "My Application", dot: primaryColor },
              { value: "student", label: "Student Leaves", dot: "#8b5cf6"   },
            ]}
          />
        )}
 
        {/* ✅ Clear button uses primaryColor-adjacent red — unchanged */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 rounded hover:bg-red-100 transition-all"
          >
            <X size={11} /> Clear ({activeFilterCount})
          </button>
        )}
 
        {activeFilterCount > 0 && (
          <span className="text-[10px] text-[#8094ae] italic">
            {filteredData.length} result{filteredData.length !== 1 ? "s" : ""}
          </span>
        )}
 
        {/* ✅ Info badge uses primaryColor background tint */}
        <span
          className="ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full border"
          style={{
            color:           primaryColor,
            backgroundColor: primaryColor + "12",
            borderColor:     primaryColor + "30",
          }}
        >
          {isAdmin   && "Viewing: All leaves"}
          {isTeacher && (
            viewFilter === "mine"    ? "Viewing: Your leaves only" :
            viewFilter === "student" ? "Viewing: Student leaves only" :
                                       "Viewing: Your leaves + student leaves"
          )}
          {isStaff   && (
            viewFilter === "mine"    ? "Viewing: Your leaves only" :
            viewFilter === "student" ? "Viewing: Student leaves only" :
                                       "Viewing: Your leaves + student leaves"
          )}
          {isStudent && "Viewing: Your leaves only"}
        </span>
      </div>

      {/* ══ TABLE ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[450px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">

            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 border-b">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                </th>
                {["S.N.", "Applicant", "Role", "Type & Reason", "Duration", "Status", "Attachment", "Action"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b whitespace-nowrap
                      ${h === "Action" ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={9} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery || activeFilterCount > 0
                        ? <SearchX size={32} className="text-rose-300" />
                        : <Inbox   size={32} className="text-gray-200"  />
                      }
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery || activeFilterCount > 0
                          ? "No matching leave records found."
                          : "No leave requests recorded."}
                      </span>
                      {activeFilterCount > 0 && (
                        <button onClick={clearAllFilters} className="text-[11px] text-blue-500 underline">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const isSelected    = selectedIds.includes(item.id);
                  const applicantName = getApplicantName(item);
                  const applicantRole = getApplicantRole(item);
                  const days          = dayjs(item.end_date).diff(dayjs(item.start_date), "day") + 1;

                  const isMyOwnRow =
                    (isTeacher && isMyTeacherLeave(item)) ||
                    (isStaff   && isMyStaffLeave(item));

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors
                        ${isSelected  ? "bg-blue-50/40" : ""}
                        ${isMyOwnRow  ? "border-l-[3px] border-l-blue-400" : "border-l-[3px] border-l-transparent"}
                      `}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.id)}
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-1 text-[10px] text-[#526484]">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>

                      <td className="px-4 py-1">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase flex items-center gap-1 flex-wrap">
                            <User size={10} className="text-blue-500 flex-shrink-0" />
                            {applicantName}
                            {isMyOwnRow && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-bold rounded-full normal-case">
                                YOU
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-gray-400 ml-3.5">
                            Applied: {dayjs(item.created_at).format("DD MMM, YYYY")}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getRoleBadgeStyle(applicantRole)}`}>
                          {applicantRole}
                        </span>
                      </td>

                      <td className="px-4 py-1">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">
                              {item.leave_type}
                            </span>
                            {item.is_half_day && (
                              <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-bold rounded uppercase border border-orange-100">
                                Half Day
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 italic line-clamp-1">
                            {item.reason}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-1">
                        <div className="flex flex-col text-[10px] text-slate-600 font-medium">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar size={10} className="text-rose-400 flex-shrink-0" />
                            {dayjs(item.start_date).format("DD MMM")} –{" "}
                            {dayjs(item.end_date).format("DD MMM, YYYY")}
                          </div>
                          <span className="text-[9px] text-slate-400 ml-3.5">
                            {days} Day{days > 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-1">
                        {item.attachment ? (
                          <a
                            href={item.attachment}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold hover:bg-green-100 transition-all"
                          >
                            <Download size={11} /> View File
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-300">No File</span>
                        )}
                      </td>

                      <td className="px-4 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => onEdit(item)}
                            title="Edit"
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => { setSelectedIds([]); setDeleteId(item.id); setIsModalOpen(true); }}
                            title="Delete"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1 border-t bg-[#f5f6fa]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-2">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </span>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                <Download size={12} /> PDF
              </button>
              <ThemedButton
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-white bg-slate-600 border border-slate-200 rounded hover:bg-slate-700 active:scale-95 transition-all"
              >
                <Printer size={12} /> Print
              </ThemedButton>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
            {selectedIds.length} Request{selectedIds.length > 1 ? "s" : ""} Selected
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 active:scale-95 transition-all shadow-sm"
          >
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Multiple Leave Requests?" : "Remove Leave Record?"}
        message={
          selectedIds.length > 0
            ? `Are you sure you want to delete ${selectedIds.length} leave records?`
            : "This action cannot be undone. Are you sure you want to delete this leave request?"
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default LeaveTable;