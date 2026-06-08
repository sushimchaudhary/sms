// "use client";

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   FileText,
//   Plus,
//   Search,
//   Trash2,
//   Eye,
//   Edit2,
//   Printer,
//   Clock,
//   BookOpen,
//   MoreVertical,
//   AlertCircle,
//   Loader2,
// } from "lucide-react";
// import { toast } from "sonner";
// import { QuestionPaperServices } from "@/services/questionpaperServices";
// import QuestionPaperBuilder from "@/components/dashboard/exampaper/Questionpaperbuilder";
// import QuestionPaperPreview from "@/components/dashboard/exampaper/Questionpaperpreview";


// // ── Types ──────────────────────────────────────────────────────────────────────
// export interface PaperListItem {
//   id: number;
//   title: string;
//   subject: string;
//   class_name: string;
//   full_marks: number;
//   pass_marks: number;
//   duration: string;
//   status: "draft" | "final";
//   total_section_marks: number;
//   created_at: string;
// }

// // ── Helpers ────────────────────────────────────────────────────────────────────
// const formatDate = (iso: string) =>
//   new Date(iso).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   });

// // ── Component ──────────────────────────────────────────────────────────────────
// export default function QuestionPaperList() {
//   const [papers, setPapers] = useState<PaperListItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [activeMenu, setActiveMenu] = useState<number | null>(null);

//   // Modal states
//   const [builderOpen, setBuilderOpen] = useState(false);
//   const [editPaper, setEditPaper] = useState<any>(null);
//   const [previewPaperId, setPreviewPaperId] = useState<number | null>(null);

//   const fetchPapers = useCallback(async (q?: string) => {
//     setLoading(true);
//     try {
//       const data = await QuestionPaperServices.getAllPapers(
//         q ? { search: q } : undefined
//       );
//       setPapers(data.results ?? data);
//     } catch {
//       toast.error("Failed to load question papers");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchPapers();
//   }, [fetchPapers]);

//   // Search with debounce
//   useEffect(() => {
//     const t = setTimeout(() => fetchPapers(search || undefined), 350);
//     return () => clearTimeout(t);
//   }, [search, fetchPapers]);

//   const handleDelete = async (id: number) => {
//     if (!confirm("Delete this question paper?")) return;
//     try {
//       await QuestionPaperServices.deletePaper(id);
//       toast.success("Paper deleted");
//       fetchPapers();
//     } catch {
//       toast.error("Delete failed");
//     }
//     setActiveMenu(null);
//   };

//   const handleEdit = async (id: number) => {
//     try {
//       // Fetch full paper with sections + questions
//       const full = await QuestionPaperServices.getPaper(id);
//       setEditPaper(full);
//       setBuilderOpen(true);
//     } catch {
//       toast.error("Failed to load paper details");
//     }
//     setActiveMenu(null);
//   };

//   return (
//     <div className="min-h-screen bg-[#F5F6FA] p-6 font-mukta">
//       {/* ── Page header ── */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//         <div>
//           <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
//             <FileText size={20} className="text-blue-600" />
//             Question Papers
//           </h1>
//           <p className="text-xs text-gray-400 mt-0.5">
//             Manage exam paper templates
//           </p>
//         </div>

//         <div className="flex gap-3 items-center">
//           {/* Search */}
//           <div className="relative">
//             <Search
//               size={13}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//             />
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search papers…"
//               className="pl-8 pr-3 h-9 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-blue-400 w-52"
//             />
//           </div>

//           {/* New paper */}
//           <button
//             onClick={() => {
//               setEditPaper(null);
//               setBuilderOpen(true);
//             }}
//             className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
//           >
//             <Plus size={13} />
//             New Paper
//           </button>
//         </div>
//       </div>

//       {/* ── Table ── */}
//       <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
//         {loading ? (
//           <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
//             <Loader2 size={18} className="animate-spin" />
//             <span className="text-sm">Loading…</span>
//           </div>
//         ) : papers.length === 0 ? (
//           <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
//             <AlertCircle size={32} className="opacity-30" />
//             <span className="text-sm">No papers found</span>
//           </div>
//         ) : (
//           <table className="w-full text-sm">
//             <thead className="bg-gray-50 border-b border-gray-100">
//               <tr>
//                 {[
//                   "Title",
//                   "Subject",
//                   "Class",
//                   "Marks",
//                   "Duration",
//                   "Status",
//                   "Created",
//                   "",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide"
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-50">
//               {papers.map((p) => (
//                 <tr
//                   key={p.id}
//                   className="hover:bg-blue-50/30 transition-colors group"
//                 >
//                   <td className="px-4 py-3">
//                     <span className="font-medium text-gray-800 text-xs line-clamp-1">
//                       {p.title}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-1.5">
//                       <BookOpen size={11} className="text-blue-400" />
//                       <span className="text-xs text-gray-600">{p.subject}</span>
//                     </div>
//                   </td>
//                   <td className="px-4 py-3 text-xs text-gray-600">
//                     {p.class_name}
//                   </td>
//                   <td className="px-4 py-3">
//                     <span className="text-xs text-gray-600">
//                       {p.full_marks}
//                       <span className="text-gray-400"> / {p.pass_marks}</span>
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-1 text-xs text-gray-500">
//                       <Clock size={11} />
//                       {p.duration}
//                     </div>
//                   </td>
//                   <td className="px-4 py-3">
//                     <StatusBadge status={p.status} />
//                   </td>
//                   <td className="px-4 py-3 text-xs text-gray-400">
//                     {formatDate(p.created_at)}
//                   </td>
//                   <td className="px-4 py-3 relative">
//                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                       {/* Preview */}
//                       <ActionBtn
//                         icon={<Eye size={13} />}
//                         title="Preview"
//                         onClick={() => setPreviewPaperId(p.id)}
//                       />
//                       {/* Edit */}
//                       <ActionBtn
//                         icon={<Edit2 size={13} />}
//                         title="Edit"
//                         onClick={() => handleEdit(p.id)}
//                       />
//                       {/* Delete */}
//                       <ActionBtn
//                         icon={<Trash2 size={13} />}
//                         title="Delete"
//                         danger
//                         onClick={() => handleDelete(p.id)}
//                       />
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* ── Modals ── */}
//       <QuestionPaperBuilder
//         isOpen={builderOpen}
//         initialData={editPaper}
//         onClose={() => {
//           setBuilderOpen(false);
//           setEditPaper(null);
//         }}
//         onSuccess={() => {
//           fetchPapers();
//           setBuilderOpen(false);
//           setEditPaper(null);
//         }}
//       />

//       {previewPaperId && (
//         <QuestionPaperPreview
//           paperId={previewPaperId}
//           isOpen={!!previewPaperId}
//           onClose={() => setPreviewPaperId(null)}
//         />
//       )}
//     </div>
//   );
// }

// // ── Sub-components ─────────────────────────────────────────────────────────────

// function StatusBadge({ status }: { status: "draft" | "final" }) {
//   return (
//     <span
//       className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
//         status === "final"
//           ? "bg-green-100 text-green-700"
//           : "bg-amber-100 text-amber-700"
//       }`}
//     >
//       <span
//         className={`w-1.5 h-1.5 rounded-full ${
//           status === "final" ? "bg-green-500" : "bg-amber-500"
//         }`}
//       />
//       {status}
//     </span>
//   );
// }

// function ActionBtn({
//   icon,
//   title,
//   onClick,
//   danger = false,
// }: {
//   icon: React.ReactNode;
//   title: string;
//   onClick: () => void;
//   danger?: boolean;
// }) {
//   return (
//     <button
//       title={title}
//       onClick={onClick}
//       className={`p-1.5 rounded transition-colors ${
//         danger
//           ? "hover:bg-red-50 text-red-400 hover:text-red-600"
//           : "hover:bg-blue-50 text-gray-400 hover:text-blue-600"
//       }`}
//     >
//       {icon}
//     </button>
//   );
// }



"use client";

import React, { useState } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, X, FileText } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import PaperTable from "@/components/dashboard/exampaper/paperTempletetable";
import QuestionPaperForm from "@/components/dashboard/exampaper/paperTemplateform";


export default function QuestionPaperPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Data successfully save भएपछि table refresh गर्ने
  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setIsModalOpen(false); // form बन्द गर्ने
    setEditData(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleEdit = (data: any) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Question Paper Management"
          description="Create, manage, and organize examination question papers."
        />

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={15} />}
              className="h-7 w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 z-20"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Add Paper Button */}
          <ThemedButton
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            size="sm"
            className="py-1.5 w-fit flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Add New Paper</span>
          </ThemedButton>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-2">
        <PaperTable
          onEdit={handleEdit}
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
        />
      </div>

      {/* Question Paper Form Modal */}
      <QuestionPaperForm
        isOpen={isModalOpen}
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}