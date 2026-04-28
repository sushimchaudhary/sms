"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Mail,
  Download,
  Printer,
  Inbox,
  SearchX,
  Briefcase,
  Fingerprint,
  User,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { StaffServices } from "@/services/staffServices";
import { SchoolServices } from "@/services/schoolServices";
import ConfirmModal from "../../delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import Avatar from "antd/es/avatar/Avatar";

interface Staff {
  _id: string | number;
  id?: string | number;
  user?: {
    id?: string | number;
    full_name: string;
    email: string;
  };
  full_name?: string;
  user_email?: string;
  school: any;
  designation: string;
  code: string;photo?: string | null;      
  photo_url?: string | null;
}

interface StaffTableProps {
  onEdit: (staff: Staff) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const StaffTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: StaffTableProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredData, setFilteredData] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schoolsMap, setSchoolsMap] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  // --- Helpers ---
  const resolveSchoolName = (school: any): string => {
    if (!school) return "N/A";
    if (typeof school === "object") return school?.name || "N/A";
    return schoolsMap[String(school)] || String(school) || "N/A";
  };

  // --- Fetching Data ---
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await SchoolServices.getDetails();
        const schools = Array.isArray(res) ? res : res?.results || res?.data || [];
        const map: Record<string, string> = {};
        schools.forEach((s: any) => {
          const id = s._id || s.id || s.school_id;
          if (id) map[String(id)] = s.name || s.school_name || "";
        });
        setSchoolsMap(map);
      } catch (error) {
        console.error("Failed to fetch schools:", error);
      }
    };
    fetchSchools();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await StaffServices.getAllstaffs();
      const allStaff = Array.isArray(res) ? res : res?.results || res?.data || [];
      setStaffList([...allStaff].reverse());
    } catch (error) {
      toast.error("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [refreshTrigger]);

  useEffect(() => {
    let result = staffList.filter((s) => {
      const name = (s.user?.full_name || s.full_name || "").toLowerCase();
      const email = (s.user?.email || s.user_email || "").toLowerCase();
      const code = (s.code || "").toLowerCase();
      const designation = (s.designation || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        code.includes(query) ||
        designation.includes(query)
      );
    });
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, staffList]);

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
    doc.text("Staff List Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.code || "N/A",
      item.user?.full_name || item.full_name || "N/A",
      item.designation || "N/A",
      resolveSchoolName(item.school),
      item.user?.email || item.user_email || "N/A",
    ]);

    autoTable(doc, {
      head: [["S.N.", "Staff ID", "Name", "Designation", "Institution", "Email"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });

    doc.save(`Staff_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.code}</td>
        <td>${item.user?.full_name || item.full_name}</td>
        <td>${item.designation}</td>
        <td>${resolveSchoolName(item.school)}</td>
        <td>${item.user?.email || item.user_email}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Staff List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
              h2 { color: #1e293b; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Staff List</h2>
            <div class="meta">Generated for Page ${currentPage} | Total Staff: ${filteredData.length}</div>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Institution</th>
                  <th>Email</th>
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

  // --- Selection & Delete Logic ---
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

  const handleConfirmDelete = async () => {
    const idsToDelete = selectedIds.length > 0 ? selectedIds : (deleteId ? [deleteId] : []);
    if (idsToDelete.length === 0) return;

    try {
      setDeleteLoading(true);
      await Promise.all(idsToDelete.map((id) => StaffServices.deletestaff(id)));
      toast.success(`${idsToDelete.length} staff member(s) deleted`);
      setStaffList((prev) =>
        prev.filter((item) => !idsToDelete.includes(item._id || item.id!))
      );
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Failed to delete staff");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
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
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">S.N.</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Staff Info</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Institution</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Details</th>
                <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={6} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery ? "No matching staff found." : "No staff members registered."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const itemId = (item._id || item.id)!;
                  const isSelected = selectedIds.includes(itemId);
                  const staffPhoto = item.photo_url || item.photo;
                  return (
                    <tr key={itemId} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                      <td className="px-4 py-1">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectOne(itemId)}
                        />
                      </td>
                      <td className="px-6 py-1 text-[10px] text-[#526484]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-6 py-1">
                        <div className="flex items-center gap-3">
                          {/* Photo Preview Added Here */}
                          <div className="relative">
                             <Avatar 
                                src={staffPhoto} 
                                icon={!staffPhoto && <User size={14} />} 
                                size={32} 
                                className="border border-gray-100 shadow-sm shrink-0"
                             />
                          </div> 
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase">
                            {item.user?.full_name || item.full_name || "Unknown"}
                          </span>
                          <span className="text-[10px] text-[#8094ae] flex items-center gap-1">
                            <Mail size={10} /> {item.user?.email || item.user_email || "N/A"}
                          </span>
                        </div>
                        </div>
                      </td>
                      <td className="px-6 py-1">
                        <div className="flex items-center gap-2 text-[#526484]">
                          <GraduationCap size={14} className="text-[#8094ae]" />
                          <span className="text-[11px] font-medium">{resolveSchoolName(item.school)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Fingerprint size={10} className="text-[#8094ae]" />
                            <span className="text-[10px] text-emerald-600 font-bold uppercase">{item.code || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#526484]">
                            <Briefcase size={10} className="text-cyan-500" />
                            <span className="text-[10px] italic">{item.designation || "Not Specified"}</span>
                          </div>
                        </div>
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
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{selectedIds.length} Staff Selected</span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 active:scale-95 transition-all shadow-sm">
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Selected Staff?" : "Remove Staff?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} staff members?` : "Are you sure you want to delete this profile?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default StaffTable;