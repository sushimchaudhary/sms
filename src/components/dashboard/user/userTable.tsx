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
} from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "../../delete/confirmModel";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
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

// Roles List (Filtering ko lagi)
const ROLE_LABELS: Record<string, string> = {
  admin: "School Admin",
  teacher: "Teacher",
  staff: "Staff",
  student: "Student",
  parent: "Parent",
};

const UserTable = ({
  onEdit,
  refreshTrigger,
  searchQuery,
  schools = [],
}: UserTableProps) => {
  const [data, setData] = useState<any[]>([]); // Original fetched data
  const [filteredData, setFilteredData] = useState<any[]>([]); // Filtered data for display
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    console.log("Current Item:", data);
    try {
      setLoading(true);
      const res = await UserServices.getDetails({ search: searchQuery });

      // Fix 1: API response handle (res nai array ho bhane)
      const allUsers = Array.isArray(res) ? res : res?.data || [];

      const userInfoCookie = Cookies.get("user_info");
      const loggedInUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
      const currentUserRole = loggedInUser?.role?.toLowerCase();

      let baseData;
      // Security: Non-SuperAdmin le SuperAdmin users dekhnu hudaina
      if (currentUserRole === "superadmin") {
        baseData = allUsers;
      } else {
        baseData = allUsers.filter(
          (user: any) => user.role?.toLowerCase() !== "superadmin",
        );
      }

      setData(baseData);
    } catch (error) {
      console.error("Fetch Users Error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...data];

    // 1. Role Filter
    if (selectedRole !== "all") {
      result = result.filter(
        (user) => user.role?.toLowerCase() === selectedRole.toLowerCase(),
      );
    }

    // 2. Global Search Filter (All Fields)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((user) => {
        const fullName =
          `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
        const email = (user.email || "").toLowerCase();
        const username = (user.username || "").toLowerCase();
        const role = (user.role || "").toLowerCase();
        const contact = (user.contact || user.phone || "").toLowerCase();
        const schoolName = (
          user.school_name ||
          user.school?.name ||
          ""
        ).toLowerCase();

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          username.includes(query) ||
          role.includes(query) ||
          contact.includes(query) ||
          schoolName.includes(query)
        );
      });
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [selectedRole, searchQuery, data]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [refreshTrigger, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await UserServices.deleteDetails(deleteId);
      toast.success("User deleted successfully");
      setData((prev) => prev.filter((item) => item._id !== deleteId));
      setIsModalOpen(false);
      if (paginatedItems.length === 1 && currentPage > 1)
        setCurrentPage((p) => p - 1);
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-1">
      {/* Role Filter Selector with Ant Design */}
      <div className="flex justify-end items-center gap-3 mb-2">
        <span className="text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
          Filter by Role:
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
            value={selectedRole}
            onChange={(value) => setSelectedRole(value)}
            style={{ width: 150 }}
            placeholder="Select Role"
            className="text-xs"
            classNames={{
              popup: {
                root: "text-xs",
              },
            }}
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
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase w-16">
                  S.N
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">
                  User Details
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">
                  Role
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">
                  School
                </th>
                <th className="px-6 py-2 text-[11px] font-bold text-[#8094ae] uppercase">
                  Contact
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-[#8094ae] uppercase text-right w-24">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoadingSkeleton rows={5} cols={6} />
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
                          ? "No matching users found."
                          : "No staff users found."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  console.log("Current Item:", item);
                  return (
                    <tr
                      key={item._id || item.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-2 text-xs text-[#526484]">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}.
                      </td>
                      <td className="px-6 py-2">
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
                          <div>
                            {/* Handling first_name/last_name from your API log */}
                            <div className="text-[11px] text-[#526484] font-medium">
                              {item.fullName ||
                                `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
                                "N/A"}
                            </div>
                            <div className="text-[10px] text-[#8094ae]">
                              @{item.username || item.email?.split("@")[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.role?.toLowerCase() === "superadmin"
                              ? "bg-purple-100 text-purple-600"
                              : item.role?.toLowerCase() === "admin"
                                ? "bg-blue-100 text-blue-600"
                                : item.role?.toLowerCase() === "teacher"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : item.role?.toLowerCase() === "staff"
                                    ? "bg-orange-100 text-orange-600"
                                    : item.role?.toLowerCase() === "student"
                                      ? "bg-indigo-100 text-indigo-600"
                                      : item.role?.toLowerCase() === "parent"
                                        ? "bg-rose-100 text-rose-600"
                                        : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.role}
                        </span>
                      </td>

                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          {item.school && (
                            <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 flex-shrink-0">
                              <School size={12} />
                            </div>
                          )}
                          <div>
                            <div className="text-[11px] text-[#526484] font-medium uppercase tracking-tight">
                              {(() => {
                                if (
                                  typeof item.school === "object" &&
                                  item.school?.name
                                ) {
                                  return item.school.name;
                                }
                                if (item.school_name) {
                                  return item.school_name;
                                }
                                if (item.school && schools) {
                                  const found = schools.find(
                                    (s: any) =>
                                      s.id === item.school ||
                                      s._id === item.school,
                                  );
                                  return found ? found.name : "Unknown School";
                                }
                                return (
                                  <span className="text-rose-400 italic font-normal">
                                    No School Assigned
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="text-[11px] text-[#526484] font-medium">
                          {item.email}
                        </div>
                        <div className="text-[10px] text-[#8094ae]">
                          {item.phone || "No Contact"}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-blue-500 hover:scale-110 transition-transform"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteId(item._id || item.id);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-red-500 hover:scale-110 transition-transform"
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

        <ConfirmModal
          isOpen={isModalOpen}
          title="Delete User?"
          message="This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsModalOpen(false)}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};

export default UserTable;
