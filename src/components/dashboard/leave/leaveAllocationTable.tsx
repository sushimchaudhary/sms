"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil, Trash2, User, Eye, Calendar, Filter, ChevronDown, X, TrendingUp,
  Download, Printer, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Dropdown, Button } from "antd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { ThemedButton } from "@/components/ui/themedButton";
import type { MenuProps } from "antd";
import ConfirmModal from "@/components/delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { LeaveAllocationServices } from "@/services/leaveAllocationServices";
import useAuth from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/context/ThemeContext";
import { SessionServices } from "@/services/sessionsServices";

// ─── Interfaces ───────────────────────────────────────────────────────────────
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

interface APILeaveAllocation {
  id: number;
  teacher_name: string | null;
  staff_name: string | null;
  created_at: string;
  updated_at: string;
  casual_leave: number;
  sick_leave: number;
  festival_leave: number;
  maternity_leave: number;
  funeral_leave: number;
  school: number;
  session: number;
  teacher: number | null;
  staff: number | null;
  summary?: LeaveSummary;
}

interface AcademicSession {
  id: number;
  name: string;
  is_active: boolean;
  school: number;
}

interface LeaveAllocationTableProps {
  onEdit: (data: APILeaveAllocation) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

type RoleFilter = "all" | "teacher" | "staff";
const PAGE_SIZE = 20;

// ─── Leave type config ────────────────────────────────────────────────────────
const LEAVE_TYPES: {
  key: keyof LeaveSummaryDetail;
  label: string;
  dot: string;
  allocatedCls: string;
  barCls: string;
}[] = [
  { key: "casual",    label: "Casual",    dot: "bg-blue-400",   allocatedCls: "bg-blue-50 text-blue-700",     barCls: "bg-blue-400"   },
  { key: "sick",      label: "Sick",      dot: "bg-red-400",    allocatedCls: "bg-red-50 text-red-700",       barCls: "bg-red-400"    },
  { key: "festival",  label: "Festival",  dot: "bg-purple-400", allocatedCls: "bg-purple-50 text-purple-700", barCls: "bg-purple-400" },
  { key: "maternity", label: "Maternity", dot: "bg-orange-400", allocatedCls: "bg-orange-50 text-orange-700", barCls: "bg-orange-400" },
  { key: "funeral",   label: "Funeral",   dot: "bg-slate-400",  allocatedCls: "bg-slate-50 text-slate-700",   barCls: "bg-slate-400"  },
];

// ─── Build summary from flat fields (fallback when API omits summary) ─────────
function buildSummaryFromFlat(item: APILeaveAllocation): LeaveSummary {
  if (item.summary) return item.summary;
  const allocated: LeaveSummaryDetail = {
    casual:    item.casual_leave    || 0,
    sick:      item.sick_leave      || 0,
    festival:  item.festival_leave  || 0,
    maternity: item.maternity_leave || 0,
    funeral:   item.funeral_leave   || 0,
  };
  const used: LeaveSummaryDetail      = { casual: 0, sick: 0, festival: 0, maternity: 0, funeral: 0 };
  const remaining: LeaveSummaryDetail = { ...allocated };
  const total_allocated = Object.values(allocated).reduce((a, v) => a + v, 0);
  return { allocated, used, remaining, total_allocated, total_used: 0, total_remaining: total_allocated };
}

// ─── Breakdown Modal ──────────────────────────────────────────────────────────
const BreakdownModal = ({
  item,
  sessionName,
  onClose,
}: {
  item: APILeaveAllocation;
  sessionName: string;
  onClose: () => void;
}) => {
  const { primaryColor } = useTheme();
  const name    = item.teacher_name || item.staff_name || "Unknown";
  const role    = item.teacher ? "Teacher" : item.staff ? "Staff" : "N/A";
  const summary = buildSummaryFromFlat(item);
  const { total_allocated, total_used, total_remaining } = summary;
  const overUsed = total_remaining < 0;
  const usagePct = total_allocated > 0
    ? Math.min(100, Math.round((total_used / total_allocated) * 100))
    : 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[460px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
          <div>
            <div className="text-white font-bold text-[14px] flex items-center gap-1.5">
              <User size={13} className="text-white/70" />
              {name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                role === "Teacher" ? "bg-blue-400/30 text-blue-100" : "bg-amber-400/30 text-amber-100"
              }`}>{role}</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[9px]">
                <Calendar size={9} /> {sessionName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-red-300 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Totals */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
              <div className="text-[10px] text-gray-400 mb-1 font-medium">Allocated</div>
              <div className="text-2xl font-black text-slate-800">{total_allocated}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">days total</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
              <div className="text-[10px] text-amber-500 mb-1 font-medium">Used</div>
              <div className="text-2xl font-black text-amber-600">{total_used}</div>
              <div className="text-[9px] text-amber-400 mt-0.5">days taken</div>
            </div>
            <div className={`rounded-lg p-3 text-center border ${overUsed ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
              <div className={`text-[10px] mb-1 font-medium ${overUsed ? "text-red-500" : "text-green-500"}`}>Remaining</div>
              <div className={`text-2xl font-black ${overUsed ? "text-red-600" : "text-green-600"}`}>{total_remaining}</div>
              <div className={`text-[9px] mt-0.5 ${overUsed ? "text-red-400" : "text-green-400"}`}>
                {overUsed ? "⚠ over limit" : "days left"}
              </div>
            </div>
          </div>

          {/* Overall progress */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <TrendingUp size={11} className="text-slate-400" /> Overall Usage
              </span>
              <span className={`text-[11px] font-black ${overUsed ? "text-red-600" : usagePct >= 80 ? "text-amber-600" : "text-slate-700"}`}>
                {usagePct}%{overUsed && " — OVER LIMIT"}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overUsed ? "bg-red-500" : usagePct >= 80 ? "bg-amber-400" : "bg-[#2b98e1]"
                }`}
                style={{ width: `${Math.min(usagePct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-gray-400">
              <span>0 days</span><span>{total_allocated} days</span>
            </div>
          </div>

          {/* Per-type bars */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Leave Breakdown by Type</div>
            {LEAVE_TYPES.map((t) => {
              const alloc  = summary.allocated[t.key];
              const used   = summary.used[t.key];
              const remain = summary.remaining[t.key];
              const isOver = remain < 0;
              const pct    = alloc > 0 ? Math.min(100, Math.round((used / alloc) * 100)) : 0;
              return (
                <div key={t.key} className="bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
                      <span className="text-[12px] font-bold text-slate-700">{t.label} Leave</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-gray-400">{used}/{alloc}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        isOver ? "bg-red-50 text-red-600" : remain === 0 ? "bg-gray-100 text-gray-400" : "bg-green-50 text-green-600"
                      }`}>
                        {isOver ? `${remain} over` : remain === alloc ? "none used" : `${remain} left`}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-400" : t.barCls}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed table */}
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Detailed Table</div>
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left font-bold text-gray-400">Type</th>
                    <th className="px-3 py-2 text-center font-bold text-gray-400">Allocated</th>
                    <th className="px-3 py-2 text-center font-bold text-gray-400">Used</th>
                    <th className="px-3 py-2 text-center font-bold text-gray-400">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {LEAVE_TYPES.map((t) => {
                    const alloc  = summary.allocated[t.key];
                    const used   = summary.used[t.key];
                    const remain = summary.remaining[t.key];
                    const isOver = remain < 0;
                    return (
                      <tr key={t.key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
                            <span className="font-semibold text-slate-600">{t.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${t.allocatedCls}`}>{alloc}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${used > 0 ? "bg-amber-50 text-amber-700" : "text-gray-300"}`}>
                            {used > 0 ? used : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            isOver ? "bg-red-50 text-red-700" : remain === alloc ? "text-gray-300" : "bg-green-50 text-green-700"
                          }`}>
                            {remain === alloc ? "—" : remain}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-3 py-2 font-black text-slate-800 text-[11px]">Total</td>
                    <td className="px-3 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded font-black bg-slate-100 text-slate-800">{total_allocated}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded font-black bg-amber-100 text-amber-800">{total_used}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded font-black ${overUsed ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {total_remaining}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[11px] font-bold rounded text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TABLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const LeaveAllocationTable = ({ onEdit, refreshTrigger, searchQuery = "" }: LeaveAllocationTableProps) => {
  const { primaryColor } = useTheme();

  const [list,          setList]          = useState<APILeaveAllocation[]>([]);
  const [sessions,      setSessions]      = useState<AcademicSession[]>([]);
  const [filteredData,  setFilteredData]  = useState<APILeaveAllocation[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [roleFilter,    setRoleFilter]    = useState<RoleFilter>("all");

  // ── Selection state (mirrors LeaveTable) ──────────────────────────────────
  const [selectedIds,   setSelectedIds]   = useState<number[]>([]);

  // ── Delete state ──────────────────────────────────────────────────────────
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Breakdown modal ───────────────────────────────────────────────────────
  const [activeBreakdown, setActiveBreakdown] = useState<APILeaveAllocation | null>(null);

  const { loggedInUser } = useAuth();
  const role    = (loggedInUser?.role || "").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getSessionName = (sessionId: number): string => {
    const found = sessions.find((s) => s.id === sessionId);
    return found ? found.name : `Session (${sessionId})`;
  };
  const getEmployeeName = (item: APILeaveAllocation) =>
    item.teacher_name || item.staff_name || "Unknown";
  const getEmployeeRole = (item: APILeaveAllocation) =>
    item.teacher ? "Teacher" : item.staff ? "Staff" : "N/A";

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const initMasterData = async () => {
    try {
      setLoading(true);
      const sessionRes = await SessionServices.getSessions();
      const parsedSessions: AcademicSession[] = Array.isArray(sessionRes)
        ? sessionRes : sessionRes?.results || sessionRes?.data || [];
      setSessions(parsedSessions);

      const res = await LeaveAllocationServices.getAllLeaveAllocations();
      const allData: APILeaveAllocation[] = Array.isArray(res) ? res : res?.results || res?.data || [];

      let visible = allData;
      if (!isAdmin) {
        const myTeacherId = loggedInUser?.teacher?.id;
        const myStaffId   = loggedInUser?.staff?.id;
        visible = allData.filter(
          (item) =>
            (item.teacher && item.teacher === myTeacherId) ||
            (item.staff && item.staff === myStaffId)
        );
      }
      setList([...visible].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch {
      toast.error("Failed to load leave allocation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initMasterData(); }, [refreshTrigger]);

  // ── Filter ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = list.filter((item) => {
      const name        = getEmployeeName(item).toLowerCase();
      const sessionName = getSessionName(item.session).toLowerCase();
      const matchSearch = !q || name.includes(q) || sessionName.includes(q);
      const matchRole   = roleFilter === "all" || getEmployeeRole(item).toLowerCase() === roleFilter;
      return matchSearch && matchRole;
    });
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]); // clear selection on filter change
  }, [searchQuery, list, roleFilter, sessions]);

  const paginatedItems = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages     = Math.ceil(filteredData.length / PAGE_SIZE);

  // ── PDF download ──────────────────────────────────────────────────────────
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Leave Allocation Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${dayjs().format("DD MMM, YYYY")}`, 14, 22);
    autoTable(doc, {
      head: [["S.N.", "Employee", "Role", "Session", "Casual", "Sick", "Festival", "Maternity", "Funeral", "Total"]],
      body: paginatedItems.map((item, i) => {
        const s = buildSummaryFromFlat(item);
        return [
          (currentPage - 1) * PAGE_SIZE + i + 1,
          getEmployeeName(item),
          getEmployeeRole(item),
          getSessionName(item.session),
          item.casual_leave,
          item.sick_leave,
          item.festival_leave,
          item.maternity_leave,
          item.funeral_leave,
          s.total_allocated,
        ];
      }),
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Leave_Allocation_Page_${currentPage}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const rows = paginatedItems
      .map((item, i) => {
        const s = buildSummaryFromFlat(item);
        return `<tr>
          <td>${(currentPage - 1) * PAGE_SIZE + i + 1}</td>
          <td>${getEmployeeName(item)}</td>
          <td>${getEmployeeRole(item)}</td>
          <td>${getSessionName(item.session)}</td>
          <td>${item.casual_leave}</td>
          <td>${item.sick_leave}</td>
          <td>${item.festival_leave}</td>
          <td>${item.maternity_leave}</td>
          <td>${item.funeral_leave}</td>
          <td><strong>${s.total_allocated}</strong></td>
        </tr>`;
      })
      .join("");
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(
        `<html><head><title>Leave Allocation List</title>
        <style>
          body{font-family:sans-serif;padding:30px}
          table{width:100%;border-collapse:collapse;margin-top:20px}
          th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left;font-size:11px}
          th{background:#f8fafc;color:#64748b;text-transform:uppercase}
          h2{color:#1e293b}
        </style></head>
        <body>
          <h2>Leave Allocation Report</h2>
          <p>Page ${currentPage} | Total: ${filteredData.length} records | Date: ${dayjs().format("DD MMM, YYYY")}</p>
          <table>
            <thead><tr>
              <th>S.N.</th><th>Employee</th><th>Role</th><th>Session</th>
              <th>Casual</th><th>Sick</th><th>Festival</th><th>Maternity</th><th>Funeral</th><th>Total</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body></html>`
      );
      w.document.close();
      w.print();
    }
  };

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const allPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((i) => selectedIds.includes(i.id));
  const somePageSelected =
    paginatedItems.some((i) => selectedIds.includes(i.id)) && !allPageSelected;

  const handleSelectAll = () => {
    if (allPageSelected) {
      // deselect all on this page
      setSelectedIds((prev) => prev.filter((id) => !paginatedItems.find((i) => i.id === id)));
    } else {
      // select all on this page (merge with existing selections from other pages)
      const pageIds = paginatedItems.map((i) => i.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    // If bulk selection exists, delete those; else delete single row
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    if (ids.length === 0) return;
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => LeaveAllocationServices.deleteLeaveAllocation(id)));
      toast.success(`${ids.length} allocation record${ids.length > 1 ? "s" : ""} deleted`);
      initMasterData();
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to delete allocation records");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const dropdownItems: MenuProps["items"] = [
    { key: "all",     label: "All Roles" },
    { key: "teacher", label: "Teacher Only" },
    { key: "staff",   label: "Staff Only" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 font-mukta">

      {/* ── Filter Topbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Dropdown
              menu={{ items: dropdownItems, onClick: (e) => setRoleFilter(e.key as RoleFilter) }}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <Button size="small" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white border border-gray-200 shadow-xs hover:bg-gray-50">
                <Filter size={11} className="text-slate-400" />
                <span>Filter: {roleFilter === "all" ? "All Roles" : roleFilter.toUpperCase()}</span>
                <ChevronDown size={11} className="text-gray-400 ml-1" />
              </Button>
            </Dropdown>
          )}
        </div>

        {/* Live selection counter badge */}
        {selectedIds.length > 0 && (
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
            style={{ color: primaryColor, backgroundColor: `${primaryColor}12`, borderColor: `${primaryColor}30` }}
          >
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* ── Main Table ── */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[450px]">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#f5f6fa] sticky top-0 z-10">
                {/* Checkbox column */}
                {isAdmin && (
                  <th className="px-4 py-1.5 border-b w-10">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 cursor-pointer"
                    />
                  </th>
                )}
                {["S.N.", "Employee", "Session", "Role", "Total Allocated", "Usage", "Actions"].map((h) => (
                  <th key={h} className="px-9 py-1.5 text-[11px] font-bold text-[#8094ae] uppercase border-b whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={4} cols={isAdmin ? 8 : 7} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-sm font-semibold text-gray-400">
                    No active balance configurations found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const summary    = buildSummaryFromFlat(item);
                  const overUsed   = summary.total_remaining < 0;
                  const usagePct   = summary.total_allocated > 0
                    ? Math.min(100, Math.round((summary.total_used / summary.total_allocated) * 100))
                    : 0;
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/70 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
                    >
                      {/* Checkbox */}
                      {isAdmin && (
                        <td className="px-4 py-1.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(item.id)}
                            className="rounded border-gray-300 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* S.N. */}
                      <td className="px-4 py-1.5 text-[11px] text-gray-400">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>

                      {/* Employee */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-blue-500 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-700">{getEmployeeName(item)}</span>
                        </div>
                      </td>

                      {/* Session */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-amber-50 border border-amber-100 rounded px-2 py-0.5 w-max">
                          <Calendar size={11} className="text-amber-500" />
                          <span>{getSessionName(item.session)}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          getEmployeeRole(item) === "Teacher"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-teal-50 text-teal-600 border-teal-100"
                        }`}>{getEmployeeRole(item)}</span>
                      </td>

                      {/* Total allocated */}
                      <td className="px-4 py-1.5">
                        <span className="text-[11px] font-black text-slate-800">
                          {summary.total_allocated} days
                        </span>
                        {summary.total_used > 0 && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {summary.total_used} used · {summary.total_remaining} left
                          </div>
                        )}
                      </td>

                      {/* Usage bar */}
                      <td className="px-4 py-1.5 min-w-[110]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                overUsed ? "bg-red-400" : usagePct >= 80 ? "bg-amber-400" : "bg-green-400"
                              }`}
                              style={{ width: `${Math.min(usagePct, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold w-8 shrink-0 text-right ${
                            overUsed ? "text-red-500" : "text-gray-400"
                          }`}>{usagePct}%</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-1.5 ">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveBreakdown(item)}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border transition-all active:scale-95"
                            style={{ color: primaryColor, borderColor: primaryColor }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${primaryColor}15`)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Eye size={11} /> <span>View</span>
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => onEdit(item)}
                                className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                title="Edit"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedIds([]);   // clear bulk selection for single delete
                                  setDeleteId(item.id);
                                  setIsModalOpen(true);
                                }}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer: pagination + PDF + Print ── */}
        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1.5 border-t bg-[#f5f6fa]">
            {/* Left: record range + export buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-1">
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

            {/* Right: page navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 disabled:opacity-30 hover:bg-gray-200 rounded transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-bold px-2 text-[#526484]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 disabled:opacity-30 hover:bg-gray-200 rounded transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bulk selection action bar (mirrors LeaveTable) ── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
            {selectedIds.length} Record{selectedIds.length > 1 ? "s" : ""} Selected
          </span>
          <div className="flex items-center gap-2">
            {/* Deselect all */}
            <button
              onClick={() => setSelectedIds([])}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-all"
            >
              <X size={11} /> Deselect All
            </button>
            {/* Bulk delete */}
            <button
              onClick={() => {
                setDeleteId(null); // ensure bulk path is used
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 active:scale-95 transition-all shadow-sm"
            >
              <Trash2 size={12} /> Delete Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* ── Breakdown Modal ── */}
      {activeBreakdown && (
        <BreakdownModal
          item={activeBreakdown}
          sessionName={getSessionName(activeBreakdown.session)}
          onClose={() => setActiveBreakdown(null)}
        />
      )}

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Multiple Allocation Records?" : "Remove Allocation Data?"}
        message={
          selectedIds.length > 0
            ? `Are you sure you want to delete ${selectedIds.length} allocation record${selectedIds.length > 1 ? "s" : ""}? This cannot be undone.`
            : "Are you sure you want to completely discard this allocation quota rule?"
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default LeaveAllocationTable;