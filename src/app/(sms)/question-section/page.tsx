"use client";

import React, { useState } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, X, Layers } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import SectionTable from "@/components/dashboard/exampaper/queSectionTable";
import QuestionSectionForm from "@/components/dashboard/exampaper/queSectionForm";

// यदि यो पेजले कुनै निश्चित paperId लिन्छ भने (URL बाट वा Props बाट) 
// त्यसलाई यहाँ परिभाषित गर्नुहोस्। उदाहरणको लागि:
const CURRENT_PAPER_ID = 1; // यो गतिशील (Dynamic) बनाउन सक्नुहुन्छ

export default function QuestionSectionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Data successfully save भएपछि table refresh गर्ने logic
  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setIsModalOpen(false); // Modal बन्द गर्ने
    setEditData(null);     // Form reset गर्ने
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
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Section Management"
          description="Create and manage sections for your question papers."
        />

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={15} />}
              className="h-7 w-56"
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

          {/* Add Section Button */}
          <ThemedButton
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            size="sm"
            className="py-1.5 w-fit flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Add New Section</span>
          </ThemedButton>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-2">
        <SectionTable
          paperId={CURRENT_PAPER_ID} // यहाँ आफ्नो paperId पास गर्नुहोस्
          onEdit={handleEdit}
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
        />
      </div>

      {/* Section Form Modal */}
      <QuestionSectionForm
        isOpen={isModalOpen}
        paperId={CURRENT_PAPER_ID} // Form मा पनि paperId पठाउनुहोस्
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}