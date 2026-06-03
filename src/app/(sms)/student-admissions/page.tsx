"use client";

import React from "react";
import { PageHeader } from "@/components/PageHeader";
import AdmissionForm from "@/components/dashboard/admissons/admissonsForm";

export default function ParentsPage() {
  return (
    <div className="space-y-2">
      {/* हेडर सेक्सन */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Student Admission"
          description="Register and manage student admissions."
        />
      </div>

      
        <AdmissionForm />
      
    </div>
  );
}