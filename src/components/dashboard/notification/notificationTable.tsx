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
  Radio,
  BookOpen,
  Bell,
  Eye,
  X,
  CalendarDays,
  UserCircle,
  Tag,
  School,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { NotificationServices } from "@/services/notificationServices";
import ConfirmModal from "../../delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";
import { CancelButton } from "@/components/ui/CancleButton";
import NotificationDetailModal from "@/components/ui/notificationModel";

interface Notification {
  id: number;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  target_role: string;
  title: string;
  message: string;
  is_broadcast: boolean;
  is_read: boolean;
  school: number | null;
  user: number | null;
  created_by: number;
}

interface NotificationTableProps {
  onEdit: (notification: Notification) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;


// ── Main Table ───────────────────────────────────────────────────────────────
const NotificationTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: NotificationTableProps) => {
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [filteredData, setFilteredData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [messageModal, setMessageModal] = useState<Notification | null>(null);

  // --- Fetch Notifications ---
 const fetchNotifications = React.useCallback(async () => {
  try {
    setLoading(true);
    const res = await NotificationServices.getAllNotifications();
    const all = Array.isArray(res) ? res : res?.results || res?.data || [];
    setNotificationsList([...all].reverse());
  } catch {
    toast.error("Failed to load notifications");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchNotifications();
  }, [refreshTrigger]);

  // --- Filter ---
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const result = notificationsList.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.created_by_email.toLowerCase().includes(q) ||
      n.target_role.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q)
    );
    setFilteredData(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, notificationsList]);

  // --- Pagination ---
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // --- Export & Print ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Notification Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.title,
      item.created_by_email,
      item.target_role,
      item.is_broadcast ? "Yes" : "No",
      item.is_read ? "Read" : "Unread",
      new Date(item.created_at).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [["S.N.", "Title", "Created By", "Target Role", "Broadcast", "Status", "Date"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [54, 74, 99] },
    });

    doc.save(`Notification_Report_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const handlePrint = () => {
    const printContent = paginatedItems
      .map(
        (item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.title}</td>
        <td>${item.created_by_email}</td>
        <td>${item.target_role}</td>
        <td>${item.is_broadcast ? "Yes" : "No"}</td>
        <td>${item.is_read ? "Read" : "Unread"}</td>
        <td>${new Date(item.created_at).toLocaleDateString()}</td>
      </tr>
    `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Notification List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
              h2 { color: #1e293b; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Notification List</h2>
            <div>Generated for Page ${currentPage} | Total: ${filteredData.length}</div>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th><th>Title</th><th>Created By</th>
                  <th>Target Role</th><th>Broadcast</th><th>Status</th><th>Date</th>
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


const handleViewNotification = async (notification: Notification) => {
  setMessageModal(notification);

  if (!notification.is_read) {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = currentUser.id; 

      await NotificationServices.updateNotification(notification.id, {
        is_read: true,
        user: currentUserId 
      });

      setNotificationsList((prev) =>
        prev.map((n) =>
          n.id === notification.id 
            ? { ...n, is_read: true, user: currentUserId } 
            : n
        )
      );
    } catch (error) {
      console.error("Update failed:", error);
    }
  }
};


  // --- Selection & Delete ---
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((item) => item.id));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    const idsToDelete =
      selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    if (idsToDelete.length === 0) return;

    try {
      setDeleteLoading(true);
      await Promise.all(
        idsToDelete.map((id) => NotificationServices.deleteNotification(id))
      );
      toast.success(`${idsToDelete.length} notification(s) deleted`);
      setNotificationsList((prev) =>
        prev.filter((item) => !idsToDelete.includes(item.id))
      );
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      {/* Message Popup Modal */}
      {messageModal && (
        <NotificationDetailModal
          notification={messageModal}
          onClose={() => setMessageModal(null)}
        />
      )}

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
                      checked={
                        selectedIds.length === paginatedItems.length &&
                        paginatedItems.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">S.N.</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Notification Info</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Target & Type</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Details</th>
                  <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Message</th>
                  <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">Action</th>
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
                            ? "No matching notifications found."
                            : "No notifications yet."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, index) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-1">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleSelectOne(item.id)}
                          />
                        </td>

                        {/* S.N. */}
                        <td className="px-6 py-1 text-[10px] text-[#526484]">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </td>

                        {/* Notification Info */}
                        <td className="px-6 py-1">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#364a63] font-bold uppercase">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-[#8094ae] flex items-center gap-1">
                              <UserCircle size={10} /> {item.created_by_email}
                            </span>
                          </div>
                        </td>

                        {/* Target & Type */}
                        <td className="px-6 py-1">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <Tag size={10} className="text-[#8094ae]" />
                              <span className="text-[10px] font-medium text-[#526484] capitalize">
                                {item.target_role === "all" ? "All User" : item.target_role}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Radio
                                size={10}
                                className={item.is_broadcast ? "text-emerald-500" : "text-[#8094ae]"}
                              />
                              <span
                                className={`text-[10px] font-bold ${item.is_broadcast ? "text-emerald-600" : "text-[#8094ae]"}`}
                              >
                                {item.is_broadcast ? "Broadcast" : "Targeted"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-1">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays size={10} className="text-[#8094ae]" />
                              <span className="text-[10px] text-[#526484]">
                                {new Date(item.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.is_read ? (
                                <CheckCircle2 size={10} className="text-emerald-500" />
                              ) : (
                                <XCircle size={10} className="text-rose-400" />
                              )}
                              <span
                                className={`text-[10px] font-bold ${item.is_read ? "text-emerald-600" : "text-rose-500"}`}
                              >
                                {item.is_read ? "Read" : "Unread"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Message — click to open popup */}
                        <td className="px-6 py-1">
                          <button
                            onClick={() => handleViewNotification(item)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-100 active:scale-95 transition-all"
                          >
                            <Eye size={10} />
                            View Message
                          </button>
                        </td>

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
                                setDeleteId(item.id);
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

          {/* Footer */}
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

        {/* Bulk Delete Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {selectedIds.length} Notifications Selected
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
          title={
            selectedIds.length > 0
              ? "Delete Selected Notifications?"
              : "Remove Notification?"
          }
          message={
            selectedIds.length > 0
              ? `Are you sure you want to delete ${selectedIds.length} notification(s)?`
              : "Are you sure you want to delete this notification? This action cannot be undone."
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsModalOpen(false);
            setDeleteId(null);
          }}
          loading={deleteLoading}
        />
      </div>
    </>
  );
};

export default NotificationTable;