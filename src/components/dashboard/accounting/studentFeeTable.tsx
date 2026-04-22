// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Pencil,
//   Trash2,
//   ChevronLeft,
//   ChevronRight,
//   User,
//   Wallet,
//   CalendarClock,
//   Download,
//   Printer,
//   Inbox,
//   SearchX,
//   CreditCard,
//   Hash,
//   School,
// } from "lucide-react";
// import { toast } from "sonner";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
// import { FeeServices } from "@/services/feeServices";
// import ConfirmModal from "@/components/delete/confirmModel";
// import { ThemedButton } from "@/components/ui/themedButton";

// // Interface strictly following your JSON data
// interface StudentFee {
//   id: string | number;
//   student_name: string;
//   student_id: string;
//   fee_type_name: string;
//   class_name: string;
//   section_name: string;
//   remaining_amount: number | string;
//   total_amount: number | string;
//   paid_amount: number | string;
//   due_date: string;
//   status: 'unpaid' | 'partial' | 'paid';
//   enrollment: number;
//   fee_type: number;
// }

// interface StudentFeeTableProps {
//   onEdit: (data: StudentFee) => void;
//   refreshTrigger: number;
//   searchQuery?: string;
// }

// const PAGE_SIZE = 15;

// const StudentFeeTable = ({
//   onEdit,
//   refreshTrigger,
//   searchQuery = "",
// }: StudentFeeTableProps) => {
//   const [list, setList] = useState<StudentFee[]>([]);
//   const [filteredData, setFilteredData] = useState<StudentFee[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
//   const [deleteLoading, setDeleteLoading] = useState(false);
//   const [deleteId, setDeleteId] = useState<string | number | null>(null);

//   const fetchFees = async () => {
//     try {
//       setLoading(true);
//       const res = await FeeServices.getAllStudentFees();
//       const allData = Array.isArray(res) ? res : res?.results || [];
//       setList([...allData].reverse());
//     } catch (error) {
//       toast.error("Failed to load student fees");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchFees();
//   }, [refreshTrigger]);

//   useEffect(() => {
//     const result = list.filter((item) => {
//       const query = searchQuery.toLowerCase();
//       return (
//         item.student_name?.toLowerCase().includes(query) ||
//         item.student_id?.toLowerCase().includes(query) ||
//         item.fee_type_name?.toLowerCase().includes(query)
//       );
//     });
//     setFilteredData(result);
//     setCurrentPage(1);
//     setSelectedIds([]);
//   }, [searchQuery, list]);

//   const paginatedItems = filteredData.slice(
//     (currentPage - 1) * PAGE_SIZE,
//     currentPage * PAGE_SIZE
//   );
//   const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid': return "bg-emerald-50 text-emerald-600 border-emerald-100";
//       case 'partial': return "bg-amber-50 text-amber-600 border-amber-100";
//       default: return "bg-rose-50 text-rose-600 border-rose-100";
//     }
//   };

//   // --- Export Logic ---
//   const downloadPDF = () => {
//     const doc = new jsPDF();
//     doc.text("Student Fee Report", 14, 15);
//     const tableData = paginatedItems.map((item, index) => [
//       index + 1,
//       `${item.student_name} (${item.student_id})`,
//       item.fee_type_name,
//       item.total_amount,
//       item.paid_amount,
//       item.status.toUpperCase()
//     ]);
//     autoTable(doc, {
//       head: [["S.N.", "Student", "Fee Type", "Total", "Paid", "Status"]],
//       body: tableData,
//       startY: 25,
//       styles: { fontSize: 8 },
//     });
//     doc.save(`Student_Fees_Page_${currentPage}.pdf`);
//   };

//   const handlePrint = () => {
//     const printWindow = window.open("", "_blank");
//     if (printWindow) {
//       const content = paginatedItems.map((item, index) => `
//         <tr>
//           <td>${index + 1}</td>
//           <td>${item.student_name}</td>
//           <td>${item.class_name} - ${item.section_name}</td>
//           <td>${item.fee_type_name}</td>
//           <td>${item.total_amount}</td>
//           <td>${item.status}</td>
//         </tr>`).join("");
//       printWindow.document.write(`<html><body><h2>Fee List</h2><table border="1" style="width:100%; border-collapse:collapse"><thead><tr><th>S.N.</th><th>Student</th><th>Class</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>${content}</tbody></table></body></html>`);
//       printWindow.document.close();
//       printWindow.print();
//     }
//   };

//   const handleConfirmDelete = async () => {
//     const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
//     try {
//       setDeleteLoading(true);
//       await Promise.all(ids.map(id => FeeServices.deleteStudentFees(id)));
//       toast.success("Deleted successfully");
//       fetchFees();
//       setIsModalOpen(false);
//       setSelectedIds([]);
//     } catch {
//       toast.error("Delete failed");
//     } finally {
//       setDeleteLoading(false);
//       setDeleteId(null);
//     }
//   };

//   return (
//     <div className="space-y-3 font-mukta">
//       <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
//         <div className="overflow-x-auto max-h-[480px] scrollbar-hide relative">
//           <table className="w-full text-left border-separate border-spacing-0">
//             <thead className="sticky top-0 z-30 shadow-sm">
//               <tr className="bg-[#f5f6fa]">
//                 <th className="px-4 py-1 w-10 border-b">
//                   <input 
//                     type="checkbox" 
//                     checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0} 
//                     onChange={() => setSelectedIds(selectedIds.length === paginatedItems.length ? [] : paginatedItems.map(i => i.id))} 
//                     className="rounded border-gray-300 text-blue-600 cursor-pointer" 
//                   />
//                 </th>
//                 <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">S.N.</th>
//                 <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Student Details</th>
//                 <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Class & Fee Type</th>
//                 <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Amount (Total/Paid)</th>
//                 <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Due Date</th>
//                 <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Status</th>
//                 <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24 border-b">Action</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-100">
//               {loading ? (
//                 <TableLoadingSkeleton rows={5} cols={8} />
//               ) : paginatedItems.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="text-center py-16">
//                     <div className="flex flex-col items-center gap-2">
//                       {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
//                       <span className="text-sm font-bold text-[#364a63]">No fee records found.</span>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 paginatedItems.map((item, index) => {
//                   const isSelected = selectedIds.includes(item.id);
//                   return (
//                     <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
//                       <td className="px-4 py-1">
//                         <input 
//                           type="checkbox" 
//                           checked={isSelected} 
//                           onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])} 
//                           className="rounded border-gray-300 text-blue-600 cursor-pointer" 
//                         />
//                       </td>
//                       <td className="px-6 py-2 text-[10px] text-[#526484]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      
//                       <td className="px-6 py-2">
//                         <div className="flex flex-col">
//                           <span className="text-[11px] text-[#364a63] font-bold uppercase flex items-center gap-1">
//                             <User size={10} className="text-blue-500" /> {item.student_name}
//                           </span>
//                           <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
//                             <Hash size={9} /> {item.student_id}
//                           </span>
//                         </div>
//                       </td>

//                       <td className="px-6 py-2">
//                         <div className="flex flex-col">
//                           <span className="text-[11px] text-slate-700 font-bold uppercase flex items-center gap-1">
//                             <Wallet size={10} className="text-indigo-500" /> {item.fee_type_name}
//                           </span>
//                           <span className="text-[10px] text-slate-500 flex items-center gap-1">
//                             <School size={9} /> Class: {item.class_name} ({item.section_name})
//                           </span>
//                         </div>
//                       </td>

//                       <td className="px-6 py-2">
//                         <div className="flex flex-col">
//                           <span className="text-[11px] font-bold text-slate-700">Rs. {item.total_amount}</span>
//                           <span className="text-[10px] text-emerald-600 font-medium italic">Paid: Rs. {item.paid_amount}</span>
//                         </div>
//                       </td>

//                       <td className="px-6 py-2">
//                         <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">
//                           <CalendarClock size={10} /> {item.due_date}
//                         </div>
//                       </td>

//                       <td className="px-6 py-2 text-center">
//                         <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusColor(item.status)}`}>
//                           {item.status}
//                         </span>
//                       </td>

//                       <td className="px-4 py-2 text-right">
//                         <div className="flex justify-end gap-1">
//                           <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all">
//                             <Pencil size={12} />
//                           </button>
//                           <button onClick={() => { setSelectedIds([]); setDeleteId(item.id); setIsModalOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all">
//                             <Trash2 size={12} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Footer */}
//         {!loading && filteredData.length > 0 && (
//           <div className="flex items-center justify-between px-6 py-1 border-t bg-[#f5f6fa]">
//             <div className="flex items-center gap-2">
//               <button onClick={downloadPDF} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm transition-all">
//                 <Download size={12} /> PDF
//               </button>
//               <ThemedButton onClick={handlePrint} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-white bg-slate-600 rounded hover:bg-slate-700">
//                 <Printer size={12} /> Print
//               </ThemedButton>
//             </div>
//             <div className="flex items-center gap-1">
//               <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronLeft size={14} /></button>
//               <span className="text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
//               <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronRight size={14} /></button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Selected Action Bar */}
//       {selectedIds.length > 0 && (
//         <div className="flex items-center justify-between px-1">
//           <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{selectedIds.length} Record(s) Selected</span>
//           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 transition-all shadow-sm">
//             <Trash2 size={12} /> Delete Selected
//           </button>
//         </div>
//       )}

//       <ConfirmModal
//         isOpen={isModalOpen}
//         title={selectedIds.length > 0 ? "Delete Multiple Records?" : "Remove Student Fee?"}
//         message="This action is permanent and will remove the selected student fee records from the system."
//         onConfirm={handleConfirmDelete}
//         onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
//         loading={deleteLoading}
//       />
//     </div>
//   );
// };

// export default StudentFeeTable;


"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Wallet,
  CalendarClock,
  Download,
  Printer,
  Inbox,
  SearchX,
  Hash,
  School,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { FeeServices } from "@/services/feeServices";
import ConfirmModal from "@/components/delete/confirmModel";
import { ThemedButton } from "@/components/ui/themedButton";

interface StudentFee {
  id: string | number;
  student_name: string;
  student_id: string;
  fee_type_name: string;
  class_name: string;
  section_name: string;
  remaining_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  due_date: string;
  status: 'unpaid' | 'partial' | 'paid';
  enrollment: number;
  fee_type: number;
}

interface StudentFeeTableProps {
  onEdit: (data: StudentFee) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

const PAGE_SIZE = 20;

const StudentFeeTable = ({
  onEdit,
  refreshTrigger,
  searchQuery = "",
}: StudentFeeTableProps) => {
  const [list, setList] = useState<StudentFee[]>([]);
  const [filteredData, setFilteredData] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await FeeServices.getAllStudentFees();
      const allData = Array.isArray(res) ? res : res?.results || [];
      setList([...allData].reverse());
    } catch (error) {
      toast.error("Failed to load student fees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [refreshTrigger]);

  useEffect(() => {
    const result = list.filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.student_name?.toLowerCase().includes(query) ||
        item.student_id?.toLowerCase().includes(query) ||
        item.fee_type_name?.toLowerCase().includes(query)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'partial': return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-rose-50 text-rose-600 border-rose-100";
    }
  };

  // --- Export & Print Logic ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Student Fee Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Page: ${currentPage} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = paginatedItems.map((item, index) => [
      (currentPage - 1) * PAGE_SIZE + index + 1,
      item.student_name,
      item.fee_type_name,
      `Rs. ${item.total_amount}`,
      `Rs. ${item.paid_amount}`,
      item.status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [["S.N.", "Student", "Fee Type", "Total", "Paid", "Status"]],
      body: tableData,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [54, 74, 99] },
    });
    doc.save(`Student_Fees_Page_${currentPage}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const handlePrint = () => {
    const printContent = paginatedItems.map((item, index) => `
      <tr>
        <td>${(currentPage - 1) * PAGE_SIZE + index + 1}</td>
        <td>${item.student_name} (${item.student_id})</td>
        <td>${item.class_name} - ${item.section_name}</td>
        <td>${item.fee_type_name}</td>
        <td>Rs. ${item.total_amount}</td>
        <td>${item.status.toUpperCase()}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fee List Print</title>
            <style>
              body { font-family: sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
              th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; }
              h2 { color: #1e293b; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Student Fee Report</h2>
            <div>Generated for Page ${currentPage} | Total Records: ${filteredData.length}</div>
            <table>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Student</th>
                  <th>Class/Section</th>
                  <th>Fee Type</th>
                  <th>Total Amount</th>
                  <th>Status</th>
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

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((i) => i.id));
    }
  };

  const handleSelectOne = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : deleteId ? [deleteId] : [];
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => FeeServices.deleteStudentFees(id)));
      toast.success(`${ids.length} records deleted successfully`);
      fetchFees();
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
      {/* Table Container */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[450px] scrollbar-hide relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-[#f5f6fa]">
                <th className="px-4 py-1 w-10 border-b">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">S.N.</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Student Details</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Class & Fee Type</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Amount (Total/Paid)</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b">Due Date</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase border-b text-center">Status</th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24 border-b">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={8} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery ? <SearchX size={32} className="text-rose-300" /> : <Inbox size={32} className="text-gray-200" />}
                      <span className="text-sm font-bold text-[#364a63]">
                        {searchQuery ? "No matching records found." : "No fee records recorded."}
                      </span>
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
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.id)}
                          className="rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-2 text-[10px] text-[#526484]">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#364a63] font-bold uppercase flex items-center gap-1">
                            <User size={10} className="text-blue-500" /> {item.student_name}
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                            <Hash size={9} /> {item.student_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-700 font-bold uppercase flex items-center gap-1">
                            <Wallet size={10} className="text-indigo-500" /> {item.fee_type_name}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <School size={9} />class: {item.class_name} ({item.section_name})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-700">Rs. {item.total_amount}</span>
                          <span className="text-[10px] text-emerald-600 font-medium italic">Paid: Rs. {item.paid_amount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">
                          <CalendarClock size={11} /> {item.due_date}
                        </div>
                      </td>
                      <td className="px-6 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded active:scale-90 transition-all">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => { setSelectedIds([]); setDeleteId(item.id); setIsModalOpen(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded active:scale-90 transition-all">
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

        {/* Footer with Actions */}
        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-1 border-t bg-[#f5f6fa]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8094ae] mr-2">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </span>
              <button onClick={downloadPDF} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
                <Download size={12} /> PDF
              </button>
              <ThemedButton onClick={handlePrint} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-white bg-slate-600 border border-slate-200 rounded hover:bg-slate-700 active:scale-95 transition-all">
                <Printer size={12} /> Print
              </ThemedButton>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <span className="text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 px-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{selectedIds.length} Record(s) Selected</span>
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
        title={selectedIds.length > 0 ? "Delete Multiple Fee Records?" : "Remove Fee Record?"}
        message={selectedIds.length > 0 ? `Are you sure you want to delete ${selectedIds.length} fee records?` : "This action is permanent and might affect student financial history. Are you sure?"}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default StudentFeeTable;