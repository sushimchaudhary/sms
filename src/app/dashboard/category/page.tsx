"use client";

import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import CategoryTable from "@/components/dashboard/category/categoryTable";
import CategoryForm from "@/components/dashboard/category/categoryForm";

const initialCategories = [
  { id: 1, name: "Antibiotics", status: "active" },
  { id: 2, name: "Pain Relief", status: "active" },
  { id: 3, name: "First Aid", status: "active" },
  { id: 4, name: "Vitamins & Supplements", status: "active" },
  { id: 5, name: "Baby Care", status: "active" },
  { id: 6, name: "Cardiac Care", status: "active" },
  { id: 7, name: "Skin Care", status: "inactive" },
  { id: 8, name: "Diabetes Care", status: "active" },
  { id: 9, name: "Personal Hygiene", status: "active" },
  { id: 10, name: "Ayurvedic Medicine", status: "inactive" },
];

export default function CategoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Search Logic
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return initialCategories.filter((cat) =>
      cat.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Smoother Close Logic like Organization Page
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleOpen = () => {
    setIsClosing(false);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 font-mukta">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-extrabold text-[#1e293b] tracking-tight">
            Category Management
          </h2>
          <p className="text-[12px] text-[#64748b] font-medium">
            Organize your products into clean categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <ThemedInput
              type="text"
              placeholder="Search categories..."
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
          <ThemedButton onClick={handleOpen} size="sm" className="px-5 py-1.5">
            Create
          </ThemedButton>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <CategoryTable 
          data={filteredCategories} 
          isSearching={searchQuery.length > 0} 
        />
      </div>

      {/* Modal Section with Enhanced Animations */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop with stronger Blur effect */}
          <div
            className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={handleClose}
          />

          {/* Form Container with Zoom-in & Fade-in like Organization Form */}
          <div 
            className={`relative w-full max-w-2xl max-h-[95vh] overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out ${
              isClosing 
                ? "opacity-0 scale-95 duration-200" 
                : "opacity-100 scale-100 animate-in fade-in zoom-in-95 duration-300" 
            }`}
          >
            <CategoryForm 
              onClose={handleClose} 
              initialData={null} 
            />
          </div>
        </div>
      )}
    </div>
  );
}