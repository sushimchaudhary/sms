"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Calendar,
  GraduationCap,
  ClipboardList,
  SearchX,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "../../delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { SessionServices } from "@/services/sessionsServices";
import { SchoolServices } from "@/services/schoolServices";

interface Session {
  _id: string;
  id?: string;
  name: string;
  school: any;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface SessionsTableProps {
  onEdit: (session: Session) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;



const SessionsTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: SessionsTableProps) => {
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [filteredData, setFilteredData] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [schoolsMap, setSchoolsMap] = useState<Record<string, string>>({});

 

  // ── Fetch all schools and build ID → name map ─────────────────────────────
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await SchoolServices.getDetails();
        const schools = Array.isArray(res)
          ? res
          : res?.results || res?.data || [];
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

  // ── Fetch sessions ────────────────────────────────────────────────────────
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await SessionServices.getSessions();
      const allSessions = Array.isArray(res)
        ? res
        : res?.results || res?.data || [];
      setSessionsList(allSessions);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger]);

  // ── Search filter (includes schoolsMap lookup) ────────────────────────────
  useEffect(() => {
    let result = [...sessionsList];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const schoolName =
          typeof s.school === "object"
            ? s.school?.name || ""
            : schoolsMap[String(s.school)] || s.school || "";

        return (
          s.name?.toLowerCase().includes(query) ||
          schoolName.toLowerCase().includes(query)
        );
      });
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [searchQuery, sessionsList, schoolsMap]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await SessionServices.deleteSession(deleteId);
      SessionServices.clearCache();
      toast.success("Session deleted successfully");
      setSessionsList((prev) =>
        prev.filter((item) => (item._id || item.id) !== deleteId)
      );
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete session");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // ── Resolve school name helper ────────────────────────────────────────────
  const resolveSchoolName = (school: any): string => {
    if (!school) return "N/A";
    if (typeof school === "object") return school?.name || "N/A";
    return schoolsMap[String(school)] || String(school) || "N/A";
  };

  return (
    <div className="space-y-1">
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[395px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase w-16">S.N</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Session Info</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Institution</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Timeline (BS)</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Status</th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={6} />
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {searchQuery ? (
                        <SearchX size={32} className="text-rose-300" />
                      ) : (
                        <Inbox size={32} className="text-gray-200" />
                      )}
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery
                          ? "No matching sessions found."
                          : "No sessions recorded."}
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

                    {/* Session Info */}
                    <td className="px-6 py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                          <ClipboardList size={16} />
                        </div>
                        <div className="text-[11px] text-[#526484] font-bold uppercase tracking-tight">
                          {item.name}
                        </div>
                      </div>
                    </td>

                    {/* Institution */}
                    <td className="px-6 py-1">
                      <div className="flex items-center gap-2 text-[#526484]">
                        <GraduationCap size={14} className="text-[#8094ae]" />
                        <span className="text-[11px] font-medium">
                          {resolveSchoolName(item.school)}
                        </span>
                      </div>
                    </td>

                    {/* Timeline */}
                    <td className="px-6 py-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-[#8094ae] uppercase w-10">
                            Start:
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-[#364a63] font-medium px-2 py-0.5">
                            <Calendar size={10} className="text-blue-400" />
                            {/* यहाँ नेपाली BS मिति देखिन्छ */}
                            {(item.start_date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-[#8094ae] uppercase w-10">
                            End:
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-[#364a63] font-medium px-2 py-0.5">
                            <Calendar size={10} className="text-rose-400" />
                            {/* यहाँ नेपाली BS मिति देखिन्छ */}
                            {(item.end_date)}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.is_active
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {item.is_active ? (
                          <>
                            <CheckCircle2 size={10} /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={10} /> Inactive
                          </>
                        )}
                      </span>
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
                            setDeleteId((item._id || item.id) ?? null);
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
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
        title="Delete Session?"
        message="Are you sure you want to delete this session? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SessionsTable;