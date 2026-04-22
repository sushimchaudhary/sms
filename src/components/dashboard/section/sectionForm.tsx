"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, Hash, Layers, CalendarDays } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Input, Select } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";

import { SessionServices } from "@/services/sessionsServices";
import { ClassServices } from "@/services/classServices";
import { SectionServices } from "@/services/sectionServices";
import useAuth from "@/lib/hooks/useAuth";

export default function SectionForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);

  const form = useForm({
    defaultValues: {
      name: "",
      school: "",
      session: null,
      class_assigned: null,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, classRes] = await Promise.all([
          SessionServices.getSessions(),
          ClassServices.getAllClasses(),
        ]);
        setSessions(sessionRes.results || sessionRes);
        setClasses(classRes.results || classRes);
      } catch (err) {
        toast.error("Failed to load dependency data");
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: initialData?.name || "",
        school: String(initialData?.school?.id || initialData?.school || loggedInUser?.school_id || ""),
        session: initialData?.session?.id || initialData?.session,
        class_assigned: initialData?.class_assigned?.id || initialData?.class_assigned,
      });
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isUpdate) {
        await SectionServices.updateSection(initialData.id, values);
        toast.success("Section updated successfully");
      } else {
        await SectionServices.createSection(values);
        toast.success("Section created successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Error saving section data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-lg bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Hash size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Section" : "Add New Section"}
              </h2>
              <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><Hash size={12} /> Section Name</label>
                  <Controller name="name" control={form.control} render={({ field }) => <Input {...field} placeholder="e.g. Section A" className="h-[35px]" />} />
                </FormItem>

                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><CalendarDays size={12} /> Session</label>
                    <Controller name="session" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[35px]" options={sessions.map((s: any) => ({ value: s.id, label: s.name }))} />
                    )} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><Layers size={12} /> Assign Class</label>
                    <Controller name="class_assigned" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[35px]" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} />
                    )} />
                  </FormItem>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update Section" : "Save Section"}</span>
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