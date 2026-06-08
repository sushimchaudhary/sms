



"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  X, FileText, ChevronRight, ChevronLeft, Plus, Trash2, Save,
  Loader2, GripVertical, Image as ImageIcon, CheckCircle2,
  BookOpen, AlignLeft, Printer, Eye, Award, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { QuestionPaperServices } from "@/services/questionpaperServices";
import { ClassServices } from "@/services/classServices";
import { SubjectServices } from "@/services/subjectServices";
import { SchoolServices } from "@/services/schoolServices";
import { useTheme } from "@/lib/context/ThemeContext";
import {
  ConfigProvider,
  Select,
  Input,
  InputNumber,
} from "antd";

const { TextArea } = Input;

// ── Types ──────────────────────────────────────────────────────────────────────

interface PaperMeta {
  title: string;
  subject: string | number;
  class_name: string | number;
  section_name: string;
  full_marks: number | string;
  pass_marks: number | string;
  duration: string;
  instructions: string;
  status: "draft" | "final";
}

interface SectionDraft {
  id?: number;
  title: string;
  heading: string;
  total_marks: number | string;
  instructions: string;
  order: number;
  saved: boolean;
}

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

interface BuilderProps {
  initialData?: any;
}

type Step = 1 | 2 | 3;

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

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// ── Shared AntD input style override (XS size to match existing design) ────────

const antdSelectStyle: React.CSSProperties = { width: "100%", fontSize: 12, height: 34 };
const antdInputStyle: React.CSSProperties  = { fontSize: 12, height: 34 };

// ── Print Window ───────────────────────────────────────────────────────────────

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

  const subjectDisplay = paperInfo.subject_name_display || paperInfo.subject || "";
  const classDisplay   = paperInfo.class_name_display   || paperInfo.class_name || "—";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${paperInfo.title} - ${subjectDisplay}</title>
  <style>
  @media print { @page { margin: 10mm; size: auto; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    -webkit-print-color-adjust: exact;
    margin: 0; font-family: sans-serif; background: #fff; color: #111;
    padding: 40px 60px; font-size: 13px; line-height: 1.6;
  }
  .school-header { display: flex; align-items: center; justify-content: center; gap: 18px; padding-bottom: 14px; margin-bottom: 14px; }
  .school-logo { width: 70px; height: 70px; object-fit: contain; flex-shrink: 0; }
  .school-logo-placeholder {
    width: 70px; height: 70px; border-radius: 50%; background: #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: bold; color: #6b7280; flex-shrink: 0;
  }
  .school-info { text-align: center; }
  .school-name { font-size: 20px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
  .school-sub { font-size: 11px; color: #444; margin-top: 2px; }
  .exam-title { font-size: 14px; font-weight: bold; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-row { display: flex; justify-content: space-between; align-items: flex-start; margin: 12px 0; font-size: 12px; padding-bottom: 10px; }
  .meta-left { text-align: left; }
  .meta-right { text-align: right; }
  .meta-center { text-align: center; }
  .section { margin-top: 22px; }
  .section-header {
    font-size: 13px; font-weight: bold; text-transform: uppercase;
    letter-spacing: 0.5px; border-top: 1.5px solid #111; border-bottom: 1px solid #333;
    padding: 6px 0; margin-bottom: 10px;
    display: flex; justify-content: center; align-items: center; gap: 12px;
  }
  .section-heading { font-size: 12px; font-style: italic; color: #444; margin-bottom: 10px; text-align: center; }
  .question-list { list-style: none; }
  .question-item { display: flex; gap: 3px; align-items: flex-start; padding: 1px 0; font-size: 16px; }
  .question-item:last-child { border-bottom: none; }
  .q-num { min-width: 20px; flex-shrink: 0; }
  .q-body { flex: 1; }
  .q-text { font-size: 16px; }
  .q-desc { font-size: 12px; color: #555; font-style: italic; margin-top: 3px; }
  .q-image { margin-top: 5px; max-height: 120px; max-width: 220px; display: block; margin-left: auto; margin-right: auto; }
  .q-marks { font-weight: bold; font-size: 12px; min-width: 40px; text-align: right; flex-shrink: 0; }
  .footer { margin-top: 40px; border-top: 1.5px solid #000; padding-top: 20px; text-align: center; }
  @media print {
    body { padding: 20px 40px; }
    .section { page-break-inside: avoid; }
    .question-item { page-break-inside: avoid; }
  }
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
        Subject: ${subjectDisplay} &nbsp;|&nbsp; Class: ${classDisplay}
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
      <div><strong>Date:</strong> ${new Date().toLocaleDateString("ne-NP-u-ca-buddhist", {
        year: "numeric", month: "long", day: "numeric",
      })}</div>
    </div>
  </div>

  ${sections.map((section: any) => `
    <div class="section">
      <div class="section-header">
        <span>Group '${section.title.toUpperCase()}' </span>
        <span>[${section.total_marks} Marks]</span>
      </div>
      ${section.heading ? `<div class="section-heading">${section.heading}</div>` : ""}
      <ol class="question-list">
        ${section.questions.map((q: any, qIdx: number) => `
          <li class="question-item">
            <span class="q-num">${qIdx + 1}.</span>
            <div class="q-body">
              <div class="q-text">${q.question}</div>
              ${q.description ? `<div class="q-desc">( ${q.description} )</div>` : ''}
              ${(q.imagePreview || q.image)
                ? `<img src="${q.imagePreview || q.image}" class="q-image" alt="question image" onerror="this.style.display='none'" />`
                : ""}
            </div>
            <span class="q-marks">[${Number(q.marks)}]</span>
          </li>
        `).join('')}
      </ol>
    </div>
  `).join("")}

  <div class="footer">
    <div style="font-size: 13px; font-weight: bold; color: #555;">*** Good Luck ***</div>
  </div>

  <script>
    window.onload = function () {
      const images = document.querySelectorAll("img");
      if (images.length === 0) {
        window.print();
        window.onafterprint = function () { window.close(); };
        return;
      }
      let loaded = 0;
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

// ── Print Preview Modal ────────────────────────────────────────────────────────

const PrintPreviewModal = ({
  isOpen, onClose, onConfirm, paperInfo, sections, loading, primaryColor,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  paperInfo: any; sections: any[]; loading: boolean; primaryColor: string;
}) => {
  if (!isOpen || !paperInfo) return null;

  const subjectDisplay = paperInfo.subject_name_display || paperInfo.subject || "—";
  const classDisplay   = paperInfo.class_name_display   || paperInfo.class_name || "—";

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-sm shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div
            className="px-5 py-4 flex justify-between items-center border-b flex-shrink-0"
            style={{ background: `linear-gradient(to right, ${primaryColor}12, ${primaryColor}20)` }}
          >
            <div>
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Printer size={15} style={{ color: primaryColor }} />
                Print Preview
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Review before printing</p>
            </div>
            <button onClick={onClose} className="text-red-500 hover:text-red-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 p-5 space-y-4">

            {/* Paper info card */}
            <div className="rounded border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ backgroundColor: `${primaryColor}10` }}>
                <h3 className="font-bold text-sm text-gray-900">
                  {paperInfo.title} — {subjectDisplay}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Class: {classDisplay}</p>
              </div>
              <div className="px-4 py-3 flex gap-6 text-xs text-gray-600 flex-wrap">
                <span className="flex items-center gap-1 font-semibold">
                  <Award size={12} className="text-green-600" />
                  Full Marks: <strong>{paperInfo.full_marks}</strong>
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Award size={12} className="text-orange-500" />
                  Pass Marks: <strong>{paperInfo.pass_marks}</strong>
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Clock size={12} className="text-purple-600" />
                  Duration: <strong>{paperInfo.duration}</strong>
                </span>
              </div>
            </div>

            {/* Sections */}
            {(sections || []).map((section: any, sIdx: number) => (
              <div key={section.id ?? sIdx} className="rounded border border-gray-200 overflow-hidden">
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
                      <p className="font-bold text-xs" style={{ color: primaryColor }}>
                        Group {section.title.toUpperCase()}
                      </p>
                      {section.heading && <p className="text-[10px] text-gray-400">{section.heading}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400">Total Marks</p>
                    <p className="text-xs font-bold text-gray-700">{section.total_marks}</p>
                  </div>
                </div>

                {(!section.questions || section.questions.length === 0) ? (
                  <p className="px-4 py-3 text-xs text-gray-400 italic">No final questions in this section.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {section.questions.map((q: any, qIdx: number) => (
                      <div key={q.id ?? qIdx} className="px-4 py-3 flex gap-3 items-start">
                        <span
                          className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {qIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 leading-relaxed">{q.question}</p>
                          {q.description && (
                            <p className="text-[10px] text-gray-500 mt-1 italic">{q.description}</p>
                          )}
                          {(q.imagePreview || q.image) && (
                            <img
                              src={q.imagePreview || q.image}
                              alt="question"
                              className="mt-2 h-20 w-auto rounded border border-gray-200 object-cover"
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

          {/* Footer */}
          <div className="px-5 py-4 border-t flex justify-end gap-3 flex-shrink-0 bg-gray-50">
            <button
              onClick={onClose}
              className="text-xs font-semibold px-4 py-1.5 rounded-sm border border-red-500 text-red-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {loading
                ? <><Loader2 size={13} className="animate-spin" /> Printing...</>
                : <><Printer size={13} /> Confirm & Print</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── BUILDER COMPONENT ──────────────────────────────────────────────────────────

export default function QuestionPaperBuilder({ initialData }: BuilderProps) {
  const isEdit = !!initialData;
  const { primaryColor } = useTheme();

  const [step, setStep]       = useState<Step>(1);
  const [saving, setSaving]   = useState(false);
  const [paperId, setPaperId] = useState<number | null>(null);

  const [sections, setSections]                 = useState<SectionDraft[]>([]);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  const [classList, setClassList]     = useState<{ id: number | string; name: string }[]>([]);
  const [subjectList, setSubjectList] = useState<{ id: number | string; name: string }[]>([]);

  const [previewOpen, setPreviewOpen]           = useState(false);
  const [printLoading, setPrintLoading]         = useState(false);
  const [previewPaperData, setPreviewPaperData] = useState<any>(null);

  const sectionsRef = React.useRef<SectionDraft[]>([]);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  const [questionsBySection, setQuestionsBySection] = useState<Record<number, QuestionDraft[]>>({});

  const metaForm = useForm<PaperMeta>({
    defaultValues: {
      title: "", subject: "", class_name: "", section_name: "",
      full_marks: "", pass_marks: "", duration: "", instructions: "", status: "draft",
    },
  });

  // ── Fetch dropdowns ──────────────────────────────────────────────────────

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [classes, subjects] = await Promise.all([
          ClassServices.getAllClasses(),
          SubjectServices.getAllSubjects(),
        ]);
        const classData   = Array.isArray(classes)  ? classes  : (classes?.results  ?? []);
        const subjectData = Array.isArray(subjects) ? subjects : (subjects?.results ?? []);
        setClassList([...classData].reverse());
        setSubjectList([...subjectData].reverse());
      } catch {
        toast.error("Failed to load classes or subjects");
      }
    };
    fetchDropdowns();
  }, []);

  // ── Reset / hydrate ──────────────────────────────────────────────────────

  useEffect(() => {
    setStep(1);
    setSaving(false);

    if (initialData) {
      setPaperId(initialData.id);
      metaForm.reset({
        title:        initialData.title        ?? "",
        subject:      initialData.subject_name_id ?? initialData.subject ?? "",
        class_name:   initialData.class_obj_id   ?? initialData.class_name ?? "",
        section_name: initialData.section_name   ?? "",
        full_marks:   initialData.full_marks      ?? "",
        pass_marks:   initialData.pass_marks      ?? "",
        duration:     initialData.duration        ?? "",
        instructions: initialData.instructions    ?? "",
        status:       initialData.status          ?? "draft",
      });

      const secs: SectionDraft[] = (initialData.sections ?? []).map((s: any, i: number) => ({
        id: s.id, title: s.title ?? "", heading: s.heading ?? "",
        total_marks: s.total_marks ?? 0, instructions: s.instructions ?? "",
        order: s.order ?? i + 1, saved: true,
      }));
      setSections(secs);

      const qMap: Record<number, QuestionDraft[]> = {};
      (initialData.sections ?? []).forEach((s: any, si: number) => {
        qMap[si] = (s.questions ?? []).map((q: any, qi: number) => ({
          id: q.id, question_type: q.question_type, question: q.question,
          description: q.description ?? "", marks: q.marks,
          order: q.order ?? qi + 1, status: q.status ?? "draft",
          image: null, imagePreview: q.image ?? null, imageError: null, saved: true,
        }));
      });
      setQuestionsBySection(qMap);
      setActiveSectionIdx(0);
    } else {
      setPaperId(null);
      metaForm.reset({
        title: "", subject: "", class_name: "", section_name: "",
        full_marks: "", pass_marks: "", duration: "", instructions: "", status: "draft",
      });
      setSections([]);
      setQuestionsBySection({});
      setActiveSectionIdx(0);
    }
  }, [initialData]);

  // ── Step 1: Save meta ────────────────────────────────────────────────────

  const saveMeta = async (values: PaperMeta) => {
    setSaving(true);
    try {
      const payload = {
        title:           values.title,
        subject_name_id: values.subject,
        class_obj_id:    values.class_name,
        section_name:    values.section_name || null,
        full_marks:      Number(values.full_marks),
        pass_marks:      Number(values.pass_marks),
        duration:        values.duration,
        instructions:    values.instructions || null,
        status:          values.status,
      };

      if (isEdit && paperId) {
        await QuestionPaperServices.updatePaper(paperId, payload);
        toast.success("Paper updated — review your sections");
      } else {
        const res = await QuestionPaperServices.createPaper(payload);
        setPaperId(res?.id);
        toast.success("Paper created — now add sections");
      }
      setStep(2);
    } catch (err: any) {
      handleApiError(err, "Failed to save paper");
    } finally {
      setSaving(false);
    }
  };

  // ── Step 2: Sections ─────────────────────────────────────────────────────

  const addSection = () => {
    const next: SectionDraft = {
      title: String.fromCharCode(65 + sections.length),
      heading: "", total_marks: "", instructions: "",
      order: sections.length + 1, saved: false,
    };
    setSections((prev) => [...prev, next]);
    setActiveSectionIdx(sections.length);
  };

  const updateSectionField = (idx: number, field: keyof SectionDraft, value: any) =>
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value, saved: false } : s)));

  const saveSection = async (idx: number) => {
    const sec = sections[idx];
    if (!paperId)          { toast.error("Paper not saved yet"); return; }
    if (!sec.title.trim()) { toast.error("Section title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        paper: paperId, title: sec.title, heading: sec.heading || null,
        total_marks: Number(sec.total_marks) || 0,
        instructions: sec.instructions || null, order: sec.order,
      };
      let saved: SectionDraft;
      if (sec.id) {
        await QuestionPaperServices.updateQuestionSection(sec.id, payload);
        saved = { ...sec, saved: true };
        toast.success(`Section ${sec.title} updated`);
      } else {
        const res = await QuestionPaperServices.createQuestionSection(payload);
        saved = { ...sec, id: res?.id, saved: true };
        toast.success(`Section ${sec.title} saved`);
      }
      setSections((prev) => prev.map((s, i) => (i === idx ? saved : s)));
    } catch (err: any) {
      handleApiError(err, "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const removeSection = (idx: number) => {
    if (!confirm("Remove this section and all its questions?")) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setQuestionsBySection((prev) => {
      const next: Record<number, QuestionDraft[]> = {};
      Object.keys(prev).forEach((k) => {
        const ki = Number(k);
        if (ki < idx)      next[ki]     = prev[ki];
        else if (ki > idx) next[ki - 1] = prev[ki];
      });
      return next;
    });
    setActiveSectionIdx((prev) => Math.max(0, prev > idx ? prev - 1 : prev));
  };

  const allSectionsSaved = sections.length > 0 && sections.every((s) => s.saved);

  // ── Step 3: Questions ─────────────────────────────────────────────────────

  const questionsForSection = (idx: number): QuestionDraft[] => questionsBySection[idx] ?? [];

  const addQuestion = (sectionIdx: number) => {
    const existing = questionsForSection(sectionIdx);
    setQuestionsBySection((prev) => ({
      ...prev,
      [sectionIdx]: [
        ...existing,
        {
          question_type: "very_short", question: "", description: "",
          marks: "", order: existing.length + 1, status: "draft",
          image: null, imagePreview: null, imageError: null, saved: false,
        },
      ],
    }));
  };

  const updateQuestion = (sectionIdx: number, qIdx: number, field: keyof QuestionDraft, value: any) => {
    setQuestionsBySection((prev) => {
      const list = [...(prev[sectionIdx] ?? [])];
      list[qIdx] = { ...list[qIdx], [field]: value, saved: false };
      return { ...prev, [sectionIdx]: list };
    });
  };

  const saveQuestion = async (sectionIdx: number, qIdx: number) => {
    const q = questionsBySection[sectionIdx]?.[qIdx];
    if (!q) return;

    // Block save if image has an error
    if (q.imageError) {
      toast.error("Please fix the image error before saving.");
      return;
    }

    const freshSection = sectionsRef.current[sectionIdx];
    if (!freshSection?.id) { toast.error("Save the section first before adding questions"); return; }
    if (!q.question.trim()) { toast.error("Question text is required"); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("section",       String(freshSection.id));
      fd.append("question_type", q.question_type);
      fd.append("question",      q.question);
      fd.append("description",   q.description ?? "");
      fd.append("marks",         String(Number(q.marks) || 0));
      fd.append("order",         String(q.order));
      fd.append("status",        q.status);
      if (q.image instanceof File) fd.append("image", q.image);

      const res = await QuestionPaperServices.createQuestion(fd);
      setQuestionsBySection((prev) => {
        const list = [...(prev[sectionIdx] ?? [])];
        list[qIdx] = { ...list[qIdx], id: res?.id, saved: true };
        return { ...prev, [sectionIdx]: list };
      });
      toast.success("Question saved");
    } catch (err: any) {
      handleApiError(err, "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = (sectionIdx: number, qIdx: number) => {
    setQuestionsBySection((prev) => {
      const list = (prev[sectionIdx] ?? []).filter((_, i) => i !== qIdx);
      return { ...prev, [sectionIdx]: list };
    });
  };

  // ── Image change with 5 MB validation ─────────────────────────────────────

  const handleImageChange = (sectionIdx: number, qIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected after removal
    e.target.value = "";

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      // Set error, clear any previous image
      setQuestionsBySection((prev) => {
        const list = [...(prev[sectionIdx] ?? [])];
        list[qIdx] = {
          ...list[qIdx],
          image: null,
          imagePreview: null,
          imageError: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed size is ${MAX_IMAGE_SIZE_MB} MB.`,
          saved: false,
        };
        return { ...prev, [sectionIdx]: list };
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestionsBySection((prev) => {
        const list = [...(prev[sectionIdx] ?? [])];
        list[qIdx] = {
          ...list[qIdx],
          image: file,
          imagePreview: reader.result as string,
          imageError: null,
          saved: false,
        };
        return { ...prev, [sectionIdx]: list };
      });
    };
    reader.readAsDataURL(file);
  };

  // ── Finish → open preview ─────────────────────────────────────────────────

  const finishAll = async () => {
    if (!paperId) { toast.error("No paper to finalize"); return; }

    const hasUnsaved = sections.some((_, si) => questionsForSection(si).some((q) => !q.saved));
    if (hasUnsaved) { toast.error("Save all questions before finishing"); return; }

    const empty = sections.filter((_, si) => questionsForSection(si).length === 0);
    if (empty.length > 0) {
      toast.error(`Section ${empty.map((s) => s.title).join(", ")} has no questions`);
      return;
    }

    setSaving(true);
    try {
      const paperMeta = metaForm.getValues();

      const selectedSubject = subjectList.find(
        (s) => String(s.id) === String(paperMeta.subject)
      );
      const selectedClass = classList.find(
        (c) => String(c.id) === String(paperMeta.class_name)
      );

      const builtSections = sections.map((sec, si) => ({
        ...sec,
        questions: questionsForSection(si),
      }));

      setPreviewPaperData({
        id:                   paperId,
        title:                paperMeta.title,
        subject:              paperMeta.subject,
        subject_name_display: selectedSubject?.name ?? String(paperMeta.subject),
        class_name:           paperMeta.class_name,
        class_name_display:   selectedClass?.name  ?? String(paperMeta.class_name),
        full_marks:           paperMeta.full_marks,
        pass_marks:           paperMeta.pass_marks,
        duration:             paperMeta.duration,
        sections:             builtSections,
      });
      setPreviewOpen(true);
    } catch {
      toast.error("Failed to prepare preview");
    } finally {
      setSaving(false);
    }
  };

  // ── Confirm print ─────────────────────────────────────────────────────────

  const handleConfirmPrint = async () => {
    if (!previewPaperData) return;
    setPrintLoading(true);
    try {
      const finalSections = (previewPaperData.sections ?? []).map((section: any) => ({
        ...section,
        questions: (section.questions ?? []).filter((q: any) => q.status !== "draft"),
      }));

      try {
        const res = await QuestionPaperServices.allInOnePaper(paperId!);
        toast.success(res?.message ?? "Paper generated successfully!");
      } catch (err: any) {
        const data = err?.response?.data;
        if (data?.error) {
          let msg = data.error;
          if (data.expected !== undefined && data.calculated !== undefined) {
            msg += ` — expected ${data.expected}, got ${data.calculated}`;
          }
          toast.error(msg);
          return;
        }
      }

      await openPrintWindow(previewPaperData, finalSections);
      setPreviewOpen(false);
      setPreviewPaperData(null);
    } catch {
      toast.error("Failed to print paper");
    } finally {
      setPrintLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: primaryColor },
        components: {
          Select: {
            fontSize: 12,
            controlHeight: 34,
          },
          Input: {
            fontSize: 12,
            controlHeight: 34,
          },
          InputNumber: {
            fontSize: 12,
            controlHeight: 34,
          },
        },
      }}
    >
      <>
        <div className="w-full bg-white rounded shadow-sm border border-gray-200 flex flex-col overflow-hidden font-mukta">

          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: `${primaryColor}20` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <FileText size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  {isEdit ? "Edit Question Paper" : "New Question Paper"}
                </h2>
                <p className="text-[10px] text-gray-400">
                  Step {step} of 3 —{" "}
                  {step === 1 ? "Paper Info" : step === 2 ? "Sections" : "Questions"}
                </p>
              </div>
            </div>

            {/* Step progress */}
            <div className="hidden sm:flex items-center gap-1">
              {([1, 2, 3] as Step[]).map((s) => (
                <React.Fragment key={s}>
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                      s < step ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                    style={s === step ? { backgroundColor: primaryColor, color: "#fff" } : {}}
                  >
                    {s < step ? <CheckCircle2 size={12} /> : s}
                  </div>
                  {s < 3 && <div className={`w-6 h-0.5 ${s < step ? "bg-green-400" : "bg-gray-200"}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* ════ STEP 1 ════ */}
            {step === 1 && (
              <form id="meta-form" onSubmit={metaForm.handleSubmit(saveMeta)} className="p-5 space-y-5">
                <SectionHeader icon={<BookOpen size={14} />} label="Paper Info" primaryColor={primaryColor} />

                {/* Paper Title */}
                <FieldGroup label="Paper Title" required>
                  <Controller
                    control={metaForm.control}
                    name="title"
                    rules={{ required: "Title is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g. First Terminal Examination"
                        style={antdInputStyle}
                      />
                    )}
                  />
                </FieldGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Class */}
                  <FieldGroup label="Class" required>
                    <Controller
                      control={metaForm.control}
                      name="class_name"
                      rules={{ required: "Class is required" }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder="Select Class"
                          style={antdSelectStyle}
                          showSearch
                          filterOption={(input, option) =>
                            String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={classList.map((c) => ({ label: c.name, value: c.id }))}
                        />
                      )}
                    />
                  </FieldGroup>

                  {/* Subject */}
                  <FieldGroup label="Subject" required>
                    <Controller
                      control={metaForm.control}
                      name="subject"
                      rules={{ required: "Subject is required" }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder="Select Subject"
                          style={antdSelectStyle}
                          showSearch
                          filterOption={(input, option) =>
                            String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={subjectList.map((s) => ({ label: s.name, value: s.id }))}
                        />
                      )}
                    />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Full Marks */}
                  <FieldGroup label="Full Marks" required>
                    <Controller
                      control={metaForm.control}
                      name="full_marks"
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          placeholder="100"
                          style={{ ...antdInputStyle, width: "100%" }}
                          min={0}
                        />
                      )}
                    />
                  </FieldGroup>

                  {/* Pass Marks */}
                  <FieldGroup label="Pass Marks" required>
                    <Controller
                      control={metaForm.control}
                      name="pass_marks"
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          placeholder="40"
                          style={{ ...antdInputStyle, width: "100%" }}
                          min={0}
                        />
                      )}
                    />
                  </FieldGroup>

                  {/* Duration */}
                  <FieldGroup label="Duration" required>
                    <Controller
                      control={metaForm.control}
                      name="duration"
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="3 Hours"
                          style={antdInputStyle}
                        />
                      )}
                    />
                  </FieldGroup>
                </div>

                {/* Instructions */}
                <FieldGroup label="Instructions (optional)">
                  <Controller
                    control={metaForm.control}
                    name="instructions"
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        placeholder="Read all questions carefully…"
                        rows={3}
                        style={{ fontSize: 12, resize: "none" }}
                      />
                    )}
                  />
                </FieldGroup>

                {/* Status */}
                <FieldGroup label="Status">
                  <Controller
                    control={metaForm.control}
                    name="status"
                    render={({ field }) => (
                      <div className="flex gap-3">
                        {(["draft", "final"] as const).map((s) => (
                          <label
                            key={s}
                            className={`flex items-center gap-2 px-4 py-2 rounded border cursor-pointer text-xs capitalize transition-all ${
                              field.value === s
                                ? s === "final"
                                  ? "bg-green-50 border-green-400 text-green-700 font-semibold"
                                  : "bg-amber-50 border-amber-400 text-amber-700 font-semibold"
                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              className="hidden"
                              value={s}
                              checked={field.value === s}
                              onChange={() => field.onChange(s)}
                            />
                            <span className={`w-2 h-2 rounded-full ${field.value === s ? s === "final" ? "bg-green-500" : "bg-amber-500" : "bg-gray-300"}`} />
                            {s}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                </FieldGroup>
              </form>
            )}

            {/* ════ STEP 2 ════ */}
            {step === 2 && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader icon={<AlignLeft size={14} />} label="Paper Sections" primaryColor={primaryColor} />
                  <button
                    onClick={addSection}
                    className="flex items-center gap-1.5 h-8 px-3 text-white text-xs font-semibold rounded transition-colors hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus size={12} /> Add Section
                  </button>
                </div>

                {sections.length === 0 ? (
                  <EmptyState label="No sections yet" sub='Click "Add Section" to create Section A' />
                ) : (
                  <div className="space-y-3">
                    {sections.map((sec, si) => (
                      <SectionCard
                        key={si} sec={sec} idx={si} isActive={activeSectionIdx === si}
                        saving={saving} primaryColor={primaryColor}
                        onToggle={() => setActiveSectionIdx(activeSectionIdx === si ? -1 : si)}
                        onChange={(field, val) => updateSectionField(si, field, val)}
                        onSave={() => saveSection(si)}
                        onRemove={() => removeSection(si)}
                      />
                    ))}
                  </div>
                )}

                {sections.length > 0 && !allSectionsSaved && (
                  <p className="mt-3 text-xs text-amber-600 flex items-center gap-1">
                    <AlertInline /> Save all sections before proceeding to questions.
                  </p>
                )}
              </div>
            )}

            {/* ════ STEP 3 ════ */}
            {step === 3 && (
              <div className="p-5 flex gap-4">
                {/* Section sidebar */}
                <div className="w-36 flex-shrink-0 space-y-1">
                  {sections.map((sec, si) => (
                    <button
                      key={si}
                      onClick={() => setActiveSectionIdx(si)}
                      className="w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors"
                      style={
                        activeSectionIdx === si
                          ? { backgroundColor: primaryColor, color: "#fff" }
                          : { backgroundColor: "#f9fafb", color: "#4b5563" }
                      }
                    >
                      Section {sec.title}
                      <span className={`ml-1 text-[10px] ${activeSectionIdx === si ? "opacity-60" : "text-gray-400"}`}>
                        ({questionsForSection(si).length}q)
                      </span>
                    </button>
                  ))}
                </div>

                {/* Questions panel */}
                <div className="flex-1 min-w-0">
                  {sections[activeSectionIdx] && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-700">
                          Section {sections[activeSectionIdx].title}
                          {sections[activeSectionIdx].heading && (
                            <span className="ml-1 text-gray-400 font-normal">— {sections[activeSectionIdx].heading}</span>
                          )}
                        </p>
                        <button
                          onClick={() => addQuestion(activeSectionIdx)}
                          className="flex items-center gap-1.5 h-7 px-3 text-white text-xs font-semibold rounded transition-colors hover:opacity-90"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Plus size={11} /> Add Question
                        </button>
                      </div>

                      {questionsForSection(activeSectionIdx).length === 0 ? (
                        <EmptyState label="No questions yet" sub='Click "Add Question" to start' />
                      ) : (
                        <div className="space-y-3">
                          {questionsForSection(activeSectionIdx).map((q, qi) => (
                            <QuestionCard
                              key={qi} q={q} qi={qi} saving={saving}
                              primaryColor={primaryColor}
                              onUpdate={(field, val) => updateQuestion(activeSectionIdx, qi, field, val)}
                              onSave={() => saveQuestion(activeSectionIdx, qi)}
                              onRemove={() => removeQuestion(activeSectionIdx, qi)}
                              onImageChange={(e) => handleImageChange(activeSectionIdx, qi, e)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-5 py-3 flex justify-between items-center bg-gray-50">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              className="flex items-center gap-1 h-8 px-3 text-xs text-gray-600 border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={13} /> Back
            </button>

            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  type="submit" form="meta-form" disabled={saving}
                  className="flex items-center gap-2 h-8 px-4 text-white text-xs font-semibold rounded transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                  {saving ? "Saving…" : "Save & Next"}
                </button>
              )}

              {step === 2 && (
                <button
                  type="button" disabled={!allSectionsSaved || saving} onClick={() => setStep(3)}
                  className="flex items-center gap-2 h-8 px-4 text-white text-xs font-semibold rounded transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ChevronRight size={12} /> Next: Questions
                </button>
              )}

              {step === 3 && (
                <button
                  type="button" onClick={finishAll} disabled={saving}
                  className="flex items-center gap-2 h-8 px-4 text-white text-xs font-semibold rounded transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                  {saving ? "Loading…" : "Preview & Print"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Print Preview Modal */}
        <PrintPreviewModal
          isOpen={previewOpen}
          onClose={() => { setPreviewOpen(false); setPreviewPaperData(null); }}
          onConfirm={handleConfirmPrint}
          paperInfo={previewPaperData}
          sections={
            (previewPaperData?.sections ?? []).map((section: any) => ({
              ...section,
              questions: (section.questions ?? []).filter((q: any) => q.status !== "draft"),
            }))
          }
          loading={printLoading}
          primaryColor={primaryColor}
        />
      </>
    </ConfigProvider>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────────

function SectionCard({
  sec, idx, isActive, saving, primaryColor, onToggle, onChange, onSave, onRemove,
}: {
  sec: SectionDraft; idx: number; isActive: boolean; saving: boolean; primaryColor: string;
  onToggle: () => void; onChange: (field: keyof SectionDraft, val: any) => void;
  onSave: () => void; onRemove: () => void;
}) {
  return (
    <div className={`border rounded overflow-hidden transition-all ${sec.saved ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-gray-300" />
          <span className="text-xs font-bold text-gray-700">Section {sec.title}</span>
          {sec.heading && <span className="text-xs text-gray-400">— {sec.heading}</span>}
          {sec.saved && <CheckCircle2 size={12} className="text-green-500" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{sec.total_marks || 0} marks</span>
          <ChevronRight size={13} className={`text-gray-400 transition-transform ${isActive ? "rotate-90" : ""}`} />
        </div>
      </div>

      {isActive && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Section Title (A/B/C)" required>
              <Input
                value={sec.title}
                onChange={(e) => onChange("title", e.target.value)}
                placeholder="group a"
                maxLength={10}
                style={{ fontSize: 12, height: 34 }}
              />
            </FieldGroup>
            <FieldGroup label="Total Marks" required>
              <InputNumber
                value={sec.total_marks as number}
                onChange={(val) => onChange("total_marks", val)}
                placeholder="20"
                min={0}
                style={{ width: "100%", fontSize: 12, height: 34 }}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Heading (optional)">
            <Input
              value={sec.heading}
              onChange={(e) => onChange("heading", e.target.value)}
              placeholder="Very Short Questions (attempt 5 question)"
              style={{ fontSize: 12, height: 34 }}
            />
          </FieldGroup>
          <FieldGroup label="Instructions (optional)">
            <TextArea
              value={sec.instructions}
              onChange={(e) => onChange("instructions", e.target.value)}
              rows={2}
              placeholder="Answer all questions in this section"
              style={{ fontSize: 12, resize: "none" }}
            />
          </FieldGroup>
          <div className="flex justify-between items-center pt-1">
            <button type="button" onClick={onRemove} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition">
              <Trash2 size={11} /> Remove
            </button>
            <button
              type="button" onClick={onSave} disabled={saving}
              className="flex items-center gap-1.5 h-7 px-3 text-white text-xs font-semibold rounded transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save Section
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Question Card ──────────────────────────────────────────────────────────────

function QuestionCard({
  q, qi, saving, primaryColor, onUpdate, onSave, onRemove, onImageChange,
}: {
  q: QuestionDraft; qi: number; saving: boolean; primaryColor: string;
  onUpdate: (field: keyof QuestionDraft, val: any) => void;
  onSave: () => void; onRemove: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [expanded, setExpanded] = useState(!q.saved);

  return (
    <div className={`border rounded overflow-hidden ${q.saved ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer select-none" onClick={() => setExpanded((e) => !e)}>
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
          <ChevronRight size={12} className={`text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-3 py-3 space-y-3">

          <div className="grid grid-cols-2 gap-3">

            {/* Question Type — AntD Select */}
            <FieldGroup label="Question Type">
              <Select
                value={q.question_type}
                onChange={(val) => onUpdate("question_type", val)}
                style={{ width: "100%", fontSize: 12, height: 34 }}
                options={QUESTION_TYPES.map((t) => ({ label: t.label, value: t.value }))}
              />
            </FieldGroup>

            {/* Marks — AntD InputNumber */}
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

          {/* Question Text — AntD TextArea */}
          <FieldGroup label="Question Text" required>
            <TextArea
              value={q.question}
              onChange={(e) => onUpdate("question", e.target.value)}
              rows={3}
              placeholder="Write the question here…"
              style={{ fontSize: 12, resize: "none" }}
            />
          </FieldGroup>

          {/* Description — AntD TextArea */}
          <FieldGroup label="Description / Guideline (optional)">
            <TextArea
              value={q.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              rows={2}
              placeholder="Any note for students"
              style={{ fontSize: 12, resize: "none" }}
            />
          </FieldGroup>

          {/* Image upload with 5 MB validation */}
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
                    Upload image <span className="text-gray-300 text-[10px]">(max {MAX_IMAGE_SIZE_MB} MB)</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageChange}
                  />
                </label>

                {/* ── Inline error message ── */}
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

            {/* Status — AntD Select */}
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

            {/* Order — AntD InputNumber */}
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
              onClick={onRemove}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition"
            >
              <Trash2 size={11} /> Remove
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !!q.imageError}
              className="flex items-center gap-1.5 h-7 px-3 text-white text-xs font-semibold rounded transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function SectionHeader({
  icon, label, primaryColor,
}: {
  icon: React.ReactNode; label: string; primaryColor: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span style={{ color: primaryColor }}>{icon}</span>
      <h3 className="text-sm font-bold text-gray-700">{label}</h3>
    </div>
  );
}

function EmptyState({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-1">
      <FileText size={32} />
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="text-[11px] text-gray-300">{sub}</p>
    </div>
  );
}

function AlertInline() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function handleApiError(err: any, fallback: string) {
  const data = err?.response?.data;
  if (data && typeof data === "object") {
    Object.keys(data).forEach((k) =>
      toast.error(`${k}: ${Array.isArray(data[k]) ? data[k][0] : data[k]}`)
    );
  } else {
    toast.error(fallback);
  }
}