"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, UserCheck, BookOpen, Layers, Hash, CalendarDays } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";

import { TeacherSubjectServices } from "@/services/teacherSubjectServices";
import { TeacherServices } from "@/services/teacherServices";
import { SubjectServices } from "@/services/subjectServices";
import { SessionServices } from "@/services/sessionsServices";
import { ClassServices } from "@/services/classServices";
import { SectionServices } from "@/services/sectionServices";
import useAuth from "@/lib/hooks/useAuth";

export default function TeacherSubjectForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const [options, setOptions] = useState({ teachers: [], subjects: [], sessions: [], classes: [], sections: [] });

  const form = useForm({
    defaultValues: { teacher: null, subject: null, session: null, class_assigned: null, section: null, school: "" }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, sub, ses, cls, sec] = await Promise.all([
          TeacherServices.getAllTeachers(),
          SubjectServices.getAllSubjects(),
          SessionServices.getSessions(),
          ClassServices.getAllClasses(),
          SectionServices.getAllSections(),
        ]);
        const sesData = ses.results || ses;
        setOptions({
          teachers: t.results || t,
          subjects: sub.results || sub,
          sessions: sesData,
          classes: cls.results || cls,
          sections: sec.results || sec,
        });

        // Auto-select Active Session
        if (!isUpdate) {
          const activeSession = sesData.find((s: any) => s.is_active === true);
          if (activeSession) form.setValue("session", activeSession.id);
        }
      } catch (err) {
        toast.error("Failed to load dependency data");
      }
    };
    if (isOpen) fetchData();
  }, [isOpen, isUpdate, form]);

  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        teacher: initialData.teacher?.id || initialData.teacher,
        subject: initialData.subject?.id || initialData.subject,
        session: initialData.session?.id || initialData.session,
        class_assigned: initialData.class_assigned?.id || initialData.class_assigned,
        section: initialData.section?.id || initialData.section,
        school: String(loggedInUser?.school_id || ""),
      });
      setSelectedClass(initialData.class_assigned?.id || initialData.class_assigned);
    }
  }, [initialData, isOpen, loggedInUser, form]);

const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      isUpdate 
        ? await TeacherSubjectServices.updateTeacherSubject(initialData.id, values)
        : await TeacherSubjectServices.createTeacherSubject(values);
      
      toast.success(isUpdate ? "Assignment updated" : "Subject assigned successfully");
      
      // १. पहिले form reset गर्नुहोस्
      form.reset({ 
        teacher: null, 
        subject: null, 
        session: null, 
        class_assigned: null, 
        section: null, 
        school: String(loggedInUser?.school_id || "") 
      });

      // २. स्पष्ट रूपमा Select भ्यालुहरूलाई null मा सेट गर्नुहोस् (Ant Design को लागि)
      form.setValue("class_assigned", null);
      form.setValue("section", null);
      
      // ३. Local state पनि clear गर्नुहोस्
      setSelectedClass(null);
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
          const serverErrors = err.response?.data;
          if (serverErrors) {
            if (serverErrors.non_field_errors) {
              toast.error(serverErrors.non_field_errors[0]);
            } else if (serverErrors.detail) {
              toast.error(serverErrors.detail);
            } else {
              Object.keys(serverErrors).forEach((key) => {
                const errorValue = serverErrors[key];
                const message = Array.isArray(errorValue) ? errorValue[0] : errorValue;
                toast.error(`${key.toUpperCase()}: ${message}`);
              });
            }
          } else {
            toast.error("Something went wrong. Please try again.");
          }
        } finally {
          setLoading(false);
        }
  };


  const handleClose = () => {
  form.reset({ 
    teacher: null, 
    subject: null, 
    session: null, 
    class_assigned: null, 
    section: null, 
    school: String(loggedInUser?.school_id || "") 
  });
  setSelectedClass(null); // क्लास स्टेट पनि क्लियर गर्ने
  onClose(); // मोडाल बन्द गर्ने
};


  return (
    <>
      <div onClick={handleClose} className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UserCheck size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Teacher Assignment" : "Assign Subject to Teacher"}
              </h2>
              <button onClick={handleClose} className="text-red-500 hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><UserCheck size={12} /> Teacher</label>
                    <Controller name="teacher" control={form.control} render={({ field }) => (
                      <Select {...field} showSearch className="w-full h-[33px]" placeholder="Select Teacher" optionFilterProp="label"
                       options={[...options.teachers].reverse().map((t: any) => ({ value: t.id, label: `${t.full_name || t.first_name_display} (${t.user_email})` }))} />
                    )} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><BookOpen size={12} /> Subject</label>
                    <Controller name="subject" control={form.control} render={({ field }) => (
                      <Select {...field} showSearch className="w-full h-[33px]" placeholder="Select Subject" optionFilterProp="label"
                        options={[...options.subjects].reverse().map((s: any) => ({ value: s.id, label: s.name }))} />
                    )} />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><CalendarDays size={12} /> Session</label>
                    <Controller name="session" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[33px]" placeholder="Session" options={[...options.sessions].reverse().map((s: any) => ({ value: s.id, label: s.name }))} />
                    )} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><Layers size={12} /> Class</label>
                    <Controller name="class_assigned" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[33px]" placeholder="Class" onChange={(v) => { field.onChange(v); setSelectedClass(v); form.setValue("section", null); }}
                        options={[...options.classes].reverse().map((c: any) => ({ value: c.id, label: c.name }))} />
                    )} />
                  </FormItem>
<FormItem>
  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
    <Hash size={12} /> Section
  </label>
  <Controller 
    name="section" 
    control={form.control} 
    render={({ field }) => (
      <Select 
        {...field} 
        className="w-full h-[33px]" 
        placeholder="Select class first" 
        // यहाँ disabled logic थपिएको छ
        disabled={!selectedClass} 
        options={[...options.sections]
          .filter((s: any) => s.class_assigned === selectedClass)
          .reverse()
          .map((s: any) => ({ value: s.id, label: s.name }))
        } 
      />
    )} 
  />
</FormItem>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={handleClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">{loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} <span>{isUpdate ? "Update Assignment" : "Assign Now"}</span></div>
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