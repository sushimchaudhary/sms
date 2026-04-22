"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SearchX,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Minus,
  History,
  Download,
  Printer,
  UserCheck,
  CalendarDays,
  LogIn,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { AttendanceServices } from "@/services/attendanceServices";
import ConfirmModal from "@/components/delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import dayjs from "dayjs";

// ── Types (Updated to match your response) ────────────────────────────────────
interface StaffAttendance {
  id: number;
  user: number;
  user_email: string;
  full_name: string; // From your response
  school: number;
  date: string;
  status: "present" | "absent" | "leave" | "half_day";
  check_in: string | null;
  check_out: string | null;
  remarks: string | null;
  marked_by: number;
  marked_by_email: string; // From your response
  is_self_marked: boolean;
  created_at: string;
  updated_at: string;
}

interface StaffAttendanceTableProps {
  onEdit: (data: StaffAttendance) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; cls: string }
> = {
  present: {
    icon: <CheckCircle2 size={10} />,
    label: "Present",
    cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  absent: {
    icon: <XCircle size={10} />,
    label: "Absent",
    cls: "bg-rose-50 text-rose-600 border-rose-100",
  },
  leave: {
    icon: <AlertCircle size={10} />,
    label: "Leave",
    cls: "bg-blue-50 text-blue-600 border-blue-100",
  },
  half_day: {
    icon: <Minus size={10} />,
    label: "Half Day",
    cls: "bg-amber-50 text-amber-600 border-amber-100",
  },
};

const StaffAttendanceTable: React.FC<StaffAttendanceTableProps> = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}) => {
  const [list, setList] = useState<StaffAttendance[]>([]);
  const [filteredData, setFilteredData] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  // --- Fetch ---
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await AttendanceServices.getStaffAttendance();
      // Directly handle the array or the nested results
      const all = Array.isArray(res) ? res : res?.results || res?.data || [];
      setList([...all].reverse());
    } catch {
      toast.error("Failed to load staff attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [refreshTrigger]);

  // --- Filter ---
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const result = list.filter(
      (item) =>
        (item.full_name || "").toLowerCase().includes(q) ||
        (item.user_email || "").toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.date.includes(q)
    );
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, list]);

  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const handleConfirmDelete = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => AttendanceServices.deleteStaffAttendance(id)));
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

  const downloadPDF = () => toast.info("Generating PDF... Please wait.");
  const handlePrint = () => window.print();

  return (
    <div className="space-y-3 font-mukta">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 border-b text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === paginatedItems.length
                          ? []
                          : paginatedItems.map((i) => i.id)
                      )
                    }
                  />
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b">Staff & Email</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Status</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Check In / Out</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Marked By</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b">Update Info</th>
                <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24 border-b">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={7} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">No records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.present;

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                      <td className="px-4 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(item.id) ? prev.filter((i) => i !== item.id) : [...prev, item.id]
                            )
                          }
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Staff & Email Section */}
                      <td className="px-6 py-1">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase">
                            {item.full_name || "N/A"}
                          </span>
                          <span className="text-[10px] text-indigo-500 font-medium tracking-tight">
                            {item.user_email || "—"}
                          </span>
                          <span className="text-[10px] text-[#8094ae] flex items-center gap-1 mt-0.5">
                            <CalendarDays size={9} /> {item.date}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-1">
                        <div className="flex justify-center">
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${status.cls}`}>
                            {status.icon} {status.label}
                          </div>
                        </div>
                      </td>

                      {/* Check In / Out Time */}
                      <td className="px-6 py-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                            <LogIn size={10} />
                            {item.check_in ? dayjs(`2000-01-01 ${item.check_in}`).format("hh:mm A") : "—"}
                          </span>
                          <span className="text-[10px] text-rose-500 flex items-center gap-1 font-bold">
                            <LogOut size={10} />
                            {item.check_out ? dayjs(`2000-01-01 ${item.check_out}`).format("hh:mm A") : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Marked By Section */}
                      <td className="px-6 py-1">
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] text-[#364a63] font-bold  flex items-center gap-1.5 text-center">
                            
                            {item.marked_by_email || "N/A"}
                          </span>
                          {item.is_self_marked && (
                            <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded mt-0.5">Self Marked</span>
                          )}
                        </div>
                      </td>

                      {/* Update Info */}
                      <td className="px-6 py-1">
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

                      <td className="px-4 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all">
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIds([]);
                              setDeleteId(item.id);
                              setIsModalOpen(true);
                            }}
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

        {/* Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1 border-t bg-[#f5f6fa]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-2">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </span>
              <button onClick={downloadPDF} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 active:scale-95 transition-all">
                <Download size={12} /> PDF
              </button>
              <ThemedButton onClick={handlePrint} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-white rounded">
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

      {/* Bulk Delete */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest pl-2">
            {selectedIds.length} Records Selected
          </span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 transition-all">
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Multiple Records?" : "Remove Attendance?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} records?` : "This action cannot be undone."}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default StaffAttendanceTable;