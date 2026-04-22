"use client";

import React, { useState } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, X } from "lucide-react";
import TeachersTable from "@/components/dashboard/teacher/teacherTable";
import TeacherForm from "@/components/dashboard/teacher/teacherForm";
import { ThemedInput } from "@/components/ui/ThemedInput";

export default function TeachersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      setEditData(null);
    }, 300);
  };

  const handleOpen = () => {
    setEditData(null);
    setIsClosing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (data: any) => {
    setEditData(data);
    setIsModalOpen(true);
    setIsClosing(false);
  };

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Teacher Management"
          description="Register, manage, and monitor all teacher profiles and institutional codes."
        />

        <div className="flex items-center gap-3">
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={15} />}
              className="h-7"
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

          <ThemedButton
            onClick={handleOpen}
            size="sm"
            className=" py-1.5 w-fit flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Register Teacher</span>
          </ThemedButton>
        </div>
      </div>

      {/* Table Section */}
      <TeachersTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
      />

      {/* Form Modal */}
      <TeacherForm
        isOpen={isModalOpen}
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
