"use client";

import React, { useState } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, X } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import QuestionTable from "@/components/dashboard/exampaper/QuestionTable";
import QuestionForm from "@/components/dashboard/exampaper/QuestionForm";

// नोट: यो पेजले निश्चित Section ID मा काम गर्छ। 
// तपाईंले यो ID URL बाट (params) वा Parent component बाट प्राप्त गर्न सक्नुहुन्छ।
const CURRENT_SECTION_ID = 1; 
const CURRENT_PAPER_ID = 1;

export default function QuestionPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");





  const [formOpen, setFormOpen] = useState(false);
const [editData, setEditData] = useState<any>(null);
const [activeSectionId, setActiveSectionId] = useState<any>(null);
const [activePaperId, setActivePaperId] = useState<any>(null);

// + button थिच्दा
const handleAddQuestion = ({ sectionId, paperId }: { sectionId: any, paperId: any }) => {
  setEditData(null);          // add mode — no initial data
  setActiveSectionId(sectionId);
  setActivePaperId(paperId);
  setFormOpen(true);
};

// edit button थिच्दा
const handleEdit = (question: any) => {
  setEditData(question);
  setActiveSectionId(question.section);
  setActivePaperId(question.paper);  // question object मा paper id छ भने
  setFormOpen(true);
};
  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Question Management"
          description="Manage and organize your questions within the selected section."
        />

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search questions subject..."
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

          {/* Add Question Button */}
          <ThemedButton
            onClick={() => {
              setEditData(null);     
              setActiveSectionId(CURRENT_SECTION_ID); 
              setActivePaperId(CURRENT_PAPER_ID);     
              setFormOpen(true);
            }}
            size="sm"
            className="py-1.5 w-fit flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Add New Question</span>
          </ThemedButton>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-2">
        <QuestionTable
          onEdit={handleEdit}
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
          onAddQuestion={handleAddQuestion}   
        />
      </div>

      {/* Question Form Modal */}
      <QuestionForm
        isOpen={formOpen}
        initialData={editData}
        sectionId={activeSectionId}   // ← यो form मा auto-select हुन्छ
        paperId={activePaperId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); setRefreshTrigger(r => r + 1); }}
      />
    </div>
  );
}