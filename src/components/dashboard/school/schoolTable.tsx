"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  SearchX,
  Inbox,
  ChevronLeft,
  ChevronRight,
  School,
  MapPin,
  CheckCircle2,
  XCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "../../delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { SchoolServices } from "@/services/schoolServices";
import { ConfigProvider, Select } from "antd";

interface SchoolTableProps {
  onEdit: (school: any) => void;
  refreshTrigger: number;
  searchQuery: string;
}

const PAGE_SIZE = 20;

const SchoolTable = ({
  onEdit,
  refreshTrigger,
  searchQuery,
}: SchoolTableProps) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSchools = async () => {
    try {
      setLoading(true);
   
      const res = await SchoolServices.getDetails();
      const allSchools = Array.isArray(res) ? res : res?.data || [];
      setData(allSchools);
    } catch (error) {
      console.error("Fetch Schools Error:", error);
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...data];

    // 1. Status Filter (Active/Inactive)
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter((item) => item.is_active === isActive);
    }

    // 2. Global Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.code?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.address?.toLowerCase().includes(query),
      );
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [statusFilter, searchQuery, data]);

  useEffect(() => {
    fetchSchools();
  }, [refreshTrigger]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await SchoolServices.deleteDetails(deleteId);
       SchoolServices.clearCache(); 
      toast.success("School deleted successfully");
      setData((prev) =>
        prev.filter((item) => (item._id || item.id) !== deleteId),
      );
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete school");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-1">
      {/* Filter Section */}
      <div className="flex justify-end items-center gap-3 mb-2">
        <span className="text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
          Filter Status:
        </span>
        <ConfigProvider
          theme={{
            token: {
              controlHeight: 28,
              fontSize: 12,
              borderRadius: 4,
              colorBorder: "#e5e7eb",
            },
          }}
        >
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: 140 }}
            className="text-xs"
          >
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
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase w-16">
                  S.N
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">
                  School Details
                </th>
                
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">
                  Contact & Location
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">
                  Status
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">
                  Action
                </th>
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
                        {searchQuery
                          ? "No matching schools found."
                          : "No school records found."}
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
                    <td className="px-6 py-2 text-xs text-[#526484]">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}.
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100 flex-shrink-0">
                          <School size={16} />
                        </div>
                        <div>
                          <div className="text-[11px] text-[#526484] font-medium uppercase tracking-tight">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-cyan-600 font-bold">
                            {item.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-2">
                      <div className="text-[11px] text-[#526484] font-medium mb-0.5">
                        {item.email}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#8094ae]">
                        {/* Address Section */}
                        <div className="flex items-center gap-1">
                          <MapPin size={10} className="text-gray-400" />
                          <span>{item.address}</span>
                        </div>

                        
                        <span className="text-gray-300">•</span>

                        {/* Phone Section */}
                        <div className="flex items-center gap-1">
                          <Phone size={10} className="text-gray-400" />
                          <span>{item.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2">
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
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-all"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(item._id || item.id);
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

        {/* Pagination Section */}
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
                className="p-1 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-bold">
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

      <ConfirmModal
        isOpen={isModalOpen}
        title="Delete School?"
        message="Are you sure? This will remove all data associated with this school."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SchoolTable;
