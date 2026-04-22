"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SearchX,
  GraduationCap,
  Download,
  Printer,
  Fingerprint,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import ConfirmModal from "../../delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import { EnrollmentServices } from "@/services/studentEnrollment";

interface Enrollment {
  id: number;
  student_name: string;
  student_id: string;
  class_name: string;
  section_name: string;
  session_name: string;
  school_name: string;
  enrollment_date: string;
  is_active: boolean;
  enrollment_code: string;
  roll_number: string | number | null;
  student: number;
  school: number;
  session: number;
  class_assigned: number;
  section: number;
}

interface EnrollmentTableProps {
  onEdit: (enrollment: Enrollment) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const StudentEnrollmentTable: React.FC<EnrollmentTableProps> = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: EnrollmentTableProps) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredData, setFilteredData] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await EnrollmentServices.getAllEnrollments();
      const data = Array.isArray(res) ? res : res?.results || res?.data || [];
      setEnrollments([...data].reverse());
    } catch (error) {
      toast.error("Failed to load enrollment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [refreshTrigger]);

  useEffect(() => {
    let result = enrollments.filter((e) => {
      const sName = (e.student_name || "").toLowerCase();
      const sId = (e.student_id || "").toLowerCase();
      const eCode = (e.enrollment_code || "").toLowerCase();
      const rNum = String(e.roll_number || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      return sName.includes(query) || sId.includes(query) || eCode.includes(query) || rNum.includes(query);
    });
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, enrollments]);

  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Student Enrollment Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.roll_number || "-",
      item.student_name,
      item.enrollment_code || "N/A",
      `${item.class_name} (${item.section_name})`,
      item.is_active ? "Active" : "Inactive",
    ]);

    autoTable(doc, {
      head: [["S.N.", "Roll", "Student", "Code", "Class", "Status"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });

    doc.save(`Enrollment_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td><b>${item.roll_number || '-'}</b></td>
        <td>${item.student_name}</td>
        <td>${item.enrollment_code}</td>
        <td>${item.class_name} (${item.section_name})</td>
        <td>${item.is_active ? "Active" : "Inactive"}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Enrollment List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
            </style>
          </head>
          <body>
            <h2>Student Enrollment List</h2>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Enrollment Code</th>
                  <th>Class (Section)</th>
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

  const handleConfirmDelete = async () => {
    const idsToDelete = selectedIds.length > 0 ? selectedIds : (deleteId ? [deleteId] : []);
    try {
      setDeleteLoading(true);
      await Promise.all(idsToDelete.map(id => EnrollmentServices.deleteEnrollment(id)));
      toast.success("Enrollment(s) removed successfully");
      setEnrollments(prev => prev.filter(item => !idsToDelete.includes(item.id)));
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Failed to delete enrollment");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3 font-mukta">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[450px] scrollbar-hide">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={() => setSelectedIds(selectedIds.length === paginatedItems.length ? [] : paginatedItems.map(i => i.id))}
                  />
                </th>
                <th className="px-2 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-center w-12">S.N.</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Student Info</th>
                                <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-center w-26">Roll</th>

                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Enrollment Code</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Academic Details</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-center">Status</th>
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
                      {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">No records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? "bg-blue-50/40" : ""}`}>
                    <td className="px-4 py-1 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                      />
                    </td>

                    <td className="px-2 py-1 text-[11px] font-bold text-[#364a63] text-center">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>

                   

                    <td className="px-6 py-1">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#364a63] font-bold uppercase">{item.student_name}</span>
                        <span className="text-[10px] text-[#8094ae] font-medium">ID: {item.student_id}</span>
                      </div>
                    </td>

                     {/* Dedicated Roll Number Column */}
                    <td className="px-4 py-1 text-center font-bold text-blue-600 text-xs">
                      R.N. {item.roll_number || '-'}
                    </td>

                    <td className="px-6 py-1">
                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px] font-mono font-bold text-slate-600">
                          <Fingerprint size={10} className="text-slate-400" />
                          {item.enrollment_code}
                       </span>
                    </td>

                    <td className="px-6 py-1">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-[#526484]">
                          <GraduationCap size={13} className="text-indigo-500" />
                          Class {item.class_name} ({item.section_name})
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#8094ae]">
                          <Calendar size={11} /> {item.session_name}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-1 text-center">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold border border-green-100">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                          <XCircle size={10} /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-1 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all"><Pencil size={12} /></button>
                        <button onClick={() => { setSelectedIds([]); setDeleteId(item.id); setIsModalOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))
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
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{selectedIds.length} Records Selected</span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 active:scale-95 transition-all shadow-sm">
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}


      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Selected Enrollments?" : "Delete Enrollment?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} enrollment records?` : "Are you sure you want to remove this student enrollment? This action cannot be undone."}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default StudentEnrollmentTable;