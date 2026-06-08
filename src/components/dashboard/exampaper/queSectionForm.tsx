"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, ClipboardList } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Input, InputNumber, Select } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { QuestionPaperServices } from "@/services/questionpaperServices";

export default function QuestionSectionForm({
  initialData,
  paperId,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      paper: paperId || "",
      title: "",
      heading: "",
      total_marks: 0,
      instructions: "",
      order: 1,
    },
  });

// पेपर लिस्ट लोड गर्ने
useEffect(() => {
  if (isOpen) {
    QuestionPaperServices.getAllPapers().then((res: any) => {
      const data = Array.isArray(res) ? res : (res?.results || []);
      
      // यहाँ फिल्टर गर्नुहोस्: status === 'final' भएको मात्र लिने
      const finalPapers = data.filter((p: any) => p.status === 'final');
      
      setPapers(finalPapers);
    });
  }
}, [isOpen]);

  // फर्म रिसेट गर्ने
 // फर्म रिसेट गर्ने ठाउँमा यो सच्याउनुहोस्
useEffect(() => {
  if (isOpen && initialData) {
    form.reset({
      // यदि initialData.paper एउटा object हो भने, त्यसको id लिनुहोस्
      // यदि initialData.paper एउटा integer हो भने, त्यही लिनुहोस्
      paper: initialData.paper?.id ?? initialData.paper ?? paperId ?? "",
      title: initialData.title || "",
      heading: initialData.heading || "",
      total_marks: initialData.total_marks || 0,
      instructions: initialData.instructions || "",
      order: initialData.order || 1,
    });
  }
}, [initialData, isOpen, form, paperId]);


const onSubmit = async (values: any) => {
  setLoading(true);
  try {
    // Edit गर्दा, 'paper' को ID सधैं initialData बाट लिने ताकि गल्ती नहोस्
    const finalPaperId = isUpdate 
      ? (initialData.paper?.id ?? initialData.paper) 
      : (typeof values.paper === 'object' ? values.paper.id : values.paper);

    const payload = {
      ...values,
      paper: finalPaperId,
    };

    if (isUpdate) {
      await QuestionPaperServices.updateQuestionSection(initialData.id, payload);
      toast.success("Section updated successfully");
    } else {
      await QuestionPaperServices.createQuestionSection(payload);
      toast.success("Section created successfully");
    }
    
    if (onSuccess) onSuccess();
  } catch (err: any) {
    console.error("Submission Error:", err.response?.data);
    toast.error("Failed to save section");
  } finally {
    setLoading(false);
  }
};


// QuestionSectionForm.tsx को भित्र
const handleClose = () => {
  form.reset({ // फर्मलाई खाली वा डिफल्ट भ्यालुमा फर्काउने
    paper: paperId || "",
    title: "",
    heading: "",
    total_marks: 0,
    instructions: "",
    order: 1,
  });
  onClose(); // अनि बल्ल मोडल बन्द गर्ने
};


  return (
    <>
      <div onClick={handleClose} className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-lg bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor } }}>
            <div className="bg-white px-4 py-3 border-b flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <ClipboardList size={15} color={primaryColor} /> 
                {isUpdate ? "Edit Section" : "Add New Section"}
              </h2>
              <button onClick={handleClose} className="text-red-500"><X size={20} /></button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-1.5">
                
                {/* Paper Select Dropdown */}
                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700">Select Paper</label>
                  <Controller
                    name="paper"
                    control={form.control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        showSearch
                        placeholder="Select a paper"
                        className="w-full"
                        // disabled={!!paperId} // यदि paperId छ भने यसलाई बन्द गर्ने
                        options={papers.map((p) => ({
                          label: p.name || p.title, 
                          value: p.id,
                        }))}
                      />
                    )}
                  />
                </FormItem>

                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700">Section Title </label>
                  <Controller name="title" control={form.control} rules={{ required: true }} render={({ field }) => <Input {...field} placeholder="group a" />} />
                </FormItem>

                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700">Heading</label>
                  <Controller name="heading" control={form.control} render={({ field }) => <Input {...field} placeholder="e.g. Very Short Questions" />} />
                </FormItem>

                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700">Total Marks</label>
                    <Controller name="total_marks" control={form.control} rules={{ required: true }} render={({ field }) => <InputNumber {...field} className="w-full" />} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700">Order</label>
                    <Controller name="order" control={form.control} render={({ field }) => <InputNumber {...field} className="w-full" />} />
                  </FormItem>
                </div>

                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700">Instructions</label>
                  <Controller name="instructions" control={form.control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                </FormItem>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <CancelButton onClick={handleClose} />
                  <ThemedButton type="submit" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={14} />} Save
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