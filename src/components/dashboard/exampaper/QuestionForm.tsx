
"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Loader2, X, FileQuestion, Upload } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Input, InputNumber, Select, Upload as AntdUpload } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { QuestionPaperServices } from "@/services/questionpaperServices";

const QUESTION_TYPES = [
  { value: 'very_short', label: 'Very Short' },
  { value: 'short',      label: 'Short' },
  { value: 'medium',     label: 'Medium' },
  { value: 'long',       label: 'Long' },
  { value: 'free',       label: 'Free Question' },
  { value: 'true_false', label: 'True/False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'read_answer',label: 'Read & Answer' },
  { value: 'match_text', label: 'Match Following (Text)' },
  { value: 'match_image',label: 'Match Following (Image)' },
];

const STATUS_CHOICES = [
  { value: 'draft',   label: 'Draft' },
  { value: 'final',   label: 'Final' },
  { value: 'printed', label: 'Printed' },
];

export default function QuestionForm({
  initialData, paperId, sectionId, onClose, onSuccess, isOpen
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();

  const [loading, setLoading]               = useState(false);
  const [allPapers, setAllPapers]           = useState<any[]>([]);
  const [allSections, setAllSections]       = useState<any[]>([]);
  const [dataLoading, setDataLoading]       = useState(false);
  const [selectedPaper, setSelectedPaper]   = useState<any>(paperId || "");
  const [fileList, setFileList]             = useState<any[]>([]);
  const [previewImage, setPreviewImage]     = useState<string | null>(null);

  // ── Fetch all papers + all sections once on open ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setDataLoading(true);
    Promise.all([
      QuestionPaperServices.getAllPapers(),
      QuestionPaperServices.getAllSections(),
    ]).then(([papersRes, sectionsRes]) => {
      setAllPapers(Array.isArray(papersRes)   ? papersRes   : (papersRes?.results   || []));
      setAllSections(Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.results || []));
    }).catch(() => toast.error("Failed to load data"))
      .finally(() => setDataLoading(false));
  }, [isOpen]);

  const form = useForm({
    defaultValues: {
      selected_paper: paperId   || "",   // UI only — not sent to backend
      section:        sectionId || "",
      question_type:  "short",
      question:       "",
      description:    "",
      marks:          0,
      order:          1,
      status:         "draft",
      image:          null,
    },
  });

  // ── Reset form when modal opens / edit data changes ───────────────────────
  // useEffect(() => {
  //   if (!isOpen) return;

  //   if (initialData) {
  //     const editPaperId = initialData.paper || paperId || "";
  //     setSelectedPaper(editPaperId);
  //     form.reset({
  //       selected_paper: editPaperId,
  //       section:        initialData.section       || sectionId || "",
  //       question_type:  initialData.question_type || "short",
  //       question:       initialData.question      || "",
  //       description:    initialData.description   || "",
  //       marks:          initialData.marks          || 0,
  //       order:          initialData.order          || 1,
  //       status:         initialData.status         || "draft",
  //       image:          null,
  //     });
  //     if (initialData.image) setPreviewImage(initialData.image);
  //   } else {
  //     setSelectedPaper(paperId || "");
  //     form.reset({
  //       selected_paper: paperId   || "",
  //       section:        sectionId || "",
  //       question_type:  "short",
  //       question:       "",
  //       description:    "",
  //       marks:          0,
  //       order:          1,
  //       status:         "draft",
  //       image:          null,
  //     });
  //     setFileList([]);
  //     setPreviewImage(null);
  //   }
  // }, [initialData, isOpen]);


  useEffect(() => {
  if (!isOpen) return;

  if (initialData) {
    // यो Edit मोड हो - डेटा सेट गर्ने
    const editPaperId = initialData.paper || paperId || "";
    setSelectedPaper(editPaperId);
    form.reset({
      selected_paper: editPaperId,
      section: initialData.section || sectionId || "",
      question_type: initialData.question_type || "short",
      question: initialData.question || "",
      description: initialData.description || "",
      marks: initialData.marks || 0,
      order: initialData.order || 1,
      status: initialData.status || "draft",
      image: null,
    });
    if (initialData.image) setPreviewImage(initialData.image);
  } else {
    // यो Add मोड हो - फर्म खाली राख्ने
    // यदि तपाईँ "Add" बटन थिच्दा प्रि-सेलेक्टेड पेपर/सेक्सन चाहनुहुन्न भने यी भ्यालुहरू हटाउनुहोस्:
    setSelectedPaper(""); 
    form.reset({
      selected_paper: "",
      section: "",
      question_type: "short",
      question: "",
      description: "",
      marks: 0,
      order: 1,
      status: "draft",
      image: null,
    });
    setFileList([]);
    setPreviewImage(null);
  }
}, [initialData, isOpen]); // यहाँ paperId र sectionId निर्भरता (dependency) मा नराख्नुहोस्, अन्यथा लूप हुन सक्छ।

  // ── Filtered sections based on selected paper ─────────────────────────────
  const filteredSections = selectedPaper
    ? allSections.filter((s: any) => String(s.paper) === String(selectedPaper))
    : [];

  // ── Paper change → reset section ─────────────────────────────────────────
  const handlePaperChange = (pid: any) => {
    setSelectedPaper(pid);
    form.setValue("selected_paper", pid);
    form.setValue("section", ""); // clear section when paper changes
  };

  const handleFileChange = (file: any) => {
    form.setValue("image", file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
    return false;
  };

  const onSubmit = async (values: any) => {
    setLoading(true);
    const formData = new FormData();
    Object.keys(values).forEach(key => {
      if (key === "selected_paper") return; // UI only — skip
      if (values[key] !== null && values[key] !== undefined) {
        formData.append(key, values[key]);
      }
    });
    try {
      if (isUpdate) {
        await QuestionPaperServices.updateQuestion(initialData.id, formData);
        toast.success("Question updated");
      } else {
        await QuestionPaperServices.createQuestion(formData);
        toast.success("Question created");
      }
      onSuccess?.();
    } catch {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="w-full max-w-xl bg-white rounded shadow-xl border border-gray-200 overflow-hidden">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor } }}>

            <div className="bg-white px-4 py-3 border-b flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <FileQuestion size={15} /> {isUpdate ? "Edit" : "Add"} Question
              </h2>
                            <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform">
                 <X size={20} /></button>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="p-3 space-y-2 max-h-[80vh] overflow-y-auto"
              >

                {/* ── Paper + Section in same row ── */}
                <div className="grid grid-cols-2 gap-4">

                  {/* Paper dropdown */}
                  <FormItem>
                    <label className="text-[11px] font-bold uppercase text-gray-500">Paper</label>
                    <Select
                      className="w-full"
                      placeholder={dataLoading ? "Loading..." : "Select paper"}
                      loading={dataLoading}
                      value={selectedPaper || undefined}
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      onChange={handlePaperChange}
                      options={allPapers.map((p: any) => ({
                        // "First Terminal (Class 10)"
                        label: `${p.title}${p.class_name ? ` (c:${p.class_name})` : ''}`,
                        value: p.id,
                      }))}
                    />
                  </FormItem>

                  {/* Section dropdown — filtered by selected paper */}
                  <FormItem>
                    <label className="text-[11px] font-bold uppercase text-gray-500">Section</label>
                    <Controller
                      name="section"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          placeholder={
                            !selectedPaper
                              ? "Select paper first"
                              : filteredSections.length === 0
                              ? "No sections found"
                              : "Select section"
                          }
                          disabled={!selectedPaper || dataLoading}
                          value={field.value || undefined}
                          options={filteredSections.map((s: any) => ({
                            // "Group A (Short Question)"
                            label: `${s.title}${s.heading ? ` (${s.heading})` : ''}`,
                            value: s.id,
                          }))}
                        />
                      )}
                    />
                  </FormItem>
                </div>

                {/* ── Type / Marks / Status ── */}
                <div className="grid grid-cols-3 gap-4">
                  <FormItem className="col-span-1">
                    <label className="text-[11px] font-bold uppercase text-gray-500">Type</label>
                    <Controller name="question_type" control={form.control}
                      render={({ field }) => <Select {...field} className="w-full" options={QUESTION_TYPES} />}
                    />
                  </FormItem>
                  <FormItem className="col-span-1">
                    <label className="text-[11px] font-bold uppercase text-gray-500">Marks</label>
                    <Controller name="marks" control={form.control}
                      render={({ field }) => <InputNumber {...field} className="w-full" />}
                    />
                  </FormItem>
                  <FormItem className="col-span-1">
                    <label className="text-[11px] font-bold uppercase text-gray-500">Status</label>
                    <Controller name="status" control={form.control}
                      render={({ field }) => <Select {...field} className="w-full" options={STATUS_CHOICES} />}
                    />
                  </FormItem>
                </div>

                <FormItem>
                  <label className="text-[11px] font-bold uppercase text-gray-500">Question Content</label>
                  <Controller name="question" control={form.control}
                    render={({ field }) => <Input.TextArea {...field} rows={3} />}
                  />
                </FormItem>

                <FormItem>
                  <label className="text-[11px] font-bold uppercase text-gray-500">Guideline / Description</label>
                  <Controller name="description" control={form.control}
                    render={({ field }) => <Input.TextArea {...field} rows={2} />}
                  />
                </FormItem>

                <FormItem>
                  <label className="text-[11px] font-bold uppercase text-gray-500">Question Image</label>
                  <div className="flex items-center gap-4">
                    <Controller name="image" control={form.control}
                      render={({ field: { onChange } }) => (
                        <AntdUpload
                          beforeUpload={(file) => { handleFileChange(file); return false; }}
                          maxCount={1}
                          fileList={fileList}
                          onRemove={() => { setPreviewImage(null); form.setValue("image", null); setFileList([]); }}
                        >
                          <ThemedButton type="button" size="sm" className="flex gap-2">
                            <Upload size={14} /> Upload
                          </ThemedButton>
                        </AntdUpload>
                      )}
                    />
                    {previewImage && (
                      <div className="relative w-16 h-16 border rounded overflow-hidden group">
                        <img src={previewImage} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setPreviewImage(null); form.setValue("image", null); setFileList([]); }}
                          className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold hidden group-hover:flex items-center justify-center"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </FormItem>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <CancelButton onClick={onClose} />
                  <ThemedButton type="submit" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Save Question"}
                  </ThemedButton>
                </div>
              </form>
            </Form>
          </ConfigProvider>
        </div>
      </div>
    </>
  );
}