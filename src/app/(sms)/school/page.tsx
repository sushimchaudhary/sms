"use client";

import React, { useState } from "react";
import { Search, X, School as SchoolIcon } from "lucide-react";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { PageHeader } from "@/components/PageHeader";
import SchoolTable from "@/components/dashboard/school/schoolTable";
import SchoolForm from "@/components/dashboard/school/schoolForm";

export default function SchoolManagementPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleClose = () => {
    setIsOpen(false);
    setEditData(null);
  };

  const handleEdit = (data: any) => {
    setEditData(data);
    setIsOpen(true);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-3 ">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        
        <PageHeader 
          title="School Directory" 
          description="Manage registered schools, track their codes, and update contact information." 
        />

        <div className="flex items-center gap-3">
          {/* Premium Search Input */}
          <div className="relative w-72">
            <ThemedInput
              type="text"
              placeholder="Search school..."
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
            onClick={() => setIsOpen(true)}
            size="sm"
            className="px-5 py-1.5 w-fit"
          >
            <div className="flex items-center gap-2">
             
              <span>Register</span>
            </div>
          </ThemedButton>
        </div>
      </div>

      {/* School Table Component */}
      <SchoolTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
      />

      {/* School Form Modal */}
      <SchoolForm
        isOpen={isOpen}
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}