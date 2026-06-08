"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, FileText } from "lucide-react";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Input, Select, InputNumber } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { QuestionPaperServices } from "@/services/questionpaperServices";
import { ClassServices } from "@/services/classServices"; // आफ्नो पाथ चेक गर्नुहोला
import { SubjectServices } from "@/services/subjectServices"; // आफ्नो पाथ चेक गर्नुहोला

interface ListItem {
  id: number | string;
  name: string;
}

export default function QuestionPaperForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const [loading, setLoading] = useState(false);

  // क्लास र सब्जेक्टको स्टेट
  const [classList, setClassList] = useState<ListItem[]>([]);
  const [subjectList, setSubjectList] = useState<ListItem[]>([]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      subject: null,
      class_name: null,
      full_marks: null,
      pass_marks: null,
      duration: "",
      instructions: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [classes, subjects] = await Promise.all([
            ClassServices.getAllClasses(),
            SubjectServices.getAllSubjects(),
          ]);

          const classData = Array.isArray(classes)
            ? classes
            : classes?.results || [];
          const subjectData = Array.isArray(subjects)
            ? subjects
            : subjects?.results || [];

          setClassList([...classData].reverse());
          setSubjectList([...subjectData].reverse());
        } catch (error) {
          toast.error("Failed to load classes or subjects");
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData) {
      reset(initialData);
    } else if (isOpen) {
      reset({
        title: "",
        subject: null,
        class_name: null,
        full_marks: null,
        pass_marks: null,
        duration: "",
        instructions: "",
        status: "draft",
      });
    }
  }, [initialData, isOpen, reset]);

  const onSubmit = async (values: any) => {
    setLoading(true);

    const payload = {
      title: values.title,
      class_obj_id: values.class_name, // Django को नयाँ फिल्ड नामसँग म्याच भयो
      subject_name_id: values.subject, // Django को नयाँ फिल्ड नामसँग म्याच भयो
      full_marks: values.full_marks,
      pass_marks: values.pass_marks,
      duration: values.duration,
      instructions: values.instructions,
      status: values.status,
    };

    try {
      if (isUpdate) {
        await QuestionPaperServices.updatePaper(initialData.id, payload);
        toast.success("Question paper updated successfully");
      } else {
        await QuestionPaperServices.createPaper(payload);
        toast.success("Question paper created successfully");
        reset();
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err); // एरर हेर्नको लागि
      toast.error("Failed to save question paper.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-2 transition-all ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor } }}>
            <div className="bg-white px-4 py-3 border-b flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <FileText size={15} color={primaryColor} />
                {isUpdate ? "Edit Paper" : "Create New Paper"}
              </h2>
              <button onClick={onClose} className="text-red-500">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-4 grid grid-cols-2 gap-4"
            >
              <div className="col-span-2">
                <label className="text-[12px] font-bold text-gray-700 block mb-1">
                  Title
                </label>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g. First Terminal Examination"
                    />
                  )}
                />
              </div>

              {/* Class Select */}
              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">
                  Class
                </label>
                <Controller
                  name="class_name"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Select Class"
                      options={classList.map((c: any) => ({
                        label: c.name,
                        value: c.id,
                      }))}
                      className="w-full"
                    />
                  )}
                />
              </div>

              {/* Subject Select */}
              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">
                  Subject
                </label>
                <Controller
                  name="subject"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Select Subject"
                      options={subjectList.map((s: any) => ({
                        label: s.name,
                        value: s.id,
                      }))}
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">
                  Full Marks
                </label>
                <Controller
                  name="full_marks"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      className="w-full"
                      placeholder="100"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">
                  Pass Marks
                </label>
                <Controller
                  name="pass_marks"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      className="w-full"
                      placeholder="50"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">
                  Duration
                </label>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="3 Hours" />
                  )}
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-700 block mb-1">
                  Status
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Select status"
                      allowClear
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "final", label: "Final" },
                      ]}
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="col-span-2">
                <label className="text-[12px] font-bold text-gray-700 block mb-1">
                  Instructions
                </label>
                <Controller
                  name="instructions"
                  control={control}
                  render={({ field }) => (
                    <Input.TextArea
                      {...field}
                      rows={2}
                      placeholder="text...."
                    />
                  )}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3 pt-4 border-t">
                <CancelButton onClick={onClose} />
                <ThemedButton type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}{" "}
                  Save
                </ThemedButton>
              </div>
            </form>
          </ConfigProvider>
        </div>
      </div>
    </>
  );
}
