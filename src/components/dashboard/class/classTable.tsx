"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SearchX,
  Layers,
  CalendarDays,
  Download,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { ClassServices } from "@/services/classServices";
import ConfirmModal from "../../delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";

// Interface updated to handle both nested session object and flat session_name
interface ClassRoom {
  _id: string | number;
  id?: string | number;
  name: string;
  session_name?: string; 
  session?: {
    _id: string;
    name: string;
  };
}

interface ClassTableProps {
  onEdit: (classObj: ClassRoom) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 15;

const ClassTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: ClassTableProps) => {
  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [filteredData, setFilteredData] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await ClassServices.getAllClasses();
      // Handle different API response structures
      const results = Array.isArray(res) ? res : res?.results || res?.data || [];
      setClassList([...results].reverse());
    } catch (error) {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [refreshTrigger]);

  useEffect(() => {
    let result = classList.filter((c) => {
      const name = (c.name || "").toLowerCase();
      // Logic to check session_name first, then nested session.name
      const sessionName = (c.session_name || c.session?.name || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      return name.includes(query) || sessionName.includes(query);
    });
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, classList]);

  // --- Pagination Logic ---
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // --- Export Logic ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Class List Report", 14, 15);
    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.name || "N/A",
      item.session_name || item.session?.name || "N/A",
    ]);
    autoTable(doc, {
      head: [["S.N.", "Class Name", "Academic Session"]],
      body: tableData,
      startY: 25,
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Class_Report.pdf`);
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.name}</td>
        <td>${item.session_name || item.session?.name || "N/A"}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    printWindow?.document.write(`
      <html>
        <head>
          <title>Print Class List</title>
          <style>
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-family: sans-serif; font-size: 12px; }
            th { background-color: #f5f6fa; color: #364a63; }
            h2 { font-family: sans-serif; color: #364a63; text-align: center; }
          </style>
        </head>
        <body>
          <h2>Class Management Report</h2>
          <table>
            <thead>
              <tr><th>S.N.</th><th>Class Name</th><th>Session</th></tr>
            </thead>
            <tbody>${printContent}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  // --- Selection Logic ---
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((item) => (item._id || item.id)!));
    }
  };

  const handleSelectOne = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // --- Delete Execution ---
  const handleConfirmDelete = async () => {
    const idsToDelete = selectedIds.length > 0 ? selectedIds : (deleteId ? [deleteId] : []);
    try {
      setDeleteLoading(true);
      await Promise.all(idsToDelete.map((id) => ClassServices.deleteClass(id)));
      toast.success(`${idsToDelete.length} record(s) deleted successfully`);
      fetchClasses();
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Failed to delete records");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[420px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-2 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 cursor-pointer shadow-sm"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">S.N.</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">Class Name</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">Academic Session</th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase tracking-wider text-right w-28">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={8} cols={5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      {searchQuery ? <SearchX size={40} className="text-rose-300" /> : <Inbox size={40} className="text-gray-200" />}
                      <div className="text-center">
                         <p className="text-sm font-bold text-[#364a63]">
                          {searchQuery ? "No matching classes found" : "No classes registered yet"}
                        </p>
                        <p className="text-[11px] text-[#8094ae]">Try adjusting your search or adding a new class.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const itemId = (item._id || item.id)!;
                  const isSelected = selectedIds.includes(itemId);
                  return (
                    <tr key={itemId} className={`hover:bg-gray-50/80 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectOne(itemId)}
                        />
                      </td>
                      <td className="px-6 py-2 text-[11px] font-medium text-[#526484]">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-100 text-slate-500">
                            <Layers size={13} />
                          </div>
                          <span className="text-[11px] text-[#364a63] font-bold uppercase">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2 text-[#526484]">
                          <CalendarDays size={14} className="text-[#8094ae]" />
                          <span className="text-[11px] font-semibold">
                            {item.session_name || item.session?.name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => onEdit(item)} 
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md active:scale-90 transition-all"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            onClick={() => { setSelectedIds([]); setDeleteId(itemId); setIsModalOpen(true); }} 
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md active:scale-90 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={13} />
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

        {/* Custom Pagination & Export Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-2 border-t bg-[#f5f6fa] gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-[#8094ae]">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={downloadPDF} 
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <Download size={12} /> PDF
                </button>
                <ThemedButton 
                  onClick={handlePrint} 
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-white bg-slate-700 border border-slate-800 rounded shadow-sm hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <Printer size={12} /> Print
                </ThemedButton>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} 
                disabled={currentPage === 1} 
                className="p-1.5 rounded bg-white border border-gray-200 disabled:opacity-30 shadow-sm hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="bg-white border border-gray-200 px-3 py-1 rounded shadow-sm">
                 <span className="text-[11px] font-bold text-[#364a63]">{currentPage} / {totalPages}</span>
              </div>
              <button 
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages} 
                className="p-1.5 rounded bg-white border border-gray-200 disabled:opacity-30 shadow-sm hover:bg-gray-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
              {selectedIds.length} Classes Selected for deletion
            </span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded text-[11px] font-bold hover:bg-red-700 active:scale-95 transition-all shadow-md"
          >
            <Trash2 size={13} /> Delete All Selected
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? `Delete ${selectedIds.length} Classes?` : "Remove Class?"}
        message="This action is permanent and will remove all selected class records from the session."
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ClassTable;