"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  UserCheck,
  BookOpen,
  Layers,
  CalendarDays,
  Inbox,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { TeacherSubjectServices } from "@/services/teacherSubjectServices";
import ConfirmModal from "@/components/delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";

interface TeacherSubject {
  id: string | number;
  teacher_name: string;
  teacher_email?: string;
  subject_name: string;
  class_name: string;
  section_name: string;
  session_name: string;
  teacher: number;
  subject: number;
  class_assigned: number;
  section: number;
  session: number;
}

interface TeacherSubjectTableProps {
  onEdit: (data: TeacherSubject) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const TeacherSubjectTable: React.FC<TeacherSubjectTableProps> = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}) => {
  const [list, setList] = useState<TeacherSubject[]>([]);
  const [filteredData, setFilteredData] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await TeacherSubjectServices.getAllTeacherSubjects();
      const allData = Array.isArray(res) ? res : res?.results || res?.data || [];
      setList([...allData].reverse());
    } catch (error) {
      toast.error("Failed to load teacher assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [refreshTrigger]);

  useEffect(() => {
    const result = list.filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.teacher_name?.toLowerCase().includes(query) ||
        item.subject_name?.toLowerCase().includes(query) ||
        item.class_name?.toLowerCase().includes(query)
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

  const handleConfirmDelete = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => TeacherSubjectServices.deleteTeacherSubject(id)));
      toast.success(ids.length > 1 ? "Selected records deleted" : "Record deleted successfully");
      
      // Update local state to avoid extra API call if preferred
      setList(prev => prev.filter(item => !ids.includes(item.id)));
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
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[450px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 border-b">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={() => setSelectedIds(selectedIds.length === paginatedItems.length ? [] : paginatedItems.map(i => i.id))}
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Teacher Information</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Assigned Subject</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Class & Section</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Session</th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24 border-b">Action</th>
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
                      <span className="text-sm font-bold text-[#364a63]">No assignments found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                      <td className="px-4 py-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase flex items-center gap-1.5">
                            <UserCheck size={11} className="text-indigo-500" /> {item.teacher_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-cyan-50 rounded">
                            <BookOpen size={12} className="text-cyan-600" />
                          </div>
                          <span className="text-[11px] font-bold text-cyan-700 uppercase">{item.subject_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <span className="text-[11px] text-[#526484] font-medium flex items-center gap-2">
                          <Layers size={12} className="text-amber-500" /> {item.class_name} - {item.section_name}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        <span className="text-[11px] text-[#8094ae] flex items-center gap-2">
                          <CalendarDays size={12} /> {item.session_name}
                        </span>
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

        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1 border-t bg-[#f5f6fa]">
             <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-2">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <span className="text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* --- ADDED BULK ACTION BAR --- */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{selectedIds.length} Assignments Selected</span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 active:scale-95 transition-all shadow-sm">
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title={selectedIds.length > 0 ? "Delete Selected Assignments?" : "Remove Assignment?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} mapping records?` : "Are you sure you want to remove this teacher-subject mapping?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default TeacherSubjectTable;