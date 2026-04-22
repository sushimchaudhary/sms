"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  FileText,
  Save,
  Loader2,
  X,
  BookOpen,
  Layers,
  Calendar,
  UploadCloud,
  GraduationCap,
  Paperclip,
} from "lucide-react";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, Upload } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { ClassServices } from "@/services/classServices";
import { SubjectServices } from "@/services/subjectServices";
import { SectionServices } from "@/services/sectionServices";
import useAuth from "@/lib/hooks/useAuth";
import { SessionServices } from "@/services/sessionsServices";
import { NotesServices } from "@/services/noteServices";

interface NotesFormValues {
  title: string;
  school_id: string | number | null;
  session_id: string | number | null;
  class_id: string | number | null;
  section_id: string | number | null;
  subject_id: string | number | null;
}

export default function NotesForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);

  const form = useForm<NotesFormValues>({
    defaultValues: {
      title: "",
      school_id: null,
      session_id: null,
      class_id: null,
      section_id: null,
      subject_id: null,
    },
  });

  const selectedClass = form.watch("class_id");

  // Fetch Options Logic
  useEffect(() => {
    const fetchInitialOptions = async () => {
      try {
        const [classRes, subjectRes, sessionRes] = await Promise.all([
          ClassServices.getAllClasses(),
          SubjectServices.getAllSubjects(),
          SessionServices.getSessions(),
        ]);
        setClasses((classRes?.results || classRes || []).map((c: any) => ({ label: c.name, value: c.id })));
        setSubjects((subjectRes?.results || subjectRes || []).map((s: any) => ({ label: s.name, value: s.id })));
        setSessions((sessionRes?.results || sessionRes || []).map((sn: any) => ({ label: sn.name, value: sn.id })));
      } catch (err) { console.error("Error fetching options:", err); }
    };
    if (isOpen) fetchInitialOptions();
  }, [isOpen]);

  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedClass) {
        setSections([]);
        form.setValue("section_id", null);
        return;
      }
      try {
        const res = await SectionServices.getAllSections();
        const allSections = Array.isArray(res) ? res : res?.results || [];
        const filtered = allSections.filter((s: any) => 
          String(s.class_assigned?.id || s.class_assigned) === String(selectedClass)
        );
        setSections(filtered.map((s: any) => ({ label: s.name, value: s.id })));
      } catch (err) { console.error("Error fetching sections", err); }
    };
    fetchSections();
  }, [selectedClass, form]);

  useEffect(() => {
    if (isOpen) {
      const currentSchoolId = initialData?.school?.id || initialData?.school || loggedInUser?.school_id;
      const currentSessionId = initialData?.session?.id || initialData?.session || loggedInUser?.active_session_id;

      if (initialData) {
        form.reset({
          title: initialData.title || "",
          school_id: currentSchoolId || null,
          session_id: currentSessionId || null,
          class_id: initialData.class_assigned?.id || initialData.class_assigned || null,
          section_id: initialData.section?.id || initialData.section || null,
          subject_id: initialData.subject?.id || initialData.subject || null,
        });
        if (initialData.file) {
          setFileList([{ uid: '-1', name: initialData.file.split('/').pop(), status: 'done', url: initialData.file }]);
        }
      } else {
        form.reset({
          title: "",
          school_id: currentSchoolId || null,
          session_id: currentSessionId || null,
          class_id: null,
          section_id: null,
          subject_id: null,
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

  const onSubmit = async (values: NotesFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("school", String(values.school_id));
      formData.append("session", String(values.session_id));
      formData.append("class_assigned", String(values.class_id));
      formData.append("section", String(values.section_id));
      formData.append("subject", String(values.subject_id));
      
      if(loggedInUser?.teacher_profile_id) {
          formData.append("teacher", String(loggedInUser.teacher_profile_id));
      }

      if (fileList[0]?.originFileObj) {
        formData.append("file", fileList[0].originFileObj);
      }

      if (isUpdate) {
        await NotesServices.updateNotes(initialData.id, formData);
        toast.success("Notes updated successfully");
      } else {
        if (fileList.length === 0) {
          toast.error("Please upload a file");
          setLoading(false);
          return;
        }
        await NotesServices.createNotes(formData);
        toast.success("Notes uploaded successfully");
      }
      onSuccess();
      handleClose();
    } catch (err: any) {
      const serverErrors = err.response?.data;
      if (serverErrors) {
        if (typeof serverErrors === "object" && !serverErrors.detail) {
          Object.keys(serverErrors).forEach((key) => {
            const errorValue = serverErrors[key];
            const message = Array.isArray(errorValue) ? errorValue[0] : errorValue;
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ");
            toast.error(`${fieldName}: ${message}`);
          });
        } else {
          toast.error(serverErrors.detail || "Something went wrong");
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={handleClose} className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4, controlOutline: `${primaryColor}1A` } }}>
            
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileText size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Note Material" : "Post New Notes"}
              </h2>
              <button onClick={handleClose} className="text-red-500 hover:rotate-90 transition-transform p-1">
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto flex-1">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FormFieldControl form={form} name="title" label="Notes Title" icon={<FileText size={12} />} placeholder="Enter title" />
                  </div>
                  <FormFieldControl form={form} name="session_id" label="Session" type="select" icon={<Calendar size={12} />} placeholder="Select Session" options={sessions} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormFieldControl form={form} name="class_id" label="Class" type="select" icon={<GraduationCap size={12} />} placeholder="Select Class" options={classes} />
                  <FormFieldControl form={form} name="section_id" label="Section" type="select" icon={<Layers size={12} />} placeholder="Select Section" options={sections} disabled={!selectedClass} />
                  <FormFieldControl form={form} name="subject_id" label="Subject" type="select" icon={<BookOpen size={12} />} placeholder="Select Subject" options={subjects} />
                </div>

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
                                          <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-blue-50 rounded">
                                              <FileText size={15} className="text-blue-500" />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
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
                                            className="p-1.5  text-red-500 hover:text-red-600 transition-colors cursor-pointer"
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

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                  <CancelButton className="w-full sm:w-auto" onClick={handleClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" className="w-full sm:w-auto" disabled={loading}>
                    <div className="flex items-center justify-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update Notes" : "Post Study Notes"}</span>
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

const FormFieldControl = ({ form, name, label, icon, placeholder, disabled = false, type = "text", options = [] }: any) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
            {icon} {label}
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