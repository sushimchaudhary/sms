"use client";

import React, { useState } from "react";
import { Plus, Search, X, Receipt } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import PaymentTable from "@/components/dashboard/accounting/paymentTable";
import PaymentForm from "@/components/dashboard/accounting/paymentForm";

export default function PaymentPage() {
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
    <div className="space-y-3 font-mukta">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Fee Collection & Payments"
          description="Manage and track all student fee payments and collection history."
        />
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search student or method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={15} />}
              className="h-7 w-[250px]"
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

          {/* Add Payment Button */}
          <ThemedButton
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            size="sm"
            className="py-1.5 w-fit flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Collect Payment</span>
          </ThemedButton>
        </div>
      </div>

      {/* Table Component */}
      <PaymentTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
      />

      {/* Form Modal */}
      <PaymentForm
        isOpen={isModalOpen}
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}