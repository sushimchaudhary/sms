"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers,
  Hash,
  SearchX,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "../../delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { SectionServices } from "@/services/sectionServices";

interface Section {
  _id: string;
  id?: string;
  name: string;
  school: any;
  school_name?: string;
  session: any;
  session_name?: string;
  class_assigned: any;
  class_name?: string;
}

interface SectionTableProps {
  onEdit: (section: Section) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const SectionTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: SectionTableProps) => {
  const [sectionList, setSectionList] = useState<Section[]>([]);
  const [filteredData, setFilteredData] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch Sections ────────────────────────────────────────────────────────
  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await SectionServices.getAllSections();
      const data = Array.isArray(res) ? res : res?.results || res?.data || [];
      setSectionList(data);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [refreshTrigger]);

  // ── Search & Filter Logic (Updated for Flat Data) ──────────────────────────
  useEffect(() => {
    let result = [...sectionList];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => {
        // Flattened API keys use gareko: class_name ra session_name
        const className = s.class_name || "";
        const sessionName = s.session_name || "";
        const sectionName = s.name || "";
        const schoolName = s.school_name || "";

        return (
          sectionName.toLowerCase().includes(query) ||
          className.toLowerCase().includes(query) ||
          sessionName.toLowerCase().includes(query) ||
          schoolName.toLowerCase().includes(query)
        );
      });
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [searchQuery, sectionList]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ── Delete Handler ────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await SectionServices.deleteSection(deleteId);
      SectionServices.clearCache();
      toast.success("Section deleted successfully");
      setSectionList((prev) =>
        prev.filter((item) => String(item._id || item.id) !== deleteId)
      );
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete section");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-1">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[395px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase w-16">S.N</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Section Info</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Assigned Class</th>
                <th className="px-6 py-1 text-[11px] font-bold text-[#8094ae] uppercase">Academic Session</th>
                <th className="px-4 py-1 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={5} />
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {searchQuery ? (
                        <SearchX size={32} className="text-rose-300" />
                      ) : (
                        <Inbox size={32} className="text-gray-200" />
                      )}
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery ? "No matching sections found." : "No sections recorded."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => (
                  <tr
                    key={item._id || item.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    {/* S.N */}
                    <td className="px-6 py-1 text-xs text-[#526484]">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}.
                    </td>

                    {/* Section Name */}
                    <td className="px-6 py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                          <Hash size={14} />
                        </div>
                        <div className="text-[11px] text-[#526484] font-bold uppercase tracking-tight">
                          Section {item.name}
                        </div>
                      </div>
                    </td>

                    {/* Assigned Class (Updated) */}
                    <td className="px-6 py-1">
                      <div className="flex items-center gap-2 text-[#526484]">
                        <Layers size={14} className="text-[#8094ae]" />
                        <span className="text-[11px] font-medium uppercase">
                          Class {item.class_name || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Session (Updated) */}
                    <td className="px-6 py-1">
                      <div className="flex items-center gap-2 text-[#526484]">
                        <Calendar size={14} className="text-[#8094ae]" />
                        <span className="text-[11px] font-medium">
                          {item.session_name || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-1 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-all"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(String(item._id || item.id));
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1 border-t bg-[#f5f6fa]">
            <span className="text-[11px] text-[#8094ae]">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredData.length)} of{" "}
              {filteredData.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 disabled:opacity-30 transition-opacity"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-bold px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 disabled:opacity-30 transition-opacity"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Delete Section?"
        message="Are you sure you want to delete this section? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SectionTable;