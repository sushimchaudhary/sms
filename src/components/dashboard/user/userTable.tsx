"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  SearchX,
  Inbox,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  School,
  Download,
  Printer,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ConfirmModal from "../../delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { ThemedButton } from "@/components/ui/themedButton";
import { UserServices } from "@/services/authServices";
import Cookies from "js-cookie";
import { ConfigProvider, Select } from "antd";

interface UserTableProps {
  onEdit: (user: any) => void;
  refreshTrigger: number;
  searchQuery: string;
  schools?: { id: number | string; name: string }[];
}

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<string, string> = {
  admin: "School Admin",
  teacher: "Teacher",
  staff: "Staff",
  student: "Student",
  parent: "Parent",
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-600",
  admin: "bg-blue-100 text-blue-600",
  teacher: "bg-emerald-100 text-emerald-600",
  staff: "bg-orange-100 text-orange-600",
  student: "bg-indigo-100 text-indigo-600",
  parent: "bg-rose-100 text-rose-600",
};

const UserTable = ({
  onEdit,
  refreshTrigger,
  searchQuery,
  schools = [],
}: UserTableProps) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- Bulk selection (mirrors SchoolTable) ---
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // --- Fetch ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await UserServices.getDetails({ search: searchQuery });
      const allUsers = Array.isArray(res) ? res : res?.data || [];

      const userInfoCookie = Cookies.get("user_info");
      const loggedInUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
      const currentUserRole = loggedInUser?.role?.toLowerCase();

      const baseData =
        currentUserRole === "superadmin"
          ? allUsers
          : allUsers.filter(
              (user: any) => user.role?.toLowerCase() !== "superadmin"
            );

      setData(baseData);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 500);
    return () => clearTimeout(timer);
  }, [refreshTrigger, searchQuery]);

  // --- Filter ---
  useEffect(() => {
    let result = [...data];

    if (selectedRole !== "all") {
      result = result.filter(
        (user) => user.role?.toLowerCase() === selectedRole.toLowerCase()
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((user) => {
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
        return (
          fullName.includes(query) ||
          (user.email || "").toLowerCase().includes(query) ||
          (user.username || "").toLowerCase().includes(query) ||
          (user.role || "").toLowerCase().includes(query) ||
          (user.contact || user.phone || "").toLowerCase().includes(query) ||
          (user.school_name || user.school?.name || "").toLowerCase().includes(query)
        );
      });
    }

    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [selectedRole, searchQuery, data]);

  // --- Selection (mirrors SchoolTable) ---
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) setSelectedIds([]);
    else setSelectedIds(paginatedItems.map((item) => item._id || item.id));
  };

  const handleSelectOne = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // --- Delete (supports bulk like SchoolTable) ---
  const handleConfirmDelete = async () => {
    const idsToDelete =
      selectedIds.length > 0
        ? selectedIds
        : deleteId
        ? [deleteId]
        : [];
    if (idsToDelete.length === 0) return;

    try {
      setDeleteLoading(true);
      await Promise.all(
        idsToDelete.map((id) => UserServices.deleteDetails(String(id)))
      );
      toast.success(`${idsToDelete.length} user(s) deleted`);
      setData((prev) =>
        prev.filter((item) => !idsToDelete.includes(item._id || item.id))
      );
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete user. Please try again.";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // --- Export PDF (mirrors SchoolTable) ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("User List Report", 14, 15);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      `${item.first_name || ""} ${item.last_name || ""}`.trim() || "N/A",
      item.role || "N/A",
      item.email || "N/A",
      item.phone || item.contact || "N/A",
      item.school_name || item.school?.name || "No School",
    ]);

    autoTable(doc, {
      head: [["S.N.", "Name", "Role", "Email", "Phone", "School"]],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });

    doc.save(`User_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded");
  };

  // --- Print (mirrors SchoolTable) ---
  const handlePrint = () => {
    const printContent = paginatedItems
      .map(
        (item, index) => `
        <tr>
          <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
          <td>${`${item.first_name || ""} ${item.last_name || ""}`.trim() || "N/A"}</td>
          <td>${item.role || "N/A"}</td>
          <td>${item.email || "N/A"}</td>
          <td>${item.phone || item.contact || "N/A"}</td>
          <td>${item.school_name || item.school?.name || "No School"}</td>
        </tr>
      `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>User List Print</title><style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f8fafc; }
          </style></head>
          <body><h2>User List</h2><table>
            <thead><tr><th>S.N.</th><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>School</th></tr></thead>
            <tbody>${printContent}</tbody>
          </table></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // --- Resolve school name ---
  const resolveSchool = (item: any) => {
    if (typeof item.school === "object" && item.school?.name) return item.school.name;
    if (item.school_name) return item.school_name;
    if (item.school && schools.length) {
      const found = schools.find((s: any) => s.id === item.school || s._id === item.school);
      if (found) return found.name;
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Filter Section */}
      <div className="flex justify-end items-center gap-3">
        <span className="text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
          Filter by Role:
        </span>
        <ConfigProvider
          theme={{ token: { controlHeight: 28, fontSize: 12, borderRadius: 4 } }}
        >
          <Select
            value={selectedRole}
            onChange={(val) => setSelectedRole(val)}
            style={{ width: 150 }}
          >
            <Select.Option value="all">All Roles</Select.Option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </ConfigProvider>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[395px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                {/* Checkbox col */}
                <th className="px-4 py-1 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                    checked={
                      selectedIds.length === paginatedItems.length &&
                      paginatedItems.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">S.N.</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">User Details</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Role</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">School</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Contact</th>
                {/* <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Created At</th> */}
                <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={7} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery ? (
                        <SearchX size={32} className="text-rose-300" />
                      ) : (
                        <Inbox size={32} className="text-gray-200" />
                      )}
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery
                          ? "No matching users found."
                          : "No users registered."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const itemId = item._id || item.id;
                  const isSelected = selectedIds.includes(itemId);
                  const schoolName = resolveSchool(item);
                  const roleKey = item.role?.toLowerCase() || "";

                  return (
                    <tr
                      key={itemId}
                      className={`hover:bg-gray-50 transition-colors ${
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

                      {/* User Details */}
                      <td className="px-6 py-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserCircle className="w-full h-full text-gray-300 p-1" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#364a63] font-bold uppercase">
                              {item.fullName ||
                                `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
                                "N/A"}
                            </span>
                            <span className="text-[10px] text-[#8094ae]">
                              @{item.username || item.email?.split("@")[0]}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ROLE_COLORS[roleKey] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.role || "N/A"}
                        </span>
                      </td>

                      {/* School */}
                      <td className="px-6 py-1">
                        <div className="flex items-center gap-2">
                          {schoolName && (
                            <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 flex-shrink-0">
                              <School size={12} />
                            </div>
                          )}
                          <span className="text-[11px] text-[#526484] font-medium uppercase tracking-tight">
                            {schoolName || (
                              <span className="text-rose-400 italic font-normal">
                                No School Assigned
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-1">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#526484] font-medium">
                            <Mail size={10} className="text-gray-400" />
                            {item.email || "N/A"}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[#8094ae]">
                            <Phone size={10} />
                            {item.phone || item.contact || "No Contact"}
                          </div>
                        </div>
                      </td>

                      {/* Created At */}
                      {/* <td className="px-6 py-1 text-[10px] text-[#526484]">
                        <Calendar size={10} className="inline mb-0.5" />{" "}
                        {item.created_at
                          ? format(new Date(item.created_at), "dd MMM yyyy")
                          : "N/A"}
                      </td> */}

                      {/* Actions */}
                      <td className="px-4 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIds([]);
                              setDeleteId(item._id || item.id);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all"
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

        {/* Footer: count + PDF/Print + pagination (mirrors SchoolTable) */}
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
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Delete Bar (mirrors SchoolTable) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
            {selectedIds.length} Users Selected
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
        title={selectedIds.length > 0 ? "Delete Selected Users?" : "Remove User?"}
        message={
          selectedIds.length > 0
            ? `Are you sure you want to delete ${selectedIds.length} users? This will remove all associated data.`
            : "Are you sure you want to delete this user? This action cannot be undone."
        }
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

export default UserTable;