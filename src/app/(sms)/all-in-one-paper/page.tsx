"use client";

import QuestionPaperBuilder from "@/components/dashboard/exampaper/Questionpaperbuilder";
import { PageHeader } from "@/components/PageHeader";

export default function QuestionPaperPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Question Paper Builder"
        description="Create and manage your question papers step by step."
      />

      {/* Renders inline — no popup, no modal */}
      <QuestionPaperBuilder />
    </div>
  );
}