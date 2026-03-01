"use client";

import React, { useState, useEffect } from "react";
import CompanyTable from "@/components/dashboard/company/companyTable";
import CompanyForm from "@/components/dashboard/company/companyForm";
import { ThemedButton } from "@/components/ui/themedButton";

export default function CompanyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  
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
    <div className="space-y-6">
     
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-extrabold text-[#1e293b] tracking-tight">
            Company Management
          </h2>
          <p className="text-[12px] text-[#64748b] font-medium">
            Overview and configuration of your registered companies 
          </p>
        </div>

        <ThemedButton onClick={handleOpen} size="sm" className="px-5 py-1.5 w-fit">
          Create
        </ThemedButton>
      </div>

      
      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <CompanyTable />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          
          <div
            className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={handleClose}
          />

        
          <div 
            className={`relative w-full max-w-4xl max-h-[95vh] overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out ${
              isClosing 
                ? "opacity-0 scale-95 duration-200"
                : "opacity-100 scale-100 animate-in fade-in zoom-in-95 duration-300" 
            }`}
          >
            <CompanyForm 
              onClose={handleClose} 
              initialData={null} 
            />
          </div>
        </div>
      )}
    </div>
  );
}