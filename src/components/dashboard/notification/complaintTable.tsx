"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SearchX,
  Download,
  Printer,
  Eye,
  X,
  CalendarDays,
  UserCircle,
  ShieldAlert,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  ScanSearch,
  BadgeCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import ConfirmModal from "../../delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import { ComplaintServices } from "@/services/notificationServices";
import ComplaintDetailModal from "@/components/ui/complaintModel";
import NepaliDate from "nepali-date-converter";

// ── Types ────────────────────────────────────────────────────────────────────
type ComplaintStatus = "pending" | "in_review" | "resolved" | "rejected";

interface Complaint {
  id: number;
  school: number;
  raised_by: number | null;
  student_enrollment: number | null;
  teacher: number | null;
  parent: number | null;
  staff: number | null;
  subject: string;
  message: string;
  status: ComplaintStatus;
  response: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  // optional populated fields your API may return
  raised_by_email?: string;
  reviewed_by_email?: string;
  created_at?: string;
}

interface ComplaintTableProps {
  onEdit: (complaint: Complaint) => void;
  refreshTrigger: number;
  searchQuery?: string;
}


const convertADtoBS = (adDateString: string): string => {
  if (!adDateString) return "N/A";
  try {
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

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; icon: React.ReactNode; textCls: string; bgCls: string }
> = {
  pending: {
    label: "Pending",
    icon: <Clock size={10} />,
    textCls: "text-amber-600",
    bgCls: "bg-amber-50",
  },
  in_review: {
    label: "In Review",
    icon: <ScanSearch size={10} />,
    textCls: "text-blue-600",
    bgCls: "bg-blue-50",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle2 size={10} />,
    textCls: "text-emerald-600",
    bgCls: "bg-emerald-50",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle size={10} />,
    textCls: "text-rose-600",
    bgCls: "bg-rose-50",
  },
};

// ── Helper: who raised the complaint ─────────────────────────────────────────
const resolveRaisedBy = (complaint: Complaint): string => {
  if (complaint.raised_by_email) return complaint.raised_by_email;
  if (complaint.student_enrollment) return `Student #${complaint.student_enrollment}`;
  if (complaint.teacher) return `Teacher #${complaint.teacher}`;
  if (complaint.parent) return `Parent #${complaint.parent}`;
  if (complaint.staff) return `Staff #${complaint.staff}`;
  if (complaint.raised_by) return `User #${complaint.raised_by}`;
  return "N/A";
};


// ── Main Table ────────────────────────────────────────────────────────────────
const ComplaintTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: ComplaintTableProps) => {
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [filteredData, setFilteredData] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailModal, setDetailModal] = useState<Complaint | null>(null);
   const formatToNepaliBS = (adDateString: string) => {
    return convertADtoBS(adDateString);
  };

  // --- Fetch ---
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await ComplaintServices.getAllComplaints();
      const all: Complaint[] = Array.isArray(res)
        ? res
        : res?.results || res?.data || [];
      setComplaintsList([...all].reverse());
    } catch {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [refreshTrigger]);

  // --- Filter ---
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const result = complaintsList.filter(
      (c) =>
        c.subject.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        (c.raised_by_email || "").toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
    );
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, complaintsList]);

  // --- Pagination ---
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // --- PDF ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Complaint Report", 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Page: ${currentPage} | Date: ${new Date().toLocaleDateString()}`,
      14,
      22
    );
    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.subject,
      resolveRaisedBy(item),
      item.status,
      item.response ? "Yes" : "No",
      item.reviewed_at
        ? formatToNepaliBS(item.reviewed_at)
        : "—",
    ]);
    autoTable(doc, {
      head: [["S.N.", "Subject", "Raised By", "Status", "Responded", "Reviewed At"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Complaint_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  // --- Print ---
  const handlePrint = () => {
    const printContent = paginatedItems
      .map(
        (item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.subject}</td>
        <td>${resolveRaisedBy(item)}</td>
        <td>${item.status}</td>
        <td>${item.response ? "Yes" : "No"}</td>
        <td>${item.reviewed_at ? formatToNepaliBS(item.reviewed_at) : "—"}</td>
      </tr>
    `
      )
      .join("");
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Complaint List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
              h2 { color: #1e293b; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Complaint List</h2>
            <div>Generated for Page ${currentPage} | Total: ${filteredData.length}</div>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th><th>Subject</th><th>Raised By</th>
                  <th>Status</th><th>Responded</th><th>Reviewed At</th>
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

  // --- Selection ---
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((item) => item.id));
    }
  };
  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // --- Delete ---
  const handleConfirmDelete = async () => {
    const idsToDelete =
      selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    if (idsToDelete.length === 0) return;
    try {
      setDeleteLoading(true);
      await Promise.all(
        idsToDelete.map((id) => ComplaintServices.deleteComplaint(id))
      );
      toast.success(`${idsToDelete.length} complaint(s) deleted`);
      setComplaintsList((prev) =>
        prev.filter((item) => !idsToDelete.includes(item.id))
      );
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to delete complaint");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      {/* Detail / Message Modal */}
      {detailModal && (
        <ComplaintDetailModal
          complaint={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}

      <div className="space-y-3">
        {/* Table Container */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[395px] scrollbar-hide relative">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-30 shadow-sm">
                <tr className="bg-[#f5f6fa]">
                  <th className="px-4 py-1 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 cursor-pointer"
                      checked={
                        selectedIds.length === paginatedItems.length &&
                        paginatedItems.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">S.N.</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Complaint Info</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Raised By</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Status</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Reviewed</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Details</th>
                  <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <TableLoadingSkeleton rows={5} cols={8} />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        {searchQuery ? (
                          <SearchX size={32} className="text-rose-300" />
                        ) : (
                          <Inbox size={32} className="text-gray-200" />
                        )}
                        <span className="text-sm font-bold text-[#364a63]">
                          {searchQuery
                            ? "No matching complaints found."
                            : "No complaints submitted yet."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, index) => {
                    const isSelected = selectedIds.includes(item.id);
                    const statusCfg =
                      STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-1">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleSelectOne(item.id)}
                          />
                        </td>

                        {/* S.N. */}
                        <td className="px-6 py-1 text-[10px] text-[#526484]">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </td>

                        {/* Complaint Info — subject + school id */}
                        <td className="px-6 py-1">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#364a63] font-bold uppercase">
                              {item.subject}
                            </span>
                            <span className="text-[10px] text-[#8094ae] flex items-center gap-1">
                              <ShieldAlert size={10} /> School #{item.school}
                            </span>
                          </div>
                        </td>

                        {/* Raised By */}
                        <td className="px-6 py-1">
                          <div className="flex items-center gap-1.5">
                            <UserCircle size={12} className="text-[#8094ae]" />
                            <span className="text-[11px] text-[#526484] font-medium">
                              {resolveRaisedBy(item)}
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.bgCls} ${statusCfg.textCls}`}
                          >
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Reviewed */}
                        <td className="px-6 py-1">
                          <div className="flex flex-col gap-0.5">
                            {item.reviewed_by_email ? (
                              <span className="text-[10px] text-[#526484] flex items-center gap-1">
                                <UserCheck size={10} className="text-[#8094ae]" />
                                {item.reviewed_by_email}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#8094ae] italic">
                                Not reviewed
                              </span>
                            )}
                            {item.reviewed_at && (
                              <span className="text-[10px] text-[#8094ae] flex items-center gap-1">
                                <CalendarDays size={10} />
                                {formatToNepaliBS(item.reviewed_at)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* View Message/Response button */}
                        <td className="px-6 py-1">
                          <button
                            onClick={() => setDetailModal(item)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-[#364a63] bg-[#364a63]/10 hover:bg-[#364a63]/20 rounded-full border border-[#364a63]/10 active:scale-95 transition-all"
                          >
                            <Eye size={10} />
                            View
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-1 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all"
                            >
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
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredData.length)} of{" "}
                  {filteredData.length}
                </span>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 active:scale-95 transition-all"
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
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-bold px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1 disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Delete Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {selectedIds.length} Complaints Selected
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
          title={
            selectedIds.length > 0
              ? "Delete Selected Complaints?"
              : "Remove Complaint?"
          }
          message={
            selectedIds.length > 0
              ? `Are you sure you want to delete ${selectedIds.length} complaint(s)?`
              : "Are you sure you want to delete this complaint? This action cannot be undone."
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsModalOpen(false);
            setDeleteId(null);
          }}
          loading={deleteLoading}
        />
      </div>
    </>
  );
};

export default ComplaintTable;