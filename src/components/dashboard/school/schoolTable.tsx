"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SearchX,
  Mail,
  School,
  Download,
  Printer,
  Fingerprint,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { SchoolServices } from "@/services/schoolServices";
import ConfirmModal from "../../delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import Avatar from "antd/es/avatar/Avatar";
import { ConfigProvider, Select } from "antd";
import { format } from "date-fns"; 
import { Calendar } from "lucide-react";

interface SchoolData {
  id: string | number;
  _id?: string | number;
  name: string;
  code: string;
  address: string;
  email: string;
  phone: string;
  is_active: boolean;
  logo_url?: string | null;
  logo?: string | null;
  created_at?: string;
}

interface SchoolTableProps {
  onEdit: (school: SchoolData) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const SchoolTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: SchoolTableProps) => {
  const [dataList, setDataList] = useState<SchoolData[]>([]);
  const [filteredData, setFilteredData] = useState<SchoolData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  // --- Fetching Data ---
  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await SchoolServices.getDetails();
      const allSchools = Array.isArray(res) ? res : res?.results || res?.data || [];
      setDataList([...allSchools].reverse());
    } catch (error) {
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [refreshTrigger]);

  useEffect(() => {
    let result = dataList.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const code = (s.code || "").toLowerCase();
      const address = (s.address || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      // Search matching
      const matchesSearch = name.includes(query) || email.includes(query) || code.includes(query) || address.includes(query);
      
      // Status matching
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? s.is_active : !s.is_active;

      return matchesSearch && matchesStatus;
    });

    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, statusFilter, dataList]);

  // --- Pagination Logic ---
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // --- Export & Print Logic ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("School List Report", 14, 15);
    
    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.code || "N/A",
      item.name,
      item.address || "N/A",
      item.email || "N/A",
      item.is_active ? "Active" : "Inactive",
    ]);

    autoTable(doc, {
      head: [["S.N.", "Code", "School Name", "Location", "Email", "Status"]],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });

    doc.save(`School_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.code}</td>
        <td>${item.name}</td>
        <td>${item.address}</td>
        <td>${item.email}</td>
        <td>${item.is_active ? "Active" : "Inactive"}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>School List Print</title><style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f8fafc; }
          </style></head>
          <body><h2>School List</h2><table>
            <thead><tr><th>S.N.</th><th>Code</th><th>Name</th><th>Location</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>${printContent}</tbody>
          </table></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // --- Selection & Delete Logic ---
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) setSelectedIds([]);
    else setSelectedIds(paginatedItems.map((item) => (item._id || item.id)!));
  };

  const handleSelectOne = (id: string | number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

const handleConfirmDelete = async () => {
  const idsToDelete = selectedIds.length > 0 ? selectedIds : (deleteId ? [deleteId] : []);
  if (idsToDelete.length === 0) return;

  try {
    setDeleteLoading(true);
    
    await Promise.all(
      idsToDelete.map((id) => SchoolServices.deleteDetails(String(id)))
    );

    toast.success(`${idsToDelete.length} school(s) deleted`);
    
    setDataList((prev) =>
      prev.filter((item) => !idsToDelete.includes(item._id || item.id!))
    );
    setIsModalOpen(false);
    setSelectedIds([]);
  } catch (error: any) {
    console.error("Delete error:", error);

    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.response?.data?.detail ||
      "Failed to delete school. Please try again.";

    toast.error(errorMessage);
  } finally {
    setDeleteLoading(false);
    setDeleteId(null);
  }
};

  return (
    <div className="space-y-3">
      {/* Filter Section */}
      <div className="flex justify-end items-center gap-3">
        <span className="text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">Filter Status:</span>
        <ConfigProvider theme={{ token: { controlHeight: 28, fontSize: 12, borderRadius: 4 } }}>
          <Select value={statusFilter} onChange={(val) => setStatusFilter(val)} style={{ width: 130 }}>
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </ConfigProvider>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[395px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">S.N.</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">School Info</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Contact & Location</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Created At</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Status</th>
                <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={6} cols={7} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery ? "No matching schools found." : "No schools registered."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const itemId = (item._id || item.id)!;
                  const isSelected = selectedIds.includes(itemId);
                  return (
                    <tr key={itemId} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                      <td className="px-4 py-1 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectOne(itemId)}
                        />
                      </td>
                      <td className="px-6 py-1 text-[10px] text-[#526484]">{(currentPage - 1) * PAGE_SIZE + index + 1}.</td>
                      <td className="px-6 py-1">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={item.logo_url || item.logo}
                            icon={!item.logo_url && !item.logo && <School size={14} />}
                            size={32}
                            shape="square"
                            className="border border-gray-100 shadow-sm shrink-0 bg-gray-50 text-blue-600"
                          />
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#364a63] font-bold uppercase">{item.name}</span>
                            <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                              <Fingerprint size={10} /> {item.code || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-1">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#526484] font-medium">
                            <Mail size={10} className="text-gray-400" /> {item.email || "N/A"}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[#8094ae]">
                            <span className="flex items-center gap-1"><MapPin size={10} /> {item.address}</span>
                            <span className="flex items-center gap-1"><Phone size={10} /> {item.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-1 text-[10px] text-[#526484]">
                        <Calendar size={10} className="inline mb-0.5" />{" "}
                        {item.created_at ? format(new Date(item.created_at), "dd MMM yyyy") : "N/A"}
                      </td>
                      <td className="px-6 py-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.is_active ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                          {item.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all"><Pencil size={12} /></button>
                          <button onClick={() => { setSelectedIds([]); setDeleteId(itemId); setIsModalOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <span className="text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{selectedIds.length} Schools Selected</span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 active:scale-95 transition-all shadow-sm">
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Selected Schools?" : "Remove School?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} schools? This will remove all associated data.` : "Are you sure you want to delete this school? This action cannot be undone."}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SchoolTable;