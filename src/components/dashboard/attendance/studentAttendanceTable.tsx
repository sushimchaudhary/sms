"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Pencil, Trash2, ChevronLeft, ChevronRight,
  UserCheck, Inbox, SearchX, CheckCircle2, XCircle,
  Clock, AlertCircle, Layers, History, Download, Printer,
} from "lucide-react";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { AttendanceServices } from "@/services/attendanceServices";
import ConfirmModal from "@/components/delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import dayjs from "dayjs";

/* ─── Types ──────────────────────────────────────────────────────── */
interface StudentAttendance {
  id: string | number;
  student_name: string;
  student_id: string;
  class_name: string;
  section_name: string;
  date: string;
  status: "present" | "absent" | "leave" | "late";
  remarks: string;
  marked_by: any;
  marked_by_name?: string;
  updated_at: string;
  enrollment: number;
}

interface AttendanceTableProps {
  onEdit: (data: StudentAttendance) => void;
  refreshTrigger: number;
  searchQuery?: string;
  /* filters passed from page */
  filterClass?: string | null;
  filterSection?: string | null;
  filterStatus?: string | null;
  filterDateRange?: [string, string] | null;
  /* callbacks to lift option lists up to page */
  onClassOptionsChange?: (opts: { value: string; label: string }[]) => void;
  onSectionOptionsChange?: (opts: { value: string; label: string }[]) => void;
}

const PAGE_SIZE = 20;

const STATUS_CONFIG: any = {
  present: { icon: <CheckCircle2 size={12} />, label: "Present", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  absent:  { icon: <XCircle size={12} />,      label: "Absent",  cls: "bg-rose-50 text-rose-600 border-rose-100" },
  leave:   { icon: <AlertCircle size={12} />,  label: "Leave",   cls: "bg-blue-50 text-blue-600 border-blue-100" },
  late:    { icon: <Clock size={12} />,         label: "Late",    cls: "bg-amber-50 text-amber-600 border-amber-100" },
};

/* ─── Component ──────────────────────────────────────────────────── */
const StudentAttendanceTable: React.FC<AttendanceTableProps> = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
  filterClass = null,
  filterSection = null,
  filterStatus = null,
  filterDateRange = null,
  onClassOptionsChange,
  onSectionOptionsChange,
}) => {
  const [list, setList]               = useState<StudentAttendance[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId]       = useState<string | number | null>(null);

  /* ── Fetch ── */
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await AttendanceServices.getStudentAttendance();
      const allData = Array.isArray(res) ? res : res?.results || res?.data || [];
      setList([...allData].reverse());
    } catch {
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, [refreshTrigger]);

  /* ── Lift class options up to page ── */
  useEffect(() => {
    const names = [...new Set(list.map((i) => i.class_name).filter(Boolean))].sort();
    onClassOptionsChange?.(names.map((n) => ({ value: n, label: n })));
  }, [list]);

  /* ── Lift section options up to page (filtered by selected class) ── */
  useEffect(() => {
    const source = filterClass ? list.filter((i) => i.class_name === filterClass) : list;
    const names  = [...new Set(source.map((i) => i.section_name).filter(Boolean))].sort();
    onSectionOptionsChange?.(names.map((n) => ({ value: n, label: n })));
  }, [list, filterClass]);

  /* ── Combined filter logic ── */
  const filteredData = useMemo(() => {
    return list.filter((item) => {
      const q = searchQuery.toLowerCase();

      const matchSearch =
        !q ||
        item.student_name?.toLowerCase().includes(q) ||
        item.student_id?.toLowerCase().includes(q) ||
        item.class_name?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q);

      const matchClass   = !filterClass   || item.class_name   === filterClass;
      const matchSection = !filterSection || item.section_name === filterSection;
      const matchStatus  = !filterStatus  || item.status       === filterStatus;

      const matchDate = !filterDateRange || (() => {
        const d = dayjs(item.date);
        return (
          d.isAfter(dayjs(filterDateRange[0]).subtract(1, "day")) &&
          d.isBefore(dayjs(filterDateRange[1]).add(1, "day"))
        );
      })();

      return matchSearch && matchClass && matchSection && matchStatus && matchDate;
    });
  }, [list, searchQuery, filterClass, filterSection, filterStatus, filterDateRange]);

  /* Reset to page 1 whenever filters change */
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, filterClass, filterSection, filterStatus, filterDateRange]);

  const paginatedItems = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages     = Math.ceil(filteredData.length / PAGE_SIZE);

  /* ── Delete ── */
  const handleConfirmDelete = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => AttendanceServices.deleteStudentAttendance(id)));
      toast.success(ids.length > 1 ? "Selected records deleted" : "Record deleted successfully");
      setList((prev) => prev.filter((item) => !ids.includes(item.id)));
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to delete records");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  /* ── Render ── */
  return (
    <div className="space-y-3 font-mukta">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">

        {/* ── Table ── */}
        <div className="overflow-x-auto max-h-[440px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 border-b text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === paginatedItems.length
                          ? []
                          : paginatedItems.map((i) => i.id)
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Student & ID</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Status</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Class / Sec</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Marked By</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Update Info</th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24 border-b">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={7} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery || filterClass || filterSection || filterStatus || filterDateRange
                        ? <SearchX size={32} className="text-rose-300" />
                        : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">No records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const status     = STATUS_CONFIG[item.status] || STATUS_CONFIG.present;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="px-4 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(item.id)
                                ? prev.filter((i) => i !== item.id)
                                : [...prev, item.id]
                            )
                          }
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Student & ID */}
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase">{item.student_name}</span>
                          <span className="text-[10px] text-indigo-500 font-medium tracking-tight">{item.student_id}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-2">
                        <div className="flex justify-center">
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${status.cls}`}>
                            {status.icon} {status.label}
                          </div>
                        </div>
                      </td>

                      {/* Class / Section */}
                      <td className="px-6 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-600 uppercase">
                          <Layers size={11} className="text-amber-500" />
                          <span>{item.class_name} - {item.section_name}</span>
                        </div>
                      </td>

                      {/* Marked By */}
                      <td className="px-6 py-2">
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase flex items-center gap-1.5">
                            <UserCheck size={12} className="text-emerald-500" />
                            {item.marked_by_name || item.marked_by || "N/A"}
                          </span>
                          <span className="text-[9px] text-[#8094ae] italic">Attendance: {item.date}</span>
                        </div>
                      </td>

                      {/* Update Info */}
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#8094ae] flex items-center gap-1 font-medium">
                            <History size={10} className="text-blue-400" />
                            {dayjs(item.updated_at).format("MMM DD, hh:mm A")}
                          </span>
                          <span className="text-[9px] text-amber-600 pl-3.5 font-medium truncate max-w-[120px]">
                            {item.remarks || "No remarks"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => { setSelectedIds([]); setDeleteId(item.id); setIsModalOpen(true); }}
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

        {/* ── Footer ── */}
        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1.5 border-t bg-[#f5f6fa]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-2">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </span>
              <button
                onClick={() => toast.info("Generating PDF... Please wait.")}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                <Download size={12} /> PDF
              </button>
              <ThemedButton
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-white rounded active:scale-95 transition-all shadow-sm"
              >
                <Printer size={12} /> Print
              </ThemedButton>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bulk delete bar ── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest pl-2">
            {selectedIds.length} Records Selected
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
        title={selectedIds.length > 0 ? "Delete Multiple Records?" : "Remove Attendance?"}
        message={
          selectedIds.length > 0
            ? `Are you sure you want to delete ${selectedIds.length} attendance records?`
            : "This action cannot be undone. Are you sure you want to delete this record?"
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default StudentAttendanceTable;