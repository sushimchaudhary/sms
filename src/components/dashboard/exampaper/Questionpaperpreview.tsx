"use client";

/**
 * QuestionPaperPreview
 * ─────────────────────────────────────────────────────────
 * Fetches a full paper (with nested sections + questions)
 * and renders a print-ready exam paper layout.
 * Includes a "Print" button that triggers window.print().
 */

import React, { useEffect, useState } from "react";
import {
  X,
  Printer,
  Loader2,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { QuestionPaperServices } from "@/services/questionpaperServices";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface QuestionData {
  id: number;
  question_type: string;
  question: string;
  description?: string;
  marks: number | string;
  image?: string | null;
  order: number;
}

interface SectionData {
  id: number;
  title: string;
  heading?: string;
  total_marks: number;
  instructions?: string;
  order: number;
  questions: QuestionData[];
  calculated_marks: number;
}

interface PaperData {
  id: number;
  title: string;
  subject: string;
  class_name: string;
  section_name?: string;
  full_marks: number;
  pass_marks: number;
  duration: string;
  instructions?: string;
  status: string;
  sections: SectionData[];
  total_section_marks: number;
  created_at: string;
}

interface Props {
  paperId: number;
  isOpen: boolean;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function QuestionPaperPreview({ paperId, isOpen, onClose }: Props) {
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !paperId) return;
    setLoading(true);
    QuestionPaperServices.getPaper(paperId)
      .then(setPaper)
      .catch(() => toast.error("Failed to load paper"))
      .finally(() => setLoading(false));
  }, [isOpen, paperId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      {/* Modal shell */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 print:p-0 print:inset-auto print:static">
        <div className="w-full max-w-3xl max-h-[94vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden font-mukta print:shadow-none print:border-none print:rounded-none print:max-w-none print:max-h-none print:h-auto">

          {/* Toolbar (hidden on print) */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 print:hidden">
            <span className="text-sm font-bold text-gray-700">
              Preview — {paper?.title ?? "Loading…"}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                disabled={!paper}
                className="flex items-center gap-2 h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition disabled:opacity-50"
              >
                <Printer size={13} />
                Print
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition hover:rotate-90"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto print:overflow-visible" id="print-area">
            {loading ? (
              <div className="flex items-center justify-center h-40 gap-2 text-gray-400 print:hidden">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Loading paper…</span>
              </div>
            ) : paper ? (
              <ExamPaperLayout paper={paper} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(#print-area) { display: none !important; }
          #print-area { display: block !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}

// ── Exam Paper Layout ──────────────────────────────────────────────────────────

function ExamPaperLayout({ paper }: { paper: PaperData }) {
  return (
    <div className="p-8 print:p-6 space-y-6 text-gray-900 font-[Georgia,serif]">
      {/* School / header area — customise as needed */}
      <div className="text-center border-b-2 border-gray-800 pb-4 space-y-1">
        <p className="text-xs uppercase tracking-widest text-gray-500">
          Examination Paper
        </p>
        <h1 className="text-xl font-bold">{paper.title}</h1>
        <div className="flex flex-wrap justify-center gap-6 mt-2 text-sm">
          <MetaItem label="Subject" value={paper.subject} />
          <MetaItem
            label="Class"
            value={
              paper.section_name
                ? `${paper.class_name} — ${paper.section_name}`
                : paper.class_name
            }
          />
          <MetaItem label="Full Marks" value={String(paper.full_marks)} />
          <MetaItem label="Pass Marks" value={String(paper.pass_marks)} />
          <MetaItem
            label="Duration"
            value={paper.duration}
            icon={<Clock size={12} />}
          />
        </div>
      </div>

      {/* Global instructions */}
      {paper.instructions && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600 print:border-black">
          <p className="font-bold mb-1 uppercase tracking-wide text-[10px]">
            General Instructions
          </p>
          <p className="whitespace-pre-line">{paper.instructions}</p>
        </div>
      )}

      {/* Status warning for draft */}
      {paper.status === "draft" && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-700 print:hidden">
          <XCircle size={13} />
          This paper is still in <strong>Draft</strong> status.
        </div>
      )}

      {/* Sections */}
      {paper.sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((sec) => (
          <SectionBlock key={sec.id} section={sec} />
        ))}

      {/* Marks summary */}
      <div className="border-t border-gray-300 pt-3 flex justify-end gap-6 text-xs text-gray-500">
        <span>
          Total section marks:{" "}
          <strong className="text-gray-800">{paper.total_section_marks}</strong>
        </span>
        <span>
          Full marks:{" "}
          <strong className="text-gray-800">{paper.full_marks}</strong>
        </span>
      </div>
    </div>
  );
}

// ── Section block ──────────────────────────────────────────────────────────────

function SectionBlock({ section }: { section: SectionData }) {
  return (
    <div className="space-y-3">
      {/* Section heading */}
      <div className="flex items-baseline justify-between border-b border-gray-400 pb-1">
        <div>
          <span className="font-bold text-base">Section {section.title}</span>
          {section.heading && (
            <span className="ml-2 text-sm text-gray-600">
              — {section.heading}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-600">
          [{section.total_marks} Marks]
        </span>
      </div>

      {section.instructions && (
        <p className="text-xs italic text-gray-500">{section.instructions}</p>
      )}

      {/* Questions */}
      <div className="space-y-3">
        {section.questions
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((q, qi) => (
            <QuestionRow key={q.id} q={q} number={qi + 1} />
          ))}
      </div>
    </div>
  );
}

// ── Question row ───────────────────────────────────────────────────────────────

function QuestionRow({
  q,
  number,
}: {
  q: QuestionData;
  number: number;
}) {
  const isMatchImage = q.question_type === "match_image";
  const isTrueFalse = q.question_type === "true_false";

  return (
    <div className="flex gap-3 text-sm">
      <span className="font-semibold flex-shrink-0 w-6">{number}.</span>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between gap-2">
          <p className="whitespace-pre-wrap">{q.question}</p>
          <span className="flex-shrink-0 text-xs text-gray-500 font-medium">
            [{q.marks} M]
          </span>
        </div>

        {q.description && (
          <p className="text-xs text-gray-500 italic">{q.description}</p>
        )}

        {/* True/False answer lines */}
        {isTrueFalse && (
          <div className="flex gap-4 mt-1 text-xs">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-green-500" />
              True
            </span>
            <span className="flex items-center gap-1">
              <XCircle size={11} className="text-red-400" />
              False
            </span>
          </div>
        )}

        {/* Image */}
        {q.image && (
          <img
            src={q.image}
            alt="Question visual"
            className="mt-1 max-w-xs rounded border border-gray-200 print:max-w-[200px]"
          />
        )}

        {/* Answer blank lines for short/very short */}
        {["very_short", "fill_blank"].includes(q.question_type) && (
          <div className="border-b border-dotted border-gray-400 w-48 mt-2 h-5" />
        )}

        {["short", "medium"].includes(q.question_type) && (
          <div className="space-y-1 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-dotted border-gray-300 h-5"
              />
            ))}
          </div>
        )}

        {["long", "free"].includes(q.question_type) && (
          <div className="space-y-1 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-dotted border-gray-300 h-5"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Meta item ─────────────────────────────────────────────────────────────────

function MetaItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className="font-semibold flex items-center gap-1">
        {icon}
        {value}
      </span>
    </div>
  );
}