"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Save,
  Loader2,
  X,
  Layers,
  CalendarDays,
  School,
} from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Input, Select } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";

// Services (Tapai ko project structure anusar)
import { SessionServices } from "@/services/sessionsServices";

import useAuth from "@/lib/hooks/useAuth";
import { ClassServices } from "@/services/classServices";

export default function ClassForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);

  const form = useForm({
    defaultValues: {
      name: "",
      school: "",
      session: null,
    },
  });

 // Fetch Sessions and set default if creating new
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await SessionServices.getSessions();
        const data = sessionRes.results || sessionRes;
        setSessions(data);

        // Naya entry (Create) ko lagi matra auto-select garne
        if (!initialData) {
          // 'is_active' field huncha ki hernus, natra 'is_current' hola
          const currentSession = data.find((s: any) => s.is_active === true); 
          if (currentSession) {
            form.setValue("session", currentSession.id);
          }
        }
      } catch (err) {
        console.error("Session fetch error:", err);
        toast.error("Failed to load sessions");
      }
    };
    if (isOpen) fetchData();
  }, [isOpen, initialData, form]);
  

  // Handle Form Reset / Initial Data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name || "",
          school: String(initialData.school?.id || initialData.school || loggedInUser?.school_id || ""),
          session: initialData.session?.id || initialData.session,
        });
      } else {
        form.reset({
          name: "",
          school: loggedInUser?.school_id ? String(loggedInUser.school_id) : "",
          session: null,
        });
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isUpdate) {
        await ClassServices.updateClass(initialData.id, values);
        toast.success("Class updated successfully");
      } else {
        await ClassServices.createClass(values);
        toast.success("Class created successfully");

        form.reset({
          name: "",
          school: loggedInUser?.school_id ? String(loggedInUser.school_id) : "",
          session: null,
        });
      }
      if (onSuccess) {
        onSuccess();
      }
      // onClose();
    } catch (err: any) {
      const serverErrors = err.response?.data;
      if (serverErrors) {
        if (typeof serverErrors === "object") {
          Object.keys(serverErrors).forEach((key) => {
            const errorValue = serverErrors[key];
            const message = Array.isArray(errorValue) ? errorValue[0] : errorValue;
            toast.error(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${message}`);
          });
        } else {
          toast.error("Something went wrong on the server.");
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
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* Modal Container */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="w-full max-w-lg bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: primaryColor,
                borderRadius: 4,
                controlOutline: `${primaryColor}1A`,
              },
            }}
          >
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Layers size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Class" : "Create New Class"}
              </h2>
              <button
                onClick={onClose}
                className="text-red-500 hover:rotate-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
                
                {/* Class Name Input */}
                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Layers size={12} /> Class Name
                  </label>
                  <Controller
                    name="name"
                    control={form.control}
                    rules={{ required: "Class name is required" }}
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        placeholder="e.g. Class 10, Nursery A" 
                        className="h-[35px]"
                      />
                    )}
                  />
                </FormItem>

                {/* Session Select */}
                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <CalendarDays size={12} /> Select Academic Session
                  </label>
                  <Controller
                    name="session"
                    control={form.control}
                    rules={{ required: "Session selection is required" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        className="w-full h-[35px]"
                        placeholder="Choose Session"
                        options={sessions.map((s: any) => ({
                          value: s.id,
                          label: s.name,
                        }))}
                      />
                    )}
                  />
                </FormItem>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Save size={12} />
                      )}
                      <span>{isUpdate ? "Update Class" : "Create Class"}</span>
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