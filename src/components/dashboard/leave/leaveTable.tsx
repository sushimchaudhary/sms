"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Inbox,
  SearchX,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import ConfirmModal from "@/components/delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { LeaveServices } from "@/services/leaveServices"; // Ensure this service exists
import { ThemedButton } from "@/components/ui/themedButton";
import useAuth from "@/lib/hooks/useAuth";

interface Leave {
  id: number;
  user?: { id: number; name: string };
  student?: number;
  teacher?: number; 
  student_name?: string;
  teacher_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  is_half_day: boolean;
  attachment?: string;
  created_at: string;
}

interface LeaveTableProps {
  onEdit: (data: Leave) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const LeaveTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: LeaveTableProps) => {
  const [list, setList] = useState<Leave[]>([]);
  const [filteredData, setFilteredData] = useState<Leave[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Table को माथि useAuth इम्पोर्ट र डिक्लेयर गर्नुहोस्
const { loggedInUser } = useAuth(); 

const fetchLeaves = async () => {
  try {
    setLoading(true);
    const res = await LeaveServices.getAllLeaves();
    const allData = Array.isArray(res) ? res : res?.results || res?.data || [];
    
    // --- Role Based Filtering Logic ---
    let filteredByRole = [...allData];

    if (loggedInUser?.role === "admin" || loggedInUser?.role === "superadmin") {
      // Admin ले सबैको (Teacher, Student, Staff) देख्न पाउँछ
      filteredByRole = allData;
    } 
    else if (loggedInUser?.role === "teacher") {
      // Teacher ले आफ्नो र Student हरूको मात्र देख्न पाउँछ
      filteredByRole = allData.filter((item: Leave) => 
        item.teacher_name || item.student_name // यदि staff को पनि छ भने staff बाहेक अरु फिल्टर गर्ने
      );
    } 
    else if (loggedInUser?.role === "student") {
      // Student ले आफ्नो मात्र देख्न पाउँछ (यहाँ unique ID match गराउनुपर्छ)
      // नोट: backend बाट आउने data मा user_id वा student_id हुनुपर्छ
      filteredByRole = allData.filter((item: Leave) => 
        item.student === loggedInUser?._id || item.user?.id === loggedInUser?._id
      );
    }

    setList(filteredByRole.reverse());
    // ----------------------------------
    
  } catch (error) {
    toast.error("Failed to load leave requests");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchLeaves();
  }, [refreshTrigger]);

  useEffect(() => {
    const result = list.filter((item) => {
      const query = searchQuery.toLowerCase();
      const name = (item.student_name || item.teacher_name || "").toLowerCase();
      return (
        name.includes(query) ||
        item.leave_type?.toLowerCase().includes(query) ||
        item.reason?.toLowerCase().includes(query)
      );
    });
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, list]);

  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // --- Export & Print Logic ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Leave Request Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${dayjs().format("DD MMM, YYYY")}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.student_name || item.teacher_name || "N/A",
      item.leave_type.toUpperCase(),
      `${dayjs(item.start_date).format("DD MMM")} - ${dayjs(item.end_date).format("DD MMM, YYYY")}`,
      item.status.toUpperCase(),
    ]);

    autoTable(doc, {
      head: [["S.N.", "Name", "Type", "Duration", "Status"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Leave_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.student_name || item.teacher_name || "N/A"}</td>
        <td>${item.leave_type}</td>
        <td>${dayjs(item.start_date).format("DD MMM")} to ${dayjs(item.end_date).format("DD MMM, YYYY")}</td>
        <td>${item.status}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Leave List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
              h2 { color: #1e293b; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Leave Request Report</h2>
            <div>Generated for Page ${currentPage} | Total Records: ${filteredData.length}</div>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Status</th>
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

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => LeaveServices.deleteLeave(id)));
      toast.success(`${ids.length} records deleted successfully`);
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

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-3 font-mukta">
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
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">S.N.</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Applicant Info</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Type & Reason</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Duration</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Status</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Application</th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24 border-b">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={8} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery ? "No matching leave records found." : "No leave requests recorded."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
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
                      <td className="px-6 py-2 text-[10px] text-[#526484]">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase flex items-center gap-1">
                            <User size={10} className="text-blue-500" />
                            {item.student_name || item.teacher_name || "Unknown"}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            Applied: {dayjs(item.created_at).format("DD MMM, YYYY")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">
                              {item.leave_type}
                            </span>
                            {item.is_half_day && (
                              <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-bold rounded uppercase border border-orange-100">
                                Half Day
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 italic line-clamp-1 mt-0.5">
                            {item.reason}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col text-[10px] text-slate-600 font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar size={10} className="text-rose-400" />
                            {dayjs(item.start_date).format("DD MMM")} - {dayjs(item.end_date).format("DD MMM")}
                          </div>
                          <span className="text-[9px] text-slate-400 ml-3.5">
                            {dayjs(item.end_date).diff(dayjs(item.start_date), 'day') + 1} Day(s)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        {item.attachment ? (
                          <a href={item.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold hover:bg-green-100 transition-all">
                            <Download size={11} /> View File
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-300">No File</span>
                        )}
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

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 px-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{selectedIds.length} Requests Selected</span>
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
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} leave records?` : "This action cannot be undone. Are you sure you want to delete this leave request?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default LeaveTable;