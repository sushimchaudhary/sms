"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Save,
  Loader2,
  X,
  BookOpen,
  School,
} from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Input } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";

import useAuth from "@/lib/hooks/useAuth";
import { SubjectServices } from "@/services/subjectServices"; // Subject services create garnu hola

export default function SubjectForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      school: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name || "",
          school: String(initialData.school?.id || initialData.school || loggedInUser?.school_id || ""),
        });
      } else {
        form.reset({
          name: "",
          school: loggedInUser?.school_id ? String(loggedInUser.school_id) : "",
        });
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isUpdate) {
        await SubjectServices.updateSubject(initialData.id, values);
        toast.success("Subject updated successfully");
      } else {
        await SubjectServices.createSubject(values);
        toast.success("Subject created successfully");

         form.reset({
          name: "",
          school: loggedInUser?.school_id ? String(loggedInUser.school_id) : "",
          
          
        });
      }
        

      

      if (onSuccess) {
        onSuccess();
      }
      // onClose();
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

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="w-full max-w-md bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: primaryColor,
                borderRadius: 4,
                controlOutlineWidth: 1,
                controlOutline: `${primaryColor}1A`,
              },
            }}
          >
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookOpen size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Subject" : "Create New Subject"}
              </h2>
              <button
                onClick={onClose}
                className="text-red-500 hover:rotate-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="px-6 py-5 space-y-4"
              >
                <FormItem className="w-full">
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <BookOpen size={12} /> Subject Name
                  </label>
                  <Controller
                    name="name"
                    control={form.control}
                    rules={{ required: "Subject name is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g. Mathematics, Science"
                        className="h-[33px]"
                      />
                    )}
                  />
                </FormItem>

                {/* Hidden field for school ID */}
                <input type="hidden" {...form.register("school")} />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Save size={12} />
                      )}
                      <span>
                        {isUpdate ? "Update Subject" : "Save Subject"}
                      </span>
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