"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import UserTable from "@/components/dashboard/user/userTable";
import { RegisterForm } from "@/components/dashboard/user/registerForm";
import { PageHeader } from "@/components/PageHeader";
import { SchoolServices } from "@/services/schoolServices";

export default function UserManagementPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [schoolList, setSchoolList] = useState<any[]>([]);

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

  useEffect(() => {
  const loadSchools = async () => {
    try {
      const res = await SchoolServices.getDetails();
      const schools = Array.isArray(res) ? res : res?.data || [];
      setSchoolList(schools);
    } catch (error) {
      console.error("Failed to load schools for dropdown");
    }
  };
  loadSchools();
}, []);


  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        
        <PageHeader 
          title="User Directory" 
          description="Manage your team, customize roles, and control access permissions." 
        />

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <ThemedInput
              type="text"
              placeholder="Search user..."
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
            Register
          </ThemedButton>
        </div>
      </div>

      {/* Table */}
      <UserTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
        schools={schoolList}
      />

      {/* Modal — animation handled inside RegisterForm */}
      <RegisterForm
        isOpen={isOpen}
        schools={schoolList}
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}