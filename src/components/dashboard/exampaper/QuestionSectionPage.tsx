"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // useParams प्रयोग गर्नुहोस्
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, X } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import SectionTable from "@/components/dashboard/exampaper/queSectionTable";
import QuestionSectionForm from "@/components/dashboard/exampaper/queSectionForm";


interface Props {
  paperId: string; // यहाँ string अनिवार्य बनाउनुहोस्
}

export default function QuestionSectionPage({ paperId }: Props) {
  const params = useParams();
 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  if (!paperId) return <div>Loading...</div>; // ID नहुँदाको सुरक्षा

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Section Management"
          description={`Managing sections for Paper ID: ${paperId}`} // यहाँ ID देखिन्छ
        />

        <div className="flex items-center gap-3">
          <div className="relative">
            <ThemedInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-56"
            />
          </div>

          <ThemedButton
            onClick={() => { setEditData(null); setIsModalOpen(true); }}
            size="sm"
          >
            <Plus size={14} /> Add Section
          </ThemedButton>
        </div>
      </div>

      <SectionTable
        paperId={paperId}
        onEdit={(data) => { setEditData(data); setIsModalOpen(true); }}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
      />

      <QuestionSectionForm
        isOpen={isModalOpen}
        paperId={paperId}
        initialData={editData}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { setRefreshTrigger(prev => prev + 1); setIsModalOpen(false); }}
      />
    </div>
  );
}