"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Tag,
  IndianRupee,
  CalendarClock,
  Download,
  Printer,
  Inbox,
  SearchX,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import ConfirmModal from "@/components/delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import { FeeServices } from "@/services/feeServices";

interface Expense {
  id: string | number;
  title: string;
  expense_type: string;
  amount: number | string;
  date: string;
  session_name?: string;
  session: number | string;
  school: number | string;
}

interface ExpenseTableProps {
  onEdit: (data: Expense) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const ExpenseTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: ExpenseTableProps) => {
  const [list, setList] = useState<Expense[]>([]);
  const [filteredData, setFilteredData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await FeeServices.getAllExpenses();
      const allData = Array.isArray(res) ? res : res?.results || [];
      setList([...allData].reverse());
    } catch (error) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  useEffect(() => {
    const result = list.filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.title?.toLowerCase().includes(query) ||
        item.expense_type?.toLowerCase().includes(query)
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
    doc.text("Expense Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.title,
      item.expense_type,
      `Rs. ${item.amount}`,
      item.date,
    ]);

    autoTable(doc, {
      head: [["S.N.", "Title", "Type", "Amount", "Date"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Expense_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.title}</td>
        <td>${item.expense_type}</td>
        <td>Rs. ${item.amount}</td>
        <td>${item.date}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Expense List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
              h2 { color: #1e293b; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Expense Report</h2>
            <div>Generated for Page ${currentPage} | Total Records: ${filteredData.length}</div>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Amount</th>
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
      await Promise.all(ids.map((id) => FeeServices.deleteExpense(id)));
      toast.success(`${ids.length} records deleted successfully`);
      fetchExpenses();
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
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Expense Details</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Category & Session</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Amount</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Date</th>
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
                        {searchQuery ? "No matching expenses found." : "No expenses recorded."}
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
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 rounded">
                            <Receipt size={13} className="text-blue-600" />
                          </div>
                          <span className="text-[11px] text-[#364a63] font-bold uppercase tracking-tight">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-700 font-bold uppercase flex items-center gap-1">
                            <Tag size={10} className="text-indigo-500" /> {item.expense_type || 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Landmark size={9} /> {item.session_name || item.session}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                          <IndianRupee size={10} /> {item.amount}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">
                          <CalendarClock size={11} /> {item.date}
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
        title={selectedIds.length > 0 ? "Delete Multiple Records?" : "Remove Expense Record?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} expense records?` : "This action cannot be undone. Are you sure you want to delete this expense?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ExpenseTable;