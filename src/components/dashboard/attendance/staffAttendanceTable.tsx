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
  AlertCircle,
  Minus,
  History,
  Download,
  Printer,
  CalendarDays,
  LogIn,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { AttendanceServices } from "@/services/attendanceServices";
import ConfirmModal from "@/components/delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import dayjs from "dayjs";
import NepaliDate from "nepali-date-converter";

interface StaffAttendance {
  id: number;
  user: number;
  user_email: string;
  full_name: string;
  school: number;
  date: string;
  status: "present" | "absent" | "leave" | "half_day";
  check_in: string | null;
  check_out: string | null;
  remarks: string | null;
  marked_by: number;
  marked_by_email: string;
  is_self_marked: boolean;
  created_at: string;
  updated_at: string;
}

interface StaffAttendanceTableProps {
  onEdit: (data: StaffAttendance) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const convertADtoBS = (adDateString: string): string => {
  if (!adDateString) return "N/A";
  try {
    // मितिलाई सही ढाँचामा बदल्ने
    const nd = new NepaliDate(new Date(adDateString));
    const y = nd.getYear();
    const m = String(nd.getMonth() + 1).padStart(2, "0");
    const d = String(nd.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch (error) {
    return adDateString;
  }
};

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

  const formatToNepaliBS = (adDateString: string) => {
    return convertADtoBS(adDateString);
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await AttendanceServices.getStaffAttendance();
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

  // ── EXPORT TO PDF LOGIC (Expense table जस्तै हुबहु) ─────────────────────────
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Staff Attendance Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => {
      const checkInTime = item.check_in ? dayjs(`2000-01-01 ${item.check_in}`).format("hh:mm A") : "—";
      const checkOutTime = item.check_out ? dayjs(`2000-01-01 ${item.check_out}`).format("hh:mm A") : "—";
      const statusLabel = STATUS_CONFIG[item.status]?.label || item.status;
      
      return [
        (currentPage - 1) * PAGE_SIZE + index + 1,
        `${item.full_name}\n(${item.user_email})`,
        statusLabel.toUpperCase(),
        `In: ${checkInTime}\nOut: ${checkOutTime}`,
        item.marked_by_email || "N/A",
        formatToNepaliBS(item.date),
      ];
    });

    autoTable(doc, {
      head: [["S.N.", "Staff Details", "Status", "Timing", "Marked By", "Date"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [54, 74, 99] },
    });

    doc.save(`Attendance_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  // ── HTML PRINT PREVIEW LOGIC (Expense table जस्तै हुबहु) ───────────────────
  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => {
      const checkInTime = item.check_in ? dayjs(`2000-01-01 ${item.check_in}`).format("hh:mm A") : "—";
      const checkOutTime = item.check_out ? dayjs(`2000-01-01 ${item.check_out}`).format("hh:mm A") : "—";
      const statusLabel = STATUS_CONFIG[item.status]?.label || item.status;

      return `
        <tr>
          <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
          <td><strong>${item.full_name}</strong><br><small style="color: #6366f1">${item.user_email}</small></td>
          <td><span class="status-badge">${statusLabel}</span></td>
          <td>In: ${checkInTime}<br>Out: ${checkOutTime}</td>
          <td>${item.marked_by_email || "—"}</td>
          <td>${formatToNepaliBS(item.date)}</td>
        </tr>
      `;
    }).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Staff Attendance List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; color: #1e293b; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
              h2 { color: #1e293b; margin-bottom: 5px; }
              .status-badge { font-weight: bold; text-transform: uppercase; font-size: 10px; }
            </style>
          </head>
          <body>
            <h2>Staff Attendance Report</h2>
            <div>Generated for Page ${currentPage} | Total Records: ${filteredData.length}</div>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Staff Details</th>
                  <th>Status</th>
                  <th>Timing</th>
                  <th>Marked By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>${printContent}</tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((i) => i.id));
    }
  };

  const handleSelectOne = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => AttendanceServices.deleteStaffAttendance(id)));
      toast.success(ids.length > 1 ? "Selected records deleted" : "Record deleted successfully");
      fetchAttendance();
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to delete records");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3 font-mukta">
      {/* Table Container */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] scrollbar-hide relative">
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
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Staff & Email</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Status</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Check In / Out</th>
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
                      {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery ? "No matching records found." : "No attendance recorded."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
                  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.present;

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                      <td className="px-4 py-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.id)}
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase">
                            {item.full_name || "N/A"}
                          </span>
                          <span className="text-[10px] text-indigo-500 font-medium tracking-tight">
                            {item.user_email || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex justify-center">
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${status.cls}`}>
                            {status.icon} {status.label}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2">
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
                      <td className="px-6 py-2">
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] text-[#364a63] font-bold flex items-center gap-1.5 text-center">
                            {item.marked_by_email || "N/A"}
                          </span>
                          {item.is_self_marked && (
                            <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded mt-0.5">Self Marked</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#8094ae] flex items-center gap-1 font-medium">
                            <History size={10} className="text-blue-400" />
                            {formatToNepaliBS(item.updated_at)} at {dayjs(item.updated_at).format("hh:mm A")}
                          </span>
                          <span className="text-[9px] text-amber-600 pl-3.5 font-medium truncate max-w-[120px]">
                            {item.remarks || "No remarks"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => { setSelectedIds([]); setDeleteId(item.id); setIsModalOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all">
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

        {/* Footer with Actions */}
        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1 border-t bg-[#f5f6fa]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-2">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </span>
              <button onClick={downloadPDF} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
                <Download size={12} /> PDF
              </button>
              <ThemedButton onClick={handlePrint} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-white bg-slate-600 border border-slate-200 rounded hover:bg-slate-700 active:scale-95 transition-all">
                <Printer size={12} /> Print
              </ThemedButton>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <span className="text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 px-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{selectedIds.length} Record(s) Selected</span>
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
        title={selectedIds.length > 0 ? "Delete Multiple Records?" : "Remove Attendance Record?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} attendance records?` : "This action cannot be undone. Are you sure you want to delete this record?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default StaffAttendanceTable;