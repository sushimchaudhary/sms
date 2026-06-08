"use client";

import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Inbox, SearchX, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { SectionServices } from "@/services/sectionServices";
import ConfirmModal from "../../delete/confirmModel";
import { QuestionPaperServices } from "@/services/questionpaperServices";

interface QuestionSection {
  id: string | number;
  title: string;
  heading: string;
  total_marks: number;
  order: number;
  paper: number; // यो ID हो
}

interface SectionTableProps {
  paperId: string | number;
  onEdit: (section: QuestionSection) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const SectionTable = ({ paperId, onEdit, refreshTrigger, searchQuery = "" }: SectionTableProps) => {
  const [sectionList, setSectionList] = useState<QuestionSection[]>([]);
  const [paperName, setPaperName] = useState<string>(""); // पेपरको नामको लागि
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [sections, papers] = await Promise.all([
        QuestionPaperServices.getSectionsByPaper(paperId),
        QuestionPaperServices.getAllPapers()
      ]);

      setSectionList(Array.isArray(sections) ? sections : []);

      // Debugging: पेपर्स लिस्ट हेर्नुहोस्
      console.log("All Papers List:", papers); 

      // Type Mismatch हटाउन String मा कन्भर्ट गरेर कम्प्यारिजन गर्नुहोस्
      const paperList = Array.isArray(papers) ? papers : (papers?.results || []);
      const currentPaper = paperList.find((p: any) => String(p.id) === String(paperId));
      
      if (currentPaper) {
        setPaperName(currentPaper.title);
      } else {
        // यदि अझै भेटिएन भने एक पटक पेपर लिस्टको संरचना हेर्नुहोस्
        console.warn("Paper with ID", paperId, "not found in list:", paperList);
        setPaperName("Paper Not Found");
      }

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger, paperId]);

  const filteredData = sectionList.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.heading?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await QuestionPaperServices.deleteQuestionSection(deleteId);
      toast.success("Section deleted successfully");
      fetchData();
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to delete section");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3">
    

      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 bg-[#f5f6fa] shadow-sm">
              <tr>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Order</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Section Title</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">Heading</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-center">Marks</th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={5} />
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[11px] text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                       {searchQuery ? <SearchX size={30} /> : <Inbox size={30} />}
                       {searchQuery ? "No matching sections" : "No sections added yet"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80">
                    <td className="px-6 py-3"><div className="flex items-center gap-2 text-[#526484]"><ListOrdered size={13}/> {item.order}</div></td>
                    <td className="px-6 py-3 font-bold text-[#364a63] uppercase">{item.title}</td>
                    <td className="px-6 py-3 text-[11px] text-[#526484]">{item.heading || "N/A"}</td>
                    <td className="px-6 py-3 text-center text-[11px] font-bold">{item.total_marks}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Pencil size={12} /></button>
                        <button onClick={() => { setDeleteId(item.id); setIsModalOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Delete Section?"
        message="This action will remove the section and its details."
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SectionTable;