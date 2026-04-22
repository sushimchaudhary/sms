"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SearchX,
  BookOpen,
  Download,
  Printer,
  School,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import ConfirmModal from "../../delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import { SubjectServices } from "@/services/subjectServices";

interface Subject {
  id: number;
  name: string;
  school_name: string;
  school: number;
}

interface SubjectTableProps {
  onEdit: (subject: Subject) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const SubjectTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: SubjectTableProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredData, setFilteredData] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- Fetching Data ---
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await SubjectServices.getAllSubjects();
      const data = Array.isArray(res) ? res : res?.results || res?.data || [];
      setSubjects([...data].reverse());
    } catch (error) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [refreshTrigger]);

  // --- Search Filtering ---
  useEffect(() => {
    let result = subjects.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query);
    });
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, subjects]);

  // --- Pagination ---
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // --- Export & Print Logic ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Subject List Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.id,
      item.name,
      item.school_name || "N/A",
    ]);

    autoTable(doc, {
      head: [["S.N.", "ID", "Subject Name", "Institution"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [54, 74, 99] },
    });

    doc.save(`Subject_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.school_name || "N/A"}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Subject List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 11px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
              h2 { color: #1e293b; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Subject List</h2>
            <div>Generated for Page ${currentPage}</div>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>ID</th>
                  <th>Subject Name</th>
                  <th>Institution</th>
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

  // --- Delete Logic ---
  const handleConfirmDelete = async () => {
    const idsToDelete = selectedIds.length > 0 ? selectedIds : (deleteId ? [deleteId] : []);
    try {
      setDeleteLoading(true);
      await Promise.all(idsToDelete.map(id => SubjectServices.deleteSubject(id)));
      toast.success("Subject(s) removed successfully");
      setSubjects(prev => prev.filter(item => !idsToDelete.includes(item.id)));
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Failed to delete subject");
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
                <th className="px-4 py-1 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={() => setSelectedIds(selectedIds.length === paginatedItems.length ? [] : paginatedItems.map(i => i.id))}
                  />
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Subject Info</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Institution</th>
                <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={4} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">No subjects found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? "bg-blue-50/40" : ""}`}>
                    <td className="px-4 py-1">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                      />
                    </td>
                    <td className="px-6 py-1">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#364a63] font-bold uppercase flex items-center gap-2">
                          <BookOpen size={13} className="text-indigo-500" />
                          {item.name}
                        </span>
                        {/* <span className="text-[10px] text-[#8094ae] flex items-center gap-1 pl-5">
                          <Hash size={10} /> ID: {item.id}
                        </span> */}
                      </div>
                    </td>
                    <td className="px-6 py-1">
                      <div className="flex items-center gap-2 text-[#526484]">
                        <School size={14} className="text-slate-400" />
                        <span className="text-[11px]">{item.school_name || "N/A"}</span>
                      </div>
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

        {/* Footer with PDF/Print */}
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

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{selectedIds.length} Subjects Selected</span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 active:scale-95 transition-all shadow-sm">
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Selected Subjects?" : "Delete Subject?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} subject records?` : "Are you sure you want to remove this subject? It might be linked to classes or exams."}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SubjectTable;