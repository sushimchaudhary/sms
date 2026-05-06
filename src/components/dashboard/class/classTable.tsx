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

  // --- Fetch ---
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await ClassServices.getAllClasses();
      const results = Array.isArray(res)
        ? res
        : res?.results || res?.data || [];
      setClassList([...results].reverse());
    } catch {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [refreshTrigger]);

  // --- Filter ---
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const result = classList.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const sessionName = (
        c.session_name ||
        c.session?.name ||
        ""
      ).toLowerCase();
      return name.includes(query) || sessionName.includes(query);
    });
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, classList]);

  // --- Pagination ---
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // --- Selection ---
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((item) => (item._id || item.id)!));
    }
  };

  const handleSelectOne = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // --- Delete (bulk + single) ---
  const handleConfirmDelete = async () => {
    const idsToDelete =
      selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    if (idsToDelete.length === 0) return;

    try {
      setDeleteLoading(true);
      await Promise.all(idsToDelete.map((id) => ClassServices.deleteClass(id)));
      toast.success(`${idsToDelete.length} record(s) deleted successfully`);
      fetchClasses();
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to delete records");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // --- Export PDF ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
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
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Class_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded");
  };

  // --- Print ---
  const handlePrint = () => {
    const printContent = paginatedItems
      .map(
        (item, index) => `
        <tr>
          <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
          <td>${item.name}</td>
          <td>${item.session_name || item.session?.name || "N/A"}</td>
        </tr>
      `,
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Class List</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
              th { background-color: #f8fafc; color: #364a63; }
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
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[420px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 cursor-pointer shadow-sm"
                    checked={
                      selectedIds.length === paginatedItems.length &&
                      paginatedItems.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
                  S.N.
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
                  Academic Session
                </th>
                <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase tracking-wider text-right w-28">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={8} cols={5} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      {searchQuery ? (
                        <SearchX size={40} className="text-rose-300" />
                      ) : (
                        <Inbox size={40} className="text-gray-200" />
                      )}
                      <div className="text-center">
                        <p className="text-sm font-bold text-[#364a63]">
                          {searchQuery
                            ? "No matching classes found"
                            : "No classes registered yet"}
                        </p>
                        <p className="text-[11px] text-[#8094ae]">
                          Try adjusting your search or adding a new class.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const itemId = (item._id || item.id)!;
                  const isSelected = selectedIds.includes(itemId);
                  return (
                    <tr
                      key={itemId}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-1 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectOne(itemId)}
                        />
                      </td>

                      {/* S.N. */}
                      <td className="px-6 py-1 text-[10px] text-[#526484]">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}.
                      </td>

                      {/* Class Name */}
                      <td className="px-6 py-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-100 text-slate-500">
                            <Layers size={13} />
                          </div>
                          <span className="text-[11px] text-[#364a63] font-bold uppercase">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Academic Session */}
                      <td className="px-6 py-1">
                        <div className="flex items-center gap-2 text-[#526484]">
                          <CalendarDays size={13} className="text-[#8094ae]" />
                          <span className="text-[11px] font-semibold">
                            {item.session_name || item.session?.name || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIds([]);
                              setDeleteId(itemId);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all"
                            title="Delete"
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

        {/* Footer: count + PDF/Print + pagination */}
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        title={
          selectedIds.length > 0
            ? `Delete ${selectedIds.length} Classes?`
            : "Remove Class?"
        }
        message="This action is permanent and will remove all selected class records from the session."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsModalOpen(false);
          setDeleteId(null);
        }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ClassTable;
