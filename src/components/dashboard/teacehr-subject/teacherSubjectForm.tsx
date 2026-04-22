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
import { Label } from "radix-ui";

export default function TeacherSubjectForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

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
        setOptions({
          teachers: t.results || t,
          subjects: sub.results || sub,
          sessions: ses.results || ses,
          classes: cls.results || cls,
          sections: sec.results || sec,
        });
      } catch (err) {
        toast.error("Failed to load dependency data");
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        teacher: initialData?.teacher?.id || initialData?.teacher || null,
        subject: initialData?.subject?.id || initialData?.subject || null,
        session: initialData?.session?.id || initialData?.session || null,
        class_assigned: initialData?.class_assigned?.id || initialData?.class_assigned || null,
        section: initialData?.section?.id || initialData?.section || null,
        school: String(loggedInUser?.school_id || ""),
      });
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      isUpdate 
        ? await TeacherSubjectServices.updateTeacherSubject(initialData.id, values)
        : await TeacherSubjectServices.createTeacherSubject(values);
      toast.success(isUpdate ? "Assignment updated" : "Subject assigned successfully");
      onSuccess(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Assignment already exists or error occurred");
    } finally { setLoading(false); }
  };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UserCheck size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Teacher Assignment" : "Assign Subject to Teacher"}
              </h2>
              <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><UserCheck size={12} /> Teacher</label>
                    <Controller name="teacher" control={form.control} render={({ field }) => (
                      <Select {...field} showSearch className="w-full h-[33px]" placeholder="Select Teacher" optionFilterProp="label"
                       options={options.teachers.map((t: any) => ({
          value: t.id,
          
          label: `${t.full_name || t.first_name_display + ' ' + t.last_name_display} (${t.user_email})`,
        }))} />
                    )} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><BookOpen size={12} /> Subject</label>
                    <Controller name="subject" control={form.control} render={({ field }) => (
                      <Select {...field} showSearch className="w-full h-[33px]" placeholder="Select Subject" optionFilterProp="label"
                        options={options.subjects.map((s: any) => ({ value: s.id, label: s.name }))} />
                    )} />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><CalendarDays size={12} /> Session</label>
                    <Controller name="session" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[33px]" placeholder="Session" 
                        options={options.sessions.map((s: any) => ({ value: s.id, label: s.name }))} />
                    )} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><Layers size={12} /> Class</label>
                    <Controller name="class_assigned" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[33px]" placeholder="Class" 
                        options={options.classes.map((c: any) => ({ value: c.id, label: c.name }))} />
                    )} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><Hash size={12} /> Section</label>
                    <Controller name="section" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[33px]" placeholder="Section" 
                        options={options.sections.map((s: any) => ({ value: s.id, label: s.name }))} />
                    )} />
                  </FormItem>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update Assignment" : "Assign Now"}</span>
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