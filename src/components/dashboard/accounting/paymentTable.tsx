"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Hash,
  Download,
  Printer,
  Inbox,
  SearchX,
  CreditCard,
  User,
  Clock,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { FeeServices } from "@/services/feeServices";
import ConfirmModal from "@/components/delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import dayjs from "dayjs";

interface Payment {
  id: string | number;
  student_name: string;
  fee_type_name: string;
  amount: string | number;
  payment_method: string;
  paid_at: string;
  received_by_name: string;
}

interface PaymentTableProps {
  onEdit: (data: Payment) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const PaymentTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: PaymentTableProps) => {
  const [list, setList] = useState<Payment[]>([]);
  const [filteredData, setFilteredData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await FeeServices.getAllPayments(); // Payment fetch garne service
      const allData = Array.isArray(res) ? res : res?.results || [];
      setList([...allData].reverse());
    } catch (error) {
      toast.error("Failed to load payment records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [refreshTrigger]);

  useEffect(() => {
    const result = list.filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.student_name?.toLowerCase().includes(query) ||
        item.fee_type_name?.toLowerCase().includes(query) ||
        item.payment_method?.toLowerCase().includes(query)
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
    doc.text("Payment Collection Report", 14, 15);
    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.student_name,
      item.fee_type_name,
      `Rs. ${item.amount}`,
      item.payment_method.toUpperCase(),
      dayjs(item.paid_at).format("YYYY-MM-DD")
    ]);

    autoTable(doc, {
      head: [["S.N.", "Student", "Fee Type", "Amount", "Method", "Date"]],
      body: tableData,
      startY: 25,
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Payments_Report_Page_${currentPage}.pdf`);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const content = paginatedItems.map((item, i) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + i + 1}</td>
        <td>${item.student_name}</td>
        <td>${item.fee_type_name}</td>
        <td>Rs. ${item.amount}</td>
        <td>${item.payment_method.toUpperCase()}</td>
        <td>${dayjs(item.paid_at).format("YYYY-MM-DD HH:mm")}</td>
      </tr>
    `).join("");

    printWindow.document.write(`<html><head><style>table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ddd; padding:8px; text-align:left; font-size:12px;}</style></head><body><h2>Payment History</h2><table><thead><tr><th>S.N.</th><th>Student</th><th>Fee Type</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead><tbody>${content}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) setSelectedIds([]);
    else setSelectedIds(paginatedItems.map((i) => i.id));
  };

  const handleSelectOne = (id: string | number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleConfirmDelete = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => FeeServices.deletePayment(id)));
      toast.success(`${ids.length} records deleted`);
      fetchPayments();
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      toast.error("Delete failed");
    } finally { setDeleteLoading(false); setDeleteId(null); }
  };

  return (
    <div className="space-y-3 font-mukta">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 border-b">
                  <input type="checkbox" checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0} onChange={handleSelectAll} className="rounded border-gray-300 text-blue-600" />
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b">S.N.</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b">Student & Fee Type</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b">Amount</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b">Method</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase border-b">Date</th>
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
                      <span className="text-sm font-bold text-[#364a63]">{searchQuery ? "No matches." : "No payments collected."}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                      <td className="px-4 py-1">
                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(item.id)} className="rounded border-gray-300 text-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-6 py-1 text-[10px] text-[#526484]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-6 py-1">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase">{item.student_name}</span>
                          <span className="text-[10px] text-slate-500 italic">{item.fee_type_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-1 text-[11px] font-bold text-emerald-600">Rs. {Number(item.amount).toLocaleString()}</td>
                      <td className="px-6 py-1">
                         <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                            {item.payment_method}
                         </span>
                      </td>
                      <td className="px-6 py-1">
                        <div className="flex flex-col text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><Calendar size={10}/> {dayjs(item.paid_at).format("MMM DD, YYYY")}</span>
                          <span className="flex items-center gap-1 font-mono"><Clock size={10}/> {dayjs(item.paid_at).format("hh:mm A")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-all"><Pencil size={12} /></button>
                          <button onClick={() => { setSelectedIds([]); setDeleteId(item.id); setIsModalOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-all"><Trash2 size={12} /></button>
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
              <span className="text-[11px] text-[#8094ae]">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}</span>
              <button onClick={downloadPDF} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm"><Download size={12} /> PDF</button>
              <ThemedButton onClick={handlePrint} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-slate-600 border rounded hover:bg-slate-700"><Printer size={12} /> Print</ThemedButton>
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
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{selectedIds.length} Payments Selected</span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold shadow-sm hover:bg-red-600"><Trash2 size={12} /> Delete Selected</button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Multiple Payments?" : "Delete Payment?"}
        message="This will permanently remove the record and cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default PaymentTable;