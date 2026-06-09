"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown, ChevronRight, Pencil, BookOpen, Clock, Award,
  Trash2, Plus, FileText, Hash, ImageIcon, AlignLeft, Printer,
  Loader2, Eye, X, Save, CheckCircle2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { QuestionPaperServices } from "@/services/questionpaperServices";
import ConfirmModal from "@/components/delete/confirmModel";
import { useTheme } from "@/lib/context/ThemeContext";
import { SchoolServices } from "@/services/schoolServices";
import { ConfigProvider, Select, Input, InputNumber } from "antd";
import { QuestionTableSkeleton } from "@/components/ui/QuestionTableSkelton";

const { TextArea } = Input;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE_MB    = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const STATUS_STYLE: Record<string, string> = {
  final:   "bg-green-100 text-green-700",
  draft:   "bg-yellow-100 text-yellow-700",
  printed: "bg-blue-100 text-blue-700",
};

const QUESTION_TYPES = [
  { value: "very_short",  label: "Very Short" },
  { value: "short",       label: "Short" },
  { value: "medium",      label: "Medium" },
  { value: "long",        label: "Long" },
  { value: "free",        label: "Free Question" },
  { value: "true_false",  label: "True / False" },
  { value: "fill_blank",  label: "Fill in the Blank" },
  { value: "read_answer", label: "Read & Answer" },
  { value: "match_text",  label: "Match Following (Text)" },
  { value: "match_image", label: "Match Following (Image)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface QuestionDraft {
  id?: number;
  question_type: string;
  question: string;
  description: string;
  marks: number | string;
  order: number;
  status: "draft" | "final";
  image?: File | null;
  imagePreview?: string | null;
  imageError?: string | null;
  saved: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — strip draft questions from sections
// ─────────────────────────────────────────────────────────────────────────────
const filterDraftQuestions = (sections: any[]) =>
  sections.map((section) => ({
    ...section,
    questions: (section.questions || []).filter((q: any) => q.status !== "draft"),
  }));

// ─────────────────────────────────────────────────────────────────────────────
// FieldGroup helper
// ─────────────────────────────────────────────────────────────────────────────
function FieldGroup({
  label, required = false, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AutoOpenForm — fires once when a section has 0 questions and no pending form
// ─────────────────────────────────────────────────────────────────────────────
function AutoOpenForm({
  sectionId, questionCount, newQuestions, onInit,
}: {
  sectionId: number; questionCount: number;
  newQuestions: Record<number, any[]>; onInit: () => void;
}) {
  const hasInit = React.useRef(false);
  useEffect(() => {
    if (!hasInit.current && questionCount === 0 && !(newQuestions[sectionId]?.length > 0)) {
      hasInit.current = true;
      onInit();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline QuestionCard
// ─────────────────────────────────────────────────────────────────────────────
function InlineQuestionCard({
  q, qi, saving, primaryColor, sectionId,
  onUpdate, onSave, onCancel, onImageChange,
}: {
  q: QuestionDraft; qi: number; saving: boolean; primaryColor: string; sectionId: number;
  onUpdate: (field: keyof QuestionDraft, val: any) => void;
  onSave: () => void; onCancel: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`border rounded overflow-hidden ${q.saved ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      {/* Card header row */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none hover:bg-gray-50/60 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">Q{qi + 1}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            {QUESTION_TYPES.find((t) => t.value === q.question_type)?.label ?? q.question_type}
          </span>
          <span className="text-xs text-gray-600 truncate">
            {q.question || <span className="text-gray-300 italic">No text yet</span>}
          </span>
          {q.saved && <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] text-gray-400">{q.marks || 0}m</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ml-1 ${STATUS_STYLE[q.status] ?? "bg-gray-100 text-gray-500"}`}>
            {q.status}
          </span>
          <ChevronRight size={12} className={`text-gray-400 transition-transform ml-1 ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-3 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Question Type">
              <Select
                value={q.question_type}
                onChange={(val) => onUpdate("question_type", val)}
                style={{ width: "100%", fontSize: 12, height: 34 }}
                options={QUESTION_TYPES.map((t) => ({ label: t.label, value: t.value }))}
              />
            </FieldGroup>
            <FieldGroup label="Marks" required>
              <InputNumber
                value={q.marks as number}
                onChange={(val) => onUpdate("marks", val)}
                placeholder="5"
                min={0}
                style={{ width: "100%", fontSize: 12, height: 34 }}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Question Text" required>
            <TextArea
              value={q.question}
              onChange={(e) => onUpdate("question", e.target.value)}
              rows={3}
              placeholder="Write the question here…"
              style={{ fontSize: 12, resize: "none" }}
            />
          </FieldGroup>

          <FieldGroup label="Description / Guideline (optional)">
            <TextArea
              value={q.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              rows={2}
              placeholder="Any note for students"
              style={{ fontSize: 12, resize: "none" }}
            />
          </FieldGroup>

          <FieldGroup label="Image (optional)">
            {q.imagePreview ? (
              <div className="flex items-center gap-2">
                <img
                  src={q.imagePreview}
                  alt=""
                  className="w-20 h-20 object-cover rounded border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdate("image", null);
                    onUpdate("imagePreview", null);
                    onUpdate("imageError", null);
                  }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <label
                  className={`flex items-center gap-2 h-9 px-3 border border-dashed rounded cursor-pointer hover:bg-gray-50 text-xs transition-colors ${
                    q.imageError ? "border-red-400 bg-red-50" : "border-gray-300 text-gray-400"
                  }`}
                >
                  <ImageIcon size={12} className={q.imageError ? "text-red-400" : ""} />
                  <span className={q.imageError ? "text-red-500" : ""}>
                    Upload image{" "}
                    <span className="text-gray-300 text-[10px]">(max {MAX_IMAGE_SIZE_MB} MB)</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageChange}
                  />
                </label>
                {q.imageError && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium leading-tight">
                    <svg
                      width="11" height="11" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      className="flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="13" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {q.imageError}
                  </p>
                )}
              </div>
            )}
          </FieldGroup>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Status">
              <Select
                value={q.status}
                onChange={(val) => onUpdate("status", val as "draft" | "final")}
                style={{ width: "100%", fontSize: 12, height: 34 }}
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Final", value: "final" },
                ]}
              />
            </FieldGroup>
            <FieldGroup label="Order">
              <InputNumber
                value={q.order}
                onChange={(val) => onUpdate("order", Number(val))}
                min={1}
                style={{ width: "100%", fontSize: 12, height: 34 }}
              />
            </FieldGroup>
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-500 border border-red-500 hover:bg-red-100 px-2.5 py-1 rounded transition-colors"
            >
              <X size={11} /> Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !!q.imageError}
              className="flex items-center gap-1.5 h-7 px-3 text-white text-xs font-semibold rounded transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              Save Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Real Browser Print
// ─────────────────────────────────────────────────────────────────────────────
const openPrintWindow = async (paperInfo: any, sections: any[]) => {
  let school: any = null;
  try {
    const schools = await SchoolServices.getDetails();
    school = Array.isArray(schools) ? schools[0] : schools;
  } catch {
    school = null;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    toast.error("Popup blocked. Allow popups and try again.");
    return;
  }

  const schoolName    = school?.name     || paperInfo.school_name || "School Name";
  const schoolAddress = school?.address  || "";
  const schoolPhone   = school?.phone    || "";
  const schoolEmail   = school?.email    || "";
  const schoolLogo    = school?.logo_url || school?.logo || "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${paperInfo.title} - ${paperInfo.subject_name_display}</title>
  <style>
    @media print { @page { margin: 10mm; size: auto; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { -webkit-print-color-adjust: exact; font-family: sans-serif; background: #fff; color: #111; padding: 40px 60px; font-size: 13px; line-height: 1.6; }
    .school-header { display: flex; align-items: center; justify-content: center; gap: 18px; padding-bottom: 14px; margin-bottom: 14px; }
    .school-logo { width: 70px; height: 70px; object-fit: contain; flex-shrink: 0; }
    .school-logo-placeholder { width: 70px; height: 70px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #6b7280; flex-shrink: 0; }
    .school-info { text-align: center; }
    .school-name { font-size: 20px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
    .school-sub { font-size: 11px; color: #444; margin-top: 2px; }
    .exam-title { font-size: 14px; font-weight: bold; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-row { display: flex; justify-content: space-between; align-items: flex-start; margin: 12px 0; font-size: 12px; padding-bottom: 10px; }
    .meta-left { text-align: left; } .meta-right { text-align: right; } .meta-center { text-align: center; }
    .section { margin-top: 22px; }
    .section-header { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1.5px solid #111; border-bottom: 1px solid #333; padding: 6px 0; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; gap: 12px; }
    .section-heading { font-size: 12px; font-style: italic; color: #444; margin-bottom: 10px; text-align: center; }
    .question-list { list-style: none; }
    .question-item { display: flex; gap: 3px; align-items: flex-start; padding: 1px 0; font-size: 16px; }
    .q-num { min-width: 20px; flex-shrink: 0; } .q-body { flex: 1; } .q-text { font-size: 16px; }
    .q-desc { font-size: 12px; color: #555; font-style: italic; margin-top: 3px; }
    .q-image { margin-top: 5px; max-height: 120px; max-width: 220px; display: block; margin-left: auto; margin-right: auto; }
    .q-marks { font-weight: bold; font-size: 12px; min-width: 40px; text-align: right; flex-shrink: 0; }
    .footer { margin-top: 40px; border-top: 1.5px solid #000; padding-top: 20px; text-align: center; }
    @media print { body { padding: 20px 40px; } .section { page-break-inside: avoid; } .question-item { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="school-header">
    ${schoolLogo
      ? `<img src="${schoolLogo}" class="school-logo" alt="School Logo" onerror="this.style.display='none'" />`
      : `<div class="school-logo-placeholder">${schoolName.charAt(0)}</div>`
    }
    <div class="school-info">
      <div class="school-name">${schoolName}</div>
      ${schoolAddress || schoolPhone || schoolEmail
        ? `<div class="school-sub">${[schoolAddress, schoolPhone, schoolEmail].filter(Boolean).join(" | ")}</div>`
        : ""}
      <div class="exam-title">${paperInfo.title || "Examination"}</div>
      <div style="font-size:12px; margin-top:3px;">
        Subject: ${paperInfo.subject_name_display || ""} &nbsp;|&nbsp; Class: ${paperInfo.class_name || "—"}
      </div>
    </div>
  </div>
  <div class="meta-row">
    <div class="meta-left">
      <div><strong>Full Marks:</strong> ${paperInfo.full_marks}</div>
      <div><strong>Pass Marks:</strong> ${paperInfo.pass_marks}</div>
    </div>
    <div class="meta-center">
      <div style="font-size:11px; color:#555;">Attempt <strong>all</strong> questions.</div>
    </div>
    <div class="meta-right">
      <div><strong>Time:</strong> ${paperInfo.duration} Hour(s)</div>
      <div><strong>Date:</strong> ${new Date().toLocaleDateString("ne-NP-u-ca-buddhist", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  </div>
  ${sections.map((section: any) => `
    <div class="section">
      <div class="section-header">
        <span>Group '${section.title.toUpperCase()}'</span>
        <span>[${section.total_marks} Marks]</span>
      </div>
      ${section.heading ? `<div class="section-heading">${section.heading}</div>` : ""}
      <ol class="question-list">
        ${section.questions.map((q: any, qIdx: number) => `
          <li class="question-item">
            <span class="q-num">${qIdx + 1}.</span>
            <div class="q-body">
              <div class="q-text">${q.question}</div>
              ${q.description ? `<div class="q-desc">( ${q.description} )</div>` : ""}
              ${q.image ? `<img src="${q.image}" class="q-image" alt="question image" onerror="this.style.display='none'" />` : ""}
            </div>
            <span class="q-marks">[${Number(q.marks)}]</span>
          </li>
        `).join("")}
      </ol>
    </div>
  `).join("")}
  <div class="footer">
    <div style="font-size: 13px; font-weight: bold; color: #555;">*** Good Luck ***</div>
  </div>
  <script>
    window.onload = function () {
      var images = document.querySelectorAll("img");
      if (images.length === 0) { window.print(); window.onafterprint = function () { window.close(); }; return; }
      var loaded = 0;
      images.forEach(function(img) {
        if (img.complete) {
          loaded++;
          if (loaded === images.length) { window.print(); window.onafterprint = function () { window.close(); }; }
        } else {
          img.onload = img.onerror = function () {
            loaded++;
            if (loaded === images.length) { window.print(); window.onafterprint = function () { window.close(); }; }
          };
        }
      });
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ─────────────────────────────────────────────────────────────────────────────
// Print Preview Modal
// ─────────────────────────────────────────────────────────────────────────────
const PrintPreviewModal = ({
  isOpen, onClose, onConfirm, paperInfo, sections, loading, primaryColor,
}: any) => {
  if (!isOpen || !paperInfo) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-sm shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
          <div
            className="px-5 py-4 flex justify-between items-center border-b flex-shrink-0"
            style={{ background: `linear-gradient(to right, ${primaryColor}10, ${primaryColor}18)` }}
          >
            <div>
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Printer size={15} style={{ color: primaryColor }} /> Print Preview
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Review before printing</p>
            </div>
            <button onClick={onClose} className="text-red-500 hover:text-red-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-3">
            <div className="rounded-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ backgroundColor: `${primaryColor}10` }}>
                <h3 className="font-bold text-sm text-gray-900">
                  {paperInfo.title} — {paperInfo.subject_name_display}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Class: {paperInfo.class_name || "—"}</p>
              </div>
              <div className="px-4 py-3 flex gap-6 text-xs text-gray-600 flex-wrap">
                <span className="flex items-center gap-1 font-semibold">
                  <Award size={12} className="text-green-600" /> Full Marks: <strong>{paperInfo.full_marks}</strong>
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Award size={12} className="text-orange-500" /> Pass Marks: <strong>{paperInfo.pass_marks}</strong>
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Clock size={12} className="text-purple-600" /> Duration: <strong>{paperInfo.duration} hr</strong>
                </span>
              </div>
            </div>

            {(sections || []).map((section: any, sIdx: number) => (
              <div key={section.id} className="rounded-sm border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-2.5 flex justify-between items-center border-b"
                  style={{ backgroundColor: `${primaryColor}08` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded text-white text-[10px] font-black flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {String.fromCharCode(65 + sIdx)}
                    </span>
                    <div>
                      <p className="font-bold text-xs" style={{ color: primaryColor }}>{section.title.toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400">{section.heading}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400">Total Marks</p>
                    <p className="text-xs font-bold text-gray-700">
                      {section.calculated_marks} / {section.total_marks}
                    </p>
                  </div>
                </div>

                {section.questions.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400 italic">No questions in this section.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {section.questions.map((q: any, qIdx: number) => (
                      <div key={q.id} className="px-4 py-3 flex gap-3 items-start">
                        <span
                          className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {qIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 leading-relaxed">{q.question}</p>
                          {q.description && <p className="text-[10px] text-gray-500 mt-1 italic">{q.description}</p>}
                          {q.image && (
                            <img
                              src={q.image} alt="question"
                              className="mt-2 h-16 w-auto rounded border border-gray-200 object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            {q.question_type?.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-bold text-gray-600">{q.marks} marks</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${STATUS_STYLE[q.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {q.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t flex justify-end gap-3 flex-shrink-0 bg-gray-50">
            <button
              onClick={onClose}
              className="text-xs font-semibold px-4 py-1.5 rounded border border-red-500 text-red-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {loading
                ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                : <><Printer size={13} /> Confirm & Print</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Search highlight helper
// ─────────────────────────────────────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main QuestionTable
// ─────────────────────────────────────────────────────────────────────────────
const QuestionTable = ({
  refreshTrigger,
  onEdit,
  onAddQuestion,
  searchQuery = "",
}: {
  refreshTrigger: any;
  onEdit: (q: any) => void;
  onAddQuestion?: (args: { sectionId: any; paperId: any }) => void;
  searchQuery?: string;
}) => {
  const { primaryColor } = useTheme();

  const [sections, setSections] = useState<any[]>([]);
  const [papers,   setPapers]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const [expandedPapers,   setExpandedPapers]   = useState<Record<string | number, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string | number, boolean>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<Record<string | number, boolean>>({});

  const [newQuestions, setNewQuestions] = useState<Record<number, QuestionDraft[]>>({});

  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [deleteId,      setDeleteId]      = useState<string | number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [previewOpen,    setPreviewOpen]    = useState(false);
  const [previewPaperId, setPreviewPaperId] = useState<string | null>(null);
  const [printLoading,   setPrintLoading]   = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sectionsRes, papersRes] = await Promise.all([
        QuestionPaperServices.getAllSections(),
        QuestionPaperServices.getAllPapers(),
      ]);
      setSections(Array.isArray(sectionsRes) ? sectionsRes : []);
      setPapers(Array.isArray(papersRes) ? papersRes : []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [refreshTrigger]);

  const paperMap = useMemo(() =>
    papers.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {} as any),
  [papers]);

  const groupedData = useMemo(() =>
    sections.reduce((acc, curr) => {
      const pId = curr.paper;
      if (!acc[pId]) acc[pId] = [];
      acc[pId].push(curr);
      return acc;
    }, {} as any),
  [sections]);

  // ── Search filter ────────────────────────────────────────────────────────
  const filteredGroupedData = useMemo(() => {
    if (!searchQuery.trim()) return groupedData;

    const q = searchQuery.toLowerCase();
    const result: any = {};

    Object.keys(groupedData).forEach((pId) => {
      const paper = paperMap[pId];

      // Also match on paper-level fields (title, subject, class)
      const paperMatches =
        paper?.title?.toLowerCase().includes(q) ||
        paper?.subject_name_display?.toLowerCase().includes(q) ||
        paper?.class_name?.toLowerCase().includes(q);

      const filteredSections = groupedData[pId]
        .map((section: any) => {
          // Match on section title / heading too
          const sectionMatches =
            section.title?.toLowerCase().includes(q) ||
            section.heading?.toLowerCase().includes(q);

          const filteredQuestions = (section.questions || []).filter(
            (question: any) =>
              question.question?.toLowerCase().includes(q) ||
              question.description?.toLowerCase().includes(q) ||
              question.question_type?.toLowerCase().includes(q) ||
              question.status?.toLowerCase().includes(q)
          );

          // Keep section if section itself matches OR has matching questions
          if (sectionMatches || paperMatches) {
            return { ...section }; // show all questions in matched section/paper
          }
          if (filteredQuestions.length > 0) {
            return { ...section, questions: filteredQuestions };
          }
          return null;
        })
        .filter(Boolean);

      if (filteredSections.length > 0) {
        result[pId] = filteredSections;
      }
    });

    return result;
  }, [groupedData, paperMap, searchQuery]);

  // Auto-expand all papers & sections when searching
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const paperExpand: Record<string | number, boolean> = {};
    const sectionExpand: Record<string | number, boolean> = {};
    Object.keys(filteredGroupedData).forEach((pId) => {
      paperExpand[pId] = true;
      (filteredGroupedData[pId] || []).forEach((s: any) => {
        sectionExpand[s.id] = true;
      });
    });
    setExpandedPapers(paperExpand);
    setExpandedSections(sectionExpand);
  }, [searchQuery, filteredGroupedData]);

  // ── Toggles ──────────────────────────────────────────────────────────────
  const togglePaper    = (id: string | number) => setExpandedPapers(p => ({ ...p, [id]: !p[id] }));
  const toggleSection  = (id: string | number) => setExpandedSections(p => ({ ...p, [id]: !p[id] }));
  const toggleQuestion = (id: string | number) => setExpandedQuestion(p => ({ ...p, [id]: !p[id] }));

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteClick = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setDeleteId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await QuestionPaperServices.deleteQuestion(deleteId);
      toast.success("Question deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete question");
    } finally {
      setDeleteLoading(false);
      setIsModalOpen(false);
      setDeleteId(null);
    }
  };

  // ── Inline question helpers ───────────────────────────────────────────────
  const newQuestionsForSection = (sectionId: number): QuestionDraft[] =>
    newQuestions[sectionId] ?? [];

  const addNewQuestion = (sectionId: number, questionCount: number = 0) => {
    const existing = newQuestionsForSection(sectionId);
    if (existing.length > 0) {
      toast.error("Complete the current form to add a new one.");
      return;
    }
    setNewQuestions((prev) => ({
      ...prev,
      [sectionId]: [
        {
          question_type: "very_short",
          question: "", description: "",
          marks: "", order: questionCount + 1,
          status: "draft",
          image: null, imagePreview: null, imageError: null,
          saved: false,
        },
      ],
    }));
  };

  const updateNewQuestion = (sectionId: number, qIdx: number, field: keyof QuestionDraft, value: any) => {
    setNewQuestions((prev) => {
      const list = [...(prev[sectionId] ?? [])];
      list[qIdx] = { ...list[qIdx], [field]: value, saved: false };
      return { ...prev, [sectionId]: list };
    });
  };

  const removeNewQuestion = (sectionId: number, qIdx: number) => {
    setNewQuestions((prev) => {
      const list = (prev[sectionId] ?? []).filter((_, i) => i !== qIdx);
      return { ...prev, [sectionId]: list };
    });
  };

  // ── Image change ─────────────────────────────────────────────────────────
  const handleImageChange = (
    sectionId: number,
    qIdx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setNewQuestions((prev) => {
        const list = [...(prev[sectionId] ?? [])];
        list[qIdx] = {
          ...list[qIdx],
          image: null,
          imagePreview: null,
          imageError: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed size is ${MAX_IMAGE_SIZE_MB} MB.`,
          saved: false,
        };
        return { ...prev, [sectionId]: list };
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewQuestions((prev) => {
        const list = [...(prev[sectionId] ?? [])];
        list[qIdx] = {
          ...list[qIdx],
          image: file,
          imagePreview: reader.result as string,
          imageError: null,
          saved: false,
        };
        return { ...prev, [sectionId]: list };
      });
    };
    reader.readAsDataURL(file);
  };

  // ── Save inline question ─────────────────────────────────────────────────
  const saveNewQuestion = async (sectionId: number, qIdx: number) => {
    const q = newQuestionsForSection(sectionId)[qIdx];
    if (!q) return;

    if (q.imageError) {
      toast.error("Please fix the image error before saving.");
      return;
    }
    if (!q.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("section",       String(sectionId));
      fd.append("question_type", q.question_type);
      fd.append("question",      q.question);
      fd.append("description",   q.description ?? "");
      fd.append("marks",         String(Number(q.marks) || 0));
      fd.append("order",         String(q.order));
      fd.append("status",        q.status);
      if (q.image instanceof File) fd.append("image", q.image);

      await QuestionPaperServices.createQuestion(fd);

      setNewQuestions((prev) => {
        const list = [...(prev[sectionId] ?? [])];
        list[qIdx] = {
          question_type: "very_short",
          question: "", description: "",
          marks: "", order: list[qIdx].order + 1,
          status: "draft",
          image: null, imagePreview: null, imageError: null,
          saved: false,
        };
        return { ...prev, [sectionId]: list };
      });
      toast.success("Question saved");
      fetchData();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        Object.keys(data).forEach((k) =>
          toast.error(`${k}: ${Array.isArray(data[k]) ? data[k][0] : data[k]}`)
        );
      } else {
        toast.error("Failed to save question");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Preview & Print ──────────────────────────────────────────────────────
  const handleOpenPreview = (e: React.MouseEvent, pId: string) => {
    e.stopPropagation();
    setPreviewPaperId(pId);
    setPreviewOpen(true);
  };

  const handleConfirmPrint = async () => {
    if (!previewPaperId) return;
    const paperInfo = paperMap[previewPaperId];
    if (!paperInfo) return;

    setPrintLoading(true);
    try {
      const rawSections   = groupedData[previewPaperId] || [];
      const finalSections = filterDraftQuestions(rawSections);
      await openPrintWindow(paperInfo, finalSections);
      setPreviewOpen(false);
      setPreviewPaperId(null);
    } catch {
      toast.error("Failed to print paper");
    } finally {
      setPrintLoading(false);
    }
  };

  const previewPaperInfo = previewPaperId ? paperMap[previewPaperId] : null;
  const previewSections  = previewPaperId
    ? filterDraftQuestions(groupedData[previewPaperId] || [])
    : [];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: primaryColor },
        components: {
          Select:      { fontSize: 12, controlHeight: 34 },
          Input:       { fontSize: 12, controlHeight: 34 },
          InputNumber: { fontSize: 12, controlHeight: 34 },
        },
      }}
    >
      <>
        <div className="space-y-3">
          {loading ? (
            <QuestionTableSkeleton />
          ) : Object.keys(filteredGroupedData).length === 0 ? (
            // ── Empty / no-results state ──
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <AlertCircle size={22} style={{ color: primaryColor }} />
              </div>
              <p className="text-sm font-semibold text-gray-600">
                {searchQuery.trim()
                  ? `No results for "${searchQuery}"`
                  : "No question papers found"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {searchQuery.trim()
                  ? "Try a different keyword — search looks at question text, type, and status."
                  : "Create a paper and add sections to get started."}
              </p>
            </div>
          ) : (
            Object.keys(filteredGroupedData).map((pId) => {
              const paperInfo  = paperMap[pId];
              const isExpanded = expandedPapers[pId];

              return (
                <div key={pId} className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">

                  {/* ── PAPER HEADER ── */}
                  <div
                    className="p-2 border-b cursor-pointer transition-all hover:brightness-95"
                    style={{
                      background:  `linear-gradient(to right, ${primaryColor}10, ${primaryColor}18)`,
                      borderColor: `${primaryColor}30`,
                    }}
                    onClick={() => togglePaper(pId)}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                          style={isExpanded
                            ? { backgroundColor: primaryColor, color: "#fff" }
                            : { backgroundColor: "#fff", border: `1px solid ${primaryColor}`, color: primaryColor }}
                        >
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 truncate">
                            <BookOpen size={15} style={{ color: primaryColor }} className="flex-shrink-0" />
                            {paperInfo ? (
                              <>
                                <HighlightText text={`${paperInfo.title} — ${paperInfo.subject_name_display}`} query={searchQuery} />
                              </>
                            ) : (
                              `Paper ID: ${pId}`
                            )}
                          </h2>
                          {paperInfo && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Class: <HighlightText text={paperInfo.class_name || "—"} query={searchQuery} />
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {paperInfo && (
                          <>
                            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Award size={10} /> FM {paperInfo.full_marks}
                            </span>
                            <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Award size={10} /> PM {paperInfo.pass_marks}
                            </span>
                            <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock size={10} /> {paperInfo.duration}hr
                            </span>
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <FileText size={10} /> {filteredGroupedData[pId].length} sections
                            </span>
                          </>
                        )}
                        <button
                          onClick={(e) => handleOpenPreview(e, pId)}
                          className="flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-sm transition-all active:scale-95 border hover:bg-gray-50"
                          style={{ borderColor: primaryColor, color: primaryColor }}
                          title="Preview & Print"
                        >
                          <Eye size={11} />
                          Preview & Print
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTIONS ── */}
                  {isExpanded && (
                    <div className="p-2 space-y-3">
                      {filteredGroupedData[pId].map((section: any, sectionIndex: number) => {
                        const isSectionExpanded = expandedSections[section.id];
                        const questionCount     = section.questions?.length || 0;
                        const marksMatch        = Number(section.calculated_marks) === Number(section.total_marks);
                        const pendingNew        = newQuestionsForSection(section.id);

                        return (
                          <div key={section.id} className="overflow-hidden">

                            {/* Section header */}
                            <div
                              className="p-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => toggleSection(section.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-6 h-6 rounded-sm text-white text-[10px] font-black flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  {String.fromCharCode(65 + sectionIndex)}
                                </div>
                                <div>
                                  <p className="font-bold text-sm leading-none" style={{ color: primaryColor }}>
                                    <HighlightText text={section.title.toUpperCase()} query={searchQuery} />
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    <HighlightText text={section.heading || ""} query={searchQuery} />
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Marks</p>
                                  <p className="text-xs font-bold text-gray-700">
                                    <span className={marksMatch ? "text-green-600" : "text-orange-500"}>
                                      {Number(section.calculated_marks)}
                                    </span>
                                    <span className="text-gray-400"> / {Number(section.total_marks)}</span>
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Hash size={9} />{questionCount} Q
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSectionExpanded) toggleSection(section.id);
                                    addNewQuestion(section.id, questionCount);
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-bold text-white px-2.5 py-1 rounded-sm transition-all active:scale-95 hover:opacity-90"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  <Plus size={11} />
                                </button>
                                <div className={`text-gray-400 transition-transform ${isSectionExpanded ? "rotate-90" : ""}`}>
                                  <ChevronRight size={14} />
                                </div>
                              </div>
                            </div>

                            {/* ── QUESTIONS ── */}
                            {isSectionExpanded && (
                              <div className="border-t border-gray-100">

                                {questionCount > 0 && (
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide w-10">#</th>
                                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Question</th>
                                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide w-16 text-center">Marks</th>
                                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide w-20 text-center">Type</th>
                                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide w-16 text-center">Status</th>
                                        <th className="px-4 py-2 w-16"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {section.questions.map((q: any, qIndex: number) => {
                                        const isQExpanded = expandedQuestion[q.id];
                                        const hasDesc     = !!q.description;
                                        const hasImage    = !!q.image;

                                        return (
                                          <React.Fragment key={q.id}>
                                            <tr
                                              className="border-t text-xs hover:bg-gray-50/60 transition-colors group/row cursor-pointer"
                                              onClick={() => (hasDesc || hasImage) && toggleQuestion(q.id)}
                                            >
                                              <td className="px-4 py-2.5 w-10">
                                                <span
                                                  className="w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center"
                                                  style={{ backgroundColor: primaryColor }}
                                                >
                                                  {qIndex + 1}
                                                </span>
                                              </td>
                                              <td className="px-4 py-2.5 font-medium text-gray-800">
                                                <div className="flex items-start gap-2">
                                                  <p className="line-clamp-2 leading-relaxed flex-1">
                                                    <HighlightText text={q.question} query={searchQuery} />
                                                  </p>
                                                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                                                    {hasDesc  && <span title="Has description"><AlignLeft size={10} className="text-gray-300" /></span>}
                                                    {hasImage && <span title="Has image"><ImageIcon size={10} className="text-blue-400" /></span>}
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-4 py-2.5 text-center font-bold text-gray-700">
                                                {q.marks != null ? Number(q.marks).toFixed(0) : "—"}
                                              </td>
                                              <td className="px-4 py-2.5 text-center">
                                                <span
                                                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize whitespace-nowrap"
                                                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                                >
                                                  <HighlightText
                                                    text={q.question_type?.replace(/_/g, " ") ?? "—"}
                                                    query={searchQuery}
                                                  />
                                                </span>
                                              </td>
                                              <td className="px-4 py-2.5 text-center">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${STATUS_STYLE[q.status] ?? "bg-gray-100 text-gray-500"}`}>
                                                  <HighlightText text={q.status ?? "—"} query={searchQuery} />
                                                </span>
                                              </td>
                                              <td className="px-4 py-2.5">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(q); }}
                                                    className="p-1 rounded hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition-colors"
                                                    title="Edit"
                                                  >
                                                    <Pencil size={12} />
                                                  </button>
                                                  <button
                                                    onClick={(e) => handleDeleteClick(e, q.id)}
                                                    className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                  >
                                                    <Trash2 size={12} />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>

                                            {isQExpanded && (hasDesc || hasImage) && (
                                              <tr
                                                className="border-b border-gray-100"
                                                style={{ backgroundColor: `${primaryColor}06` }}
                                              >
                                                <td />
                                                <td colSpan={5} className="px-4 py-3">
                                                  <div className="flex gap-4 items-start">
                                                    {hasDesc && (
                                                      <div className="flex-1">
                                                        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-1 flex items-center gap-1">
                                                          <AlignLeft size={9} /> Guideline
                                                        </p>
                                                        <p className="text-xs text-gray-600 leading-relaxed bg-white rounded border border-gray-100 px-3 py-2">
                                                          <HighlightText text={q.description} query={searchQuery} />
                                                        </p>
                                                      </div>
                                                    )}
                                                    {hasImage && (
                                                      <div className="flex-shrink-0">
                                                        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-1 flex items-center gap-1">
                                                          <ImageIcon size={9} /> Image
                                                        </p>
                                                        <img
                                                          src={q.image}
                                                          alt="question"
                                                          className="h-20 w-auto rounded border border-gray-200 object-cover shadow-sm"
                                                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}

                                {/* Auto-open blank form when section is empty */}
                                <AutoOpenForm
                                  sectionId={section.id}
                                  questionCount={questionCount}
                                  newQuestions={newQuestions}
                                  onInit={() => addNewQuestion(section.id, 0)}
                                />

                                {pendingNew.length > 0 && (
                                  <div className="p-3 space-y-2 border-t border-dashed border-gray-200 bg-gray-50/60">
                                    {pendingNew.map((q, qi) => (
                                      <InlineQuestionCard
                                        key={qi}
                                        q={q}
                                        qi={questionCount + qi}
                                        saving={saving}
                                        primaryColor={primaryColor}
                                        sectionId={section.id}
                                        onUpdate={(field, val) => updateNewQuestion(section.id, qi, field, val)}
                                        onSave={() => saveNewQuestion(section.id, qi)}
                                        onCancel={() => removeNewQuestion(section.id, qi)}
                                        onImageChange={(e) => handleImageChange(section.id, qi, e)}
                                      />
                                    ))}
                                  </div>
                                )}

                                {questionCount === 0 && pendingNew.length === 0 && (
                                  <div className="px-4 py-6 text-center text-xs text-gray-400">
                                    No questions yet.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* DELETE CONFIRM */}
        <ConfirmModal
          isOpen={isModalOpen}
          title="Delete Question?"
          message="This action will permanently remove the question."
          onConfirm={handleConfirmDelete}
          onCancel={() => { setIsModalOpen(false); setDeleteId(null); }}
          loading={deleteLoading}
        />

        {/* PRINT PREVIEW MODAL */}
        <PrintPreviewModal
          isOpen={previewOpen}
          onClose={() => { setPreviewOpen(false); setPreviewPaperId(null); }}
          onConfirm={handleConfirmPrint}
          paperInfo={previewPaperInfo}
          sections={previewSections}
          loading={printLoading}
          primaryColor={primaryColor}
        />
      </>
    </ConfigProvider>
  );
};

export default QuestionTable;