"use client";

import React, { useState } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, X, UserCheck } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import StaffAttendanceTable from "@/components/dashboard/attendance/staffAttendanceTable";
import StaffAttendanceForm from "@/components/dashboard/attendance/staffAttendacneForm";


export default function StaffAttendancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // हाजिरी सेभ भएपछि टेबल रिफ्रेस गर्ने
  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    handleClose();
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
    <div className="space-y-3 font-mukta">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Staff Attendance"
          description="Monitor and manage daily attendance records for teachers and administration staff."
        />

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search by staff name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={15} />}
              className="h-7 w-64"
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

          {/* Add Attendance Button */}
          <ThemedButton
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            size="sm"
            className="py-1.5 w-fit flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <UserCheck size={14} />
            <span>Mark Attendance</span>
          </ThemedButton>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-2">
        <StaffAttendanceTable
          onEdit={handleEdit}
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
        />
      </div>

      {/* Attendance Form Modal */}
      <StaffAttendanceForm
        isOpen={isModalOpen}
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}