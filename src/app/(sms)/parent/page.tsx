"use client";

import React, { useState } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, X } from "lucide-react";
import ParentTable from "@/components/dashboard/parent/parentTable";
import ParentForm from "@/components/dashboard/parent/parentForm";
import { ThemedInput } from "@/components/ui/ThemedInput";

export default function ParentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSuccess = () => setRefreshTrigger((prev) => prev + 1);

  const handleClose = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleEdit = (data: any) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-3 ">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Parent Management"
          description="Register and manage parent accounts linked to student profiles."
        />
        <div className="flex items-center gap-3">
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search parent..."
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
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            size="sm"
            className=" py-1.5 w-fit flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Register Parent</span>
          </ThemedButton>
        </div>
      </div>

      <ParentTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
      />

      <ParentForm
        isOpen={isModalOpen}
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
