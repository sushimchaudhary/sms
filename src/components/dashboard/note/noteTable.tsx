"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Inbox,
  SearchX,
  Calendar,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Layers,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import ConfirmModal from "../../delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { ThemedButton } from "@/components/ui/themedButton";
import { NotesServices } from "@/services/noteServices";
import NepaliDate from "nepali-date-converter";



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

export default function NotesTable({ onEdit, refreshTrigger, searchQuery = "" }: any) {
  const [notesList, setNotesList] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


     const formatToNepaliBS = (adDateString: string) => {
    return convertADtoBS(adDateString);
  };
  // ── Fetch Logic ──────────────────────────────────────────────────────────
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await NotesServices.getAllNotes();
      const data = Array.isArray(res) ? res : res?.results || res?.data || [];
      setNotesList([...data].reverse());
    } catch (error) {
      toast.error("Failed to load study notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [refreshTrigger]);

  // ── Search & Selection Reset ─────────────────────────────────────────────
  useEffect(() => {
    let result = [...notesList];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((n) =>
        n.title?.toLowerCase().includes(query) ||
        n.class_name?.toLowerCase().includes(query) ||
        n.subject_name?.toLowerCase().includes(query)
      );
    }
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, notesList]);

  const paginatedItems = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // ── Export & Print ───────────────────────────────────────────────────────
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Study Notes Inventory", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${dayjs().format("DD MMM, YYYY")}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.title,
      `${item.class_name} (${item.section_name})`,
      item.subject_name,
      item.uploaded_at ? formatToNepaliBS(item.uploaded_at) : "N/A",
    ]);

    autoTable(doc, {
      head: [["S.N.", "Title", "Class (Sec)", "Subject", "Uploaded At"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });

    doc.save(`Notes_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.title}</td>
        <td>${item.class_name} (${item.section_name})</td>
        <td>${item.subject_name}</td>
        <td>${item.uploaded_at ? formatToNepaliBS(item.uploaded_at) : "N/A"}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Study Notes Print</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
              th { background-color: #f4f4f4; text-transform: uppercase; color: #444; }
            </style>
          </head>
          <body>
            <h2 style="text-align:center">Student Study Materials / Notes</h2>
            <table>
              <thead><tr><th>S.N.</th><th>Title</th><th>Class (Sec)</th><th>Subject</th><th>Date</th></tr></thead>
              <tbody>${printContent}</tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ── Delete Handlers ──────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    const idsToDelete = selectedIds.length > 0 ? selectedIds : (deleteId ? [deleteId] : []);
    try {
      setDeleteLoading(true);
      await Promise.all(idsToDelete.map(id => NotesServices.deleteNotes(id)));
      toast.success("Notes removed successfully");
      fetchNotes();
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Failed to delete notes");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3 font-mukta">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 border-b">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={() => setSelectedIds(selectedIds.length === paginatedItems.length ? [] : paginatedItems.map(i => i.id))}
                  />
                </th>
                {/* ADDED S.N. COLUMN */}
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">S.N.</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Notes Info</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Academic Details</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Subject</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Uploaded Date</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">File</th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24 border-b">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={8} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      {searchQuery ? <SearchX size={32} /> : <Inbox size={32} />}
                      <span className="text-sm font-bold">No Study Materials Found</span>
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
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                        />
                      </td>

                      {/* S.N. CELL CALCULATION */}
                      <td className="px-6 py-2 text-[10px] text-[#526484]">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>

                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-[#364a63] uppercase line-clamp-1">{item.title}</span>
                          <span className="text-[10px] text-gray-400 italic">Material ID: #{item.id}</span>
                        </div>
                      </td>

                       <td className="px-6 py-2">
                                              <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 px-2 py-0.5 uppercase  text-blue-600 text-[10px] font-bold">
                                                  <GraduationCap size={10} />Cl : {item.class_name}
                                                </div>
                                                <div className="px-2 py-0.5  text-purple-600 uppercase  text-[10px] font-bold">
                                                  SEC : {item.section_name}
                                                </div>
                                              </div>
                                            </td>

                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2 text-[#526484]">
                          <BookOpen size={13} className="text-cyan-500" />
                          <span className="text-[11px] font-medium capitalize">{item.subject_name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2 text-[#526484]">
                          <Calendar size={13} className="text-slate-400" />
                          <span className="text-[11px]">
                            {item.uploaded_at ? formatToNepaliBS(item.uploaded_at) : "N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-2">
                        {item.file ? (
                          <a href={item.file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold hover:bg-green-100 transition-all">
                            <Download size={11} /> View PDF
                          </a>
                        ) : <span className="text-[10px] text-gray-300">No Attachment</span>}
                      </td>

                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all"><Pencil size={12} /></button>
                          <button onClick={() => { setSelectedIds([]); setDeleteId(item.id); setIsModalOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1 border-t bg-[#f5f6fa]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-2">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </span>
              <button onClick={downloadPDF} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 active:scale-95 transition-all">
                <Download size={12} /> PDF 
              </button>
              <ThemedButton onClick={handlePrint} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-white bg-slate-600 rounded active:scale-95 transition-all">
                <Printer size={12} /> Print 
              </ThemedButton>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-bold text-red-600 uppercase ml-2">{selectedIds.length} Materials Selected</span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 active:scale-95 transition-all shadow-sm">
            <Trash2 size={12} /> Delete All
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Multiple Notes?" : "Remove Study Note?"}
        message={selectedIds.length > 0 ? `Are you sure you want to permanently delete these ${selectedIds.length} items?` : "Are you sure you want to delete this study material?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
}