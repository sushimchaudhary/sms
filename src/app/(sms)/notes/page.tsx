"use client";

import React, { useState, useEffect } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, X, FileText } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { ClassServices } from "@/services/classServices";
import { SectionServices } from "@/services/sectionServices";
import { SubjectServices } from "@/services/subjectServices";
import { SessionServices } from "@/services/sessionsServices";
import NotesForm from "@/components/dashboard/note/noteForm";
import NotesTable from "@/components/dashboard/note/noteTable";


export default function NotesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdowns, setDropdowns] = useState({
    classes: [],
    sections: [],
    subjects: [],
    sessions: [],
  });

  // Handle Success (Refresh Table)
  const handleSuccess = () => setRefreshTrigger((prev) => prev + 1);

  // Close Modal & Reset Edit Data
  const handleClose = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  // Open Modal for Editing
  const handleEdit = (data: any) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  // Fetch Dropdowns (Class, Section, etc.) for the Form
  const fetchDropdownData = async () => {
    try {
      // Yo services tapaiiko project structure anusar call garnu hola
      const [classes, sections, subjects, sessions] = await Promise.all([
        ClassServices.getAllClasses(),
        SectionServices.getAllSections(),
        SubjectServices.getAllSubjects(),
        SessionServices.getSessions(),
      ]);

      setDropdowns({
        classes: classes?.results || classes || [],
        sections: sections?.results || sections || [],
        subjects: subjects?.results || subjects || [],
        sessions: sessions?.results || sessions || [],
      });
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  return (
    <div className="space-y-3 font-mukta">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Study Materials & Notes"
          description="Upload, manage, and distribute digital notes and resources to students."
        />
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search notes or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={15} />}
              className="h-8 w-64" 
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

          {/* Add Button */}
          <ThemedButton
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            size="sm"
            className="py-1.5 w-fit flex items-center gap-2"
          >
            <Plus size={14} />
            <span className="text-[12px] font-bold uppercase tracking-tight">Post New Note</span>
          </ThemedButton>
        </div>
      </div>

      {/* Table Section */}
      <NotesTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
      />

      {/* Form Modal */}
      <NotesForm    
        isOpen={isModalOpen}
        initialData={editData}
        onClose={handleClose}
        onSuccess={handleSuccess}
        dropdowns={dropdowns} // Passing fetched data to form
      />
    </div>
  );
}