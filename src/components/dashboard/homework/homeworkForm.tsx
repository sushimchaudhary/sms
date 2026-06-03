"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Save,
  Loader2,
  X,
  BookOpen,
  Layers,
  Users,
  Calendar,
  Type,
  AlignLeft,
  GraduationCap,
  UploadCloud,
  FileText,
} from "lucide-react";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, Upload } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import dayjs from "dayjs";
import useAuth from "@/lib/hooks/useAuth";
import { HomeworkServices } from "@/services/homeworkServices";
import { ClassServices } from "@/services/classServices";
import { SubjectServices } from "@/services/subjectServices";
import { SectionServices } from "@/services/sectionServices";
import { SessionServices } from "@/services/sessionsServices";

import NepaliDate from "nepali-date-converter";
// ─── install: npm install nepali-datepicker-reactjs ───
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";

// ── Helpers ──────────────────────────────────────────────

/** AD "YYYY-MM-DD" → BS "YYYY-MM-DD" (for the picker value) */
const adToBSValue = (adStr: string): string => {
  if (!adStr) return "";
  try {
    const nd = new NepaliDate(new Date(adStr));
    const y = nd.getYear();
    const m = String(nd.getMonth() + 1).padStart(2, "0");
    const d = String(nd.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return "";
  }
};

/** BS "YYYY-MM-DD" → AD "YYYY-MM-DD" (to save in form state) */
const bsToADValue = (bsStr: string): string => {
  if (!bsStr) return "";
  try {
    const [y, m, d] = bsStr.split("-").map(Number);
    const nd = new NepaliDate(y, m - 1, d);
    const ad = nd.toJsDate();
    const ay = ad.getFullYear();
    const am = String(ad.getMonth() + 1).padStart(2, "0");
    const adDay = String(ad.getDate()).padStart(2, "0");
    return `${ay}-${am}-${adDay}`;
  } catch {
    return "";
  }
};

interface HomeworkFormValues {
  school: string | number | null;
  session: string | number | null;
  class_assigned: string | number | null;
  section: string | number | null;
  subject: string | number | null;
  teacher: string | number | null;
  title: string;
  description: string;
  due_date: dayjs.Dayjs | string | null;
}

export default function HomeworkForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);

  const form = useForm<HomeworkFormValues>({
    defaultValues: {
      school: null,
      session: null,
      class_assigned: null,
      section: null,
      subject: null,
      teacher: null,
      title: "",
      description: "",
      due_date: null,
    },
  });

  const selectedClass = form.watch("class_assigned");

  useEffect(() => {
    const fetchInitialOptions = async () => {
      try {
        const [classRes, subjectRes, sessionRes] = await Promise.all([
          ClassServices.getAllClasses(),
          SubjectServices.getAllSubjects(),
          SessionServices.getSessions()
        ]);
        setClasses((classRes?.results || classRes || []).map((c: any) => ({ label: c.name, value: c.id })));
        setSubjects((subjectRes?.results || subjectRes || []).map((s: any) => ({ label: s.name, value: s.id })));
        setSessions((sessionRes?.results || sessionRes || []).map((sn: any) => ({ label: sn.name, value: sn.id })));
      } catch (err) { console.error(err); }
    };
    if (isOpen) fetchInitialOptions();
  }, [isOpen]);

  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedClass) {
        setSections([]);
        form.setValue("section", null);
        return;
      }
      try {
        const res = await SectionServices.getAllSections();
        const allSections = Array.isArray(res) ? res : res?.results || [];
        const filtered = allSections.filter((s: any) => 
          String(s.class_assigned?.id || s.class_assigned) === String(selectedClass)
        );
        setSections(filtered.map((s: any) => ({ label: s.name, value: s.id })));
      } catch (err) { console.error(err); }
    };
    fetchSections();
  }, [selectedClass, form]);

  useEffect(() => {
    if (isOpen) {
      const currentSchoolId = initialData?.school?.id || initialData?.school || loggedInUser?.school_id;
      const currentSessionId = initialData?.session?.id || initialData?.session || loggedInUser?.active_session_id;

      if (initialData) {
        form.reset({
          school: currentSchoolId || null,
          session: currentSessionId || null,
          class_assigned: initialData.class_assigned?.id || initialData.class_assigned || null,
          section: initialData.section?.id || initialData.section || null,
          subject: initialData.subject?.id || initialData.subject || null,
          teacher: initialData.teacher?.id || initialData.teacher || null,
          title: initialData.title || "",
          description: initialData.description || "",
          due_date: initialData.due_date ? dayjs(initialData.due_date).format("YYYY-MM-DD") : null,
        });

        if (initialData.file) {
          setFileList([{
            uid: '-1',
            name: initialData.file.split('/').pop() || 'Existing File',
            status: 'done',
            url: initialData.file,
          }]);
        }
      } else {
        form.reset({
          school: currentSchoolId || null,
          session: currentSessionId || null,
          class_assigned: null,
          section: null,
          subject: null,
          teacher: loggedInUser?.teacher_profile_id || null,
          title: "",
          description: "",
          due_date: null,
        });
        setFileList([]);
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const handleClose = () => {
    form.reset();
    setFileList([]);
    onClose();
  };

  const onSubmit = async (values: HomeworkFormValues) => {
    setLoading(true);
    const formData = new FormData();
    
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined && key !== "due_date") {
        formData.append(key, String(value));
      }
    });

    if (values.due_date) {
      formData.append("due_date", dayjs(values.due_date).format("YYYY-MM-DD"));
    }

    if (fileList[0]?.originFileObj) {
      formData.append("file", fileList[0].originFileObj);
    }

    try {
      if (isUpdate) {
        await HomeworkServices.updateHomework(initialData.id, formData);
        toast.success("Homework updated successfully");
      } else {
        await HomeworkServices.createHomework(formData);
        toast.success("Homework assigned successfully");
      }
      onSuccess();
      handleClose();
    } catch (err: any) {
      const serverErrors = err.response?.data;
      if (serverErrors) {
        Object.keys(serverErrors).forEach((key) => {
          const message = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key];
          toast.error(`${key}: ${message}`);
        });
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Force Calendar Popups and 2. Custom Slim Dynamic Scrollbar */}
      <style>{`
        .ndp-container {
          z-index: 99999 !important;
        }
        .custom-slim-scrollbar .rc-virtual-list-holder::-webkit-scrollbar,
        .form-scroller::-webkit-scrollbar {
          width: 5px !important;
        }
        .custom-slim-scrollbar .rc-virtual-list-holder::-webkit-scrollbar-track,
        .form-scroller::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 4px;
        }
        .custom-slim-scrollbar .rc-virtual-list-holder::-webkit-scrollbar-thumb,
        .form-scroller::-webkit-scrollbar-thumb {
          background: ${primaryColor || '#3b82f6'} !important;
          border-radius: 4px;
        }
      `}</style>

      <div onClick={handleClose} className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-visible font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookOpen size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Homework Assignment" : "New Homework Assignment"}
              </h2>
              <button onClick={handleClose} className="text-red-500 hover:rotate-90 transition-transform p-1"><X size={20} /></button>
            </div>

            <Form {...form}>
              {/* Added form-scroller for slim scrollbars and overflow-y-visible to prevent clipping */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 sm:px-6 py-3 space-y-4 overflow-y-visible form-scroller flex-1">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormFieldControl form={form} name="class_assigned" label="Class" type="select" icon={<Layers size={12} />} placeholder="Select Class" options={classes} primaryColor={primaryColor} />
                  <FormFieldControl form={form} name="section" label="Section" type="select" icon={<Users size={12} />} placeholder="Select Section" options={sections} primaryColor={primaryColor} />
                  <FormFieldControl form={form} name="subject" label="Subject" type="select" icon={<GraduationCap size={12} />} placeholder="Select Subject" options={subjects} primaryColor={primaryColor} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldControl form={form} name="title" label="Homework Title" icon={<Type size={12} />} placeholder="Enter title" />
                  
                  <FormItem className="w-full">
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar size={12} style={{ color: primaryColor }} /> Due Date
                    </label>
                    <Controller 
                      name="due_date" 
                      control={form.control} 
                      render={({ field }) => (
                        <div className="w-full relative">
                          <NepaliDatePicker
                            inputClassName="w-full h-[33px] px-3 py-1.5 text-sm text-gray-800 bg-white border border-gray-300 rounded shadow-xs focus:border-blue-500 focus:outline-hidden transition-all placeholder:text-gray-400 font-sans"
                            value={adToBSValue(field.value ? dayjs(field.value).format("YYYY-MM-DD") : "")}
                            onChange={(bsVal: string) => field.onChange(bsToADValue(bsVal))}
                            options={{
                              calenderLocale: "ne",
                              valueLocale: "en",
                            }}
                          />
                        </div>
                      )} 
                    />
                  </FormItem>
                </div>

                <FormFieldControl form={form} name="description" label="Instructions" type="textarea" icon={<AlignLeft size={12} />} placeholder="Enter instructions" />

                {/* --- FILE UPLOAD SECTION --- */}
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <UploadCloud size={12} /> Attachment (PDF/DOC/Image)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-start gap-3 p-3 border border-gray-100 rounded-md bg-gray-50/30">
                    <Upload 
                      beforeUpload={() => false} 
                      maxCount={1} 
                      fileList={fileList} 
                      onChange={({ fileList }) => setFileList(fileList)} 
                      onRemove={() => setFileList([])}
                      showUploadList={false}
                    >
                      <div className="w-full sm:w-[140px] h-[70px] border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center bg-white hover:border-primary/50 cursor-pointer transition-all">
                        <UploadCloud size={17} className="text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-500 font-medium">Choose File</span>
                      </div>
                    </Upload>

                    <div className="flex-1 w-full min-h-[70px] flex items-center">
                      {fileList.length > 0 ? (
                        <div className="w-full flex items-center justify-between p-1 bg-white border border-gray-200 rounded shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded">
                              <FileText size={15} className="text-blue-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-semibold text-gray-700 truncate max-w-[150px] sm:max-w-[250px]">
                                {fileList[0].name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {fileList[0].size ? `${(fileList[0].size / 1024).toFixed(1)} KB` : "Ready to upload"}
                              </span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setFileList([])}
                            className="p-1.5 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50/50">
                           <span className="text-[11px] text-gray-400 italic">No attachment selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white z-10">
                  <CancelButton className="w-full sm:w-auto" onClick={handleClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" className="w-full sm:w-auto" disabled={loading}>
                    <div className="flex items-center justify-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update Assignment" : "Assign Homework"}</span>
                    </div>
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

const FormFieldControl = ({ form, name, label, icon, placeholder, disabled = false, type = "text", options = [], primaryColor }: any) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
            {React.cloneElement(icon, { style: { color: primaryColor } })} {label}
          </label>
          {type === "select" ? (
            <Select 
              {...field} 
              showSearch 
              className="w-full h-[33px]" 
              placeholder={placeholder} 
              disabled={disabled} 
              options={options} 
              optionFilterProp="label" 
              dropdownClassName="custom-slim-scrollbar" // Select dropdown भित्र पातलो स्क्रोलबार
            />
          ) : type === "textarea" ? (
            <textarea 
              {...field} 
              className="w-full p-2 border border-gray-200 rounded-[4px] text-[12px] min-h-[60px] focus:outline-none focus:border-gray-400" 
              placeholder={placeholder} 
              disabled={disabled} 
            />
          ) : (
            <ThemedInput placeholder={placeholder} disabled={disabled} {...field} />
          )}
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  );
};