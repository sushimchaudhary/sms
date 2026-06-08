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
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import ConfirmModal from "../../delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import { QuestionPaperServices } from "@/services/questionpaperServices";

interface QuestionPaper {
  id: string | number;
  title: string;
  subject_name_display: string | null; // अब यो String को रूपमा आइरहेको छ
  class_name: string | null;    // अब यो String को रूपमा आइरहेको छ
  full_marks: number;
  status: 'draft' | 'final';
}

interface PaperTampleteTableProps {
  onEdit: (paper: QuestionPaper) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 15;

const PaperTampleteTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: PaperTampleteTableProps) => {
  const [paperList, setPaperList] = useState<QuestionPaper[]>([]);
  const [filteredData, setFilteredData] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await QuestionPaperServices.getAllPapers();
      const results = Array.isArray(res) ? res : res?.results || [];
      setPaperList([...results].reverse());
    } catch {
      toast.error("Failed to load question papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [refreshTrigger]);

useEffect(() => {
  const query = searchQuery.toLowerCase();
  const result = paperList.filter((p) => 
    p.title.toLowerCase().includes(query) || 
    p.subject_name_display?.toLowerCase().includes(query) ||
    p.class_name?.toLowerCase().includes(query)
  );
  setFilteredData(result);
  setCurrentPage(1);
  setSelectedIds([]);
}, [searchQuery, paperList]);

  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // --- Export & Print ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Question Papers Report", 14, 15);
    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.title,
      item.subject_name_display || "-",
      item.class_name || "-",
      item.full_marks,
      item.status.toUpperCase(),
    ]);
    autoTable(doc, {
      head: [["S.N.", "Title", "Subject", "Class", "Marks", "Status"]],
      body: tableData,
      startY: 20,
    });
    doc.save("Question_Papers_Report.pdf");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.title}</td>
        <td>${item.subject_name_display || "-"}</td>
        <td>${item.class_name || "-"}</td>
        <td>${item.full_marks}</td>
        <td>${item.status.toUpperCase()}</td>
      </tr>
    `).join("");
    const win = window.open("", "_blank");
    win?.document.write(`<html><body><style>table{width:100%; border-collapse:collapse;} td,th{border:1px solid #ccc; padding:8px;}</style><table>${printContent}</table></body></html>`);
    win?.print();
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === paginatedItems.length ? [] : paginatedItems.map(i => i.id));
  };

  const handleConfirmDelete = async () => {
    const idsToDelete = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(idsToDelete.map((id) => QuestionPaperServices.deletePaper(id)));
      toast.success("Deleted successfully");
      fetchPapers();
      setIsModalOpen(false);
      setSelectedIds([]);
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-3">
     

      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left">
            <thead className="bg-[#f5f6fa]">
              <tr>
                <th className="px-4 py-2"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0} /></th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">S.N.</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Title</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Subject</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Class</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Marks</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Status</th>
                <th className="px-4 py-2 text-right text-[11px] font-bold text-[#8094ae] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <TableLoadingSkeleton rows={8} cols={8} /> : paginatedItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])} /></td>
                  <td className="px-6 py-2 text-[11px] text-[#526484]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td className="px-6 py-2 font-bold text-[11px]">{item.title}</td>
                  <td className="px-6 py-2 text-[11px]">{item.subject_name_display || "N/A"}</td>
                  <td className="px-6 py-2 text-[11px]">{item.class_name || "N/A"}</td>
                  <td className="px-6 py-2 text-[11px]">{item.full_marks}</td>
                  <td className="px-6 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => onEdit(item)} className="p-1 text-blue-500"><Pencil size={12} /></button>
                    <button onClick={() => { setDeleteId(item.id); setIsModalOpen(true); }} className="p-1 text-red-500"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
 {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2 border-t bg-[#f5f6fa]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-2">Showing {Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}</span>
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
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  {selectedIds.length} Schools Selected
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
        title="Confirm Delete"
        message="Are you sure you want to delete this item?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default PaperTampleteTable;