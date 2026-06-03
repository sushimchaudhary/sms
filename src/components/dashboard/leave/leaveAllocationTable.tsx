"use client";

import React, { useState, useEffect } from "react";
import { 
  Pencil, Trash2, User, Eye, Calendar, Filter, ChevronDown 
} from "lucide-react";
import { toast } from "sonner";
import { Dropdown, Modal, Tag, Button } from "antd"; 
import type { MenuProps } from "antd";
import ConfirmModal from "@/components/delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { LeaveAllocationServices } from "@/services/leaveAllocationServices";

import useAuth from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/context/ThemeContext";
import { SessionServices } from "@/services/sessionsServices";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface APILeaveAllocation {
  id: number;
  teacher_name: string | null;
  staff_name: string | null;
  created_at: string;
  updated_at: string;
  casual_leave: number;
  sick_leave: number;
  festival_leave: number;
  maternity_leave: number;
  funeral_leave: number;
  school: number;
  session: number; // Yo primary object vitra id (e.g., 11) aairaheko chha
  teacher: number | null;
  staff: number | null;
}

interface AcademicSession {
  id: number;
  name: string; // e.g., "2084-2085"
  is_active: boolean;
  school: number;
}

interface LeaveAllocationTableProps {
  onEdit: (data: APILeaveAllocation) => void;
  refreshTrigger: number;
  searchQuery?: string;
}

type RoleFilter = "all" | "teacher" | "staff";
const PAGE_SIZE = 20;

const LeaveAllocationTable = ({ onEdit, refreshTrigger, searchQuery = "" }: LeaveAllocationTableProps) => {
  const { primaryColor } = useTheme();
  const [list, setList] = useState<APILeaveAllocation[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]); // Session Pool Map state
  const [filteredData, setFilteredData] = useState<APILeaveAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeBreakdown, setActiveBreakdown] = useState<APILeaveAllocation | null>(null);

  const { loggedInUser } = useAuth();
  const role = (loggedInUser?.role || "").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";

  // ─── Dynamic Session Name Finder ─────────────────────────────────────────────
  const getSessionName = (sessionId: number): string => {
    const found = sessions.find((s) => s.id === sessionId);
    return found ? found.name : `Session (${sessionId})`; 
  };

  const calculateTotalAllocated = (item: APILeaveAllocation): number => {
    return (
      (item.casual_leave || 0) +
      (item.sick_leave || 0) +
      (item.festival_leave || 0) +
      (item.maternity_leave || 0) +
      (item.funeral_leave || 0)
    );
  };

  const getEmployeeName = (item: APILeaveAllocation): string =>
    item.teacher_name || item.staff_name || "Unknown";

  const getEmployeeRole = (item: APILeaveAllocation): string => {
    return item.teacher ? "Teacher" : item.staff ? "Staff" : "N/A";
  };

  // ─── Master Sync Fetch (Sessions + Allocations) ──────────────────────────────
  const initMasterData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Sessions first to ensure mapping array is full
      // Note: Tapaiko actual session service function call mathi use garnuhola
      const sessionRes = await SessionServices.getSessions(); 
      const parsedSessions: AcademicSession[] = Array.isArray(sessionRes) 
        ? sessionRes 
        : sessionRes?.results || sessionRes?.data || [];
      setSessions(parsedSessions);

      // 2. Fetch Allocations
      const res = await LeaveAllocationServices.getAllLeaveAllocations();
      const allData: APILeaveAllocation[] = Array.isArray(res) ? res : res?.results || res?.data || [];

      let visible = allData;
      if (!isAdmin) {
        const myTeacherId = loggedInUser?.teacher?.id;
        const myStaffId = loggedInUser?.staff?.id;
        visible = allData.filter(
          (item) =>
            (item.teacher && item.teacher === myTeacherId) ||
            (item.staff && item.staff === myStaffId)
        );
      }

      setList([...visible].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch {
      toast.error("Failed to load required master allocation data Detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initMasterData(); }, [refreshTrigger]);

  // ─── Client Filter Detail Engine ────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = list.filter((item) => {
      const name = getEmployeeName(item).toLowerCase();
      const sessionName = getSessionName(item.session).toLowerCase(); // Match search parameters by text name
      
      const matchSearch = !q || name.includes(q) || sessionName.includes(q);
      const matchRole = roleFilter === "all" || getEmployeeRole(item).toLowerCase() === roleFilter;
      return matchSearch && matchRole;
    });

    setFilteredData(result);
    setCurrentPage(1);
  }, [searchQuery, list, roleFilter, sessions]);

  const paginatedItems = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSingleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await LeaveAllocationServices.deleteLeaveAllocation(deleteId);
      toast.success("Allocation record dismissed successfully");
      initMasterData();
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to discard allocations");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const dropdownItems: MenuProps["items"] = [
    { key: "all", label: "All Roles" },
    { key: "teacher", label: "Teacher Only" },
    { key: "staff", label: "Staff Only" },
  ];

  return (
    <div className="space-y-3 font-mukta">
      
      {/* ── Filter Topbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Dropdown 
              menu={{ items: dropdownItems, onClick: (e) => setRoleFilter(e.key as RoleFilter) }} 
              trigger={["click"]}
              placement="bottomLeft"
            >
              <Button size="small" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white border border-gray-200 shadow-xs hover:bg-gray-50">
                <Filter size={11} className="text-slate-400" />
                <span>Filter: {roleFilter === "all" ? "All Roles" : roleFilter.toUpperCase()}</span>
                <ChevronDown size={11} className="text-gray-400 ml-1" />
              </Button>
            </Dropdown>
          )}
        </div>
      </div>

      {/* ── Main Data Table ── */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[450px]">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#f5f6fa] sticky top-0 z-10">
                {["S.N.", "Employee Detail", "Academic Session", "Role Type", "Allocated Quota", "Detailed Breakdown", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-bold text-[#8094ae] uppercase border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={4} cols={7} />
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm font-semibold text-gray-400">No active balance configurations found.</td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-2 text-[11px] text-gray-500">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-2 text-[11px] font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-blue-500" />
                        <span>{getEmployeeName(item)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-amber-50 border border-amber-100 rounded px-2 py-0.5 w-max">
                        <Calendar size={11} className="text-amber-500" />
                        {/* ID (11) mathi lookup garera dynamic text ("2084-2085") dekhaucha */}
                        <span>{getSessionName(item.session)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        getEmployeeRole(item) === "Teacher" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-teal-50 text-teal-600 border-teal-100"
                      }`}>{getEmployeeRole(item)}</span>
                    </td>
                    <td className="px-4 py-2 text-[11px] font-black text-slate-800">{calculateTotalAllocated(item)} Days Total</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setActiveBreakdown(item)}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded border bg-transparent transition-all active:scale-95 hover:bg-opacity-10"
                        style={{ 
                            color: primaryColor, 
                            borderColor: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${primaryColor}10`; // Hover huda 10% opacity ko light background aunchha
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        >
                        <Eye size={12} style={{ color: primaryColor }} /> 
                        <span>View Detail</span>
                        </button>
                    </td>
                    <td className="px-4 py-2">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button onClick={() => onEdit(item)} className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => { setDeleteId(item.id); setIsModalOpen(true); }} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Ant Design Animated Breakdown Modal ── */}
      <Modal
        title={
          <div className="pt-1">
            <h3 className="text-sm font-black text-slate-800">Leave Balance Distribution</h3>
            {activeBreakdown && (
              <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                Target: <span className="font-bold text-slate-700">{getEmployeeName(activeBreakdown)}</span> | Session: <span className="font-bold text-amber-600">{getSessionName(activeBreakdown.session)}</span>
              </p>
            )}
          </div>
        }
        open={!!activeBreakdown}
        onCancel={() => setActiveBreakdown(null)}
        footer={[
          <Button key="close" type="primary" size="small" style={{ backgroundColor: primaryColor }} onClick={() => setActiveBreakdown(null)}>
            Close Detail
          </Button>
        ]}
        centered
        destroyOnClose
        className="font-mukta"
        width={400}
      >
        {activeBreakdown && (
          <div className="py-3 space-y-2">
            {[
              { label: "Casual Leave", val: activeBreakdown.casual_leave, color: "blue" },
              { label: "Sick Leave", val: activeBreakdown.sick_leave, color: "red" },
              { label: "Festival Leave", val: activeBreakdown.festival_leave, color: "warning" },
              { label: "Maternity Leave", val: activeBreakdown.maternity_leave, color: "purple" },
              { label: "Funeral Leave", val: activeBreakdown.funeral_leave, color: "default" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all">
                <span className="text-[11px] font-bold text-slate-600">{row.label}</span>
                <Tag color={row.color} className="font-bold text-[10px] min-w-[55px] text-center">
                  {row.val || 0} Days
                </Tag>
              </div>
            ))}
            
            <div className="pt-3 border-t border-dashed flex justify-between items-center text-[11px] font-black text-slate-900">
              <span>Aggregated Sum Quota:</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {calculateTotalAllocated(activeBreakdown)} Days
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ── System Confirm Trash Modal ── */}
      <ConfirmModal
        isOpen={isModalOpen}
        title="Remove Allocation Data?"
        message="Are you sure you want to completely discard this allocation quota rule?"
        onConfirm={handleSingleDelete}
        onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
        loading={deleteLoading}
      />
    </div>
  );
};

export default LeaveAllocationTable;