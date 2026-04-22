"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { 
  AlertCircle, 
  Save, 
  Loader2, 
  X, 
  Type, 
  AlignLeft, 
  FileText, 
  CheckCircle2,
} from "lucide-react";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import useAuth from "@/lib/hooks/useAuth";
import { ComplaintServices } from "@/services/notificationServices";
import { useNotifications } from "@/lib/context/NotificationContext";

interface ComplaintFormValues {
  subject: string;
  message: string;
  status: string;
  response: string;
  school_id: string | number;
}

export default function ComplaintForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  
  const isAdmin = loggedInUser?.role === 'admin' || loggedInUser?.role === 'superadmin';
  
  const isOwner = initialData?.raised_by?.id === loggedInUser?._id || initialData?.raised_by === loggedInUser?._id;

  
  const canEditFields = !isUpdate || (isOwner && !isAdmin); 
  const canUpdateStatus = isAdmin; 
  const { refreshNotifications } = useNotifications();

  const form = useForm<ComplaintFormValues>({
    defaultValues: {
      subject: "",
      message: "",
      status: "pending",
      response: "",
      school_id: "",
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const currentSchoolId =
        initialData?.school?.id ||
        initialData?.school ||
        loggedInUser?.school_id ||
        loggedInUser?.school;

      if (initialData) {
        form.reset({
          subject: initialData.subject || "",
          message: initialData.message || "",
          status: initialData.status || "pending",
          response: initialData.response || "",
          school_id: currentSchoolId || "",
        });
      } else {
        form.reset({
          subject: "",
          message: "",
          status: "pending",
          response: "",
          school_id: currentSchoolId || "",
        });
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: ComplaintFormValues) => {
    setLoading(true);
    try {
      const payload: any = {};
      
      // Send fields based on permissions to prevent accidental overrides
      if (canEditFields) {
        payload.subject = values.subject;
        payload.message = values.message;
        payload.school = values.school_id;
      }

      if (canUpdateStatus && isUpdate) {
        payload.status = values.status;
        payload.response = values.response;
      }

      if (isUpdate) {
        const id = initialData.id || initialData._id;
        await ComplaintServices.updateComplaint(id, payload);
        toast.success("Complaint updated successfully");
      } else {
        await ComplaintServices.createComplaint({
          ...values,
          school: values.school_id
        });
        toast.success("Complaint registered successfully");
      }
      refreshNotifications();
      onSuccess();
      handleClose();
    } catch (err: any) {
       toast.error(err.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Manage Complaint" : "Register New Complaint"}
              </h2>
              <button onClick={handleClose} className="text-red-500 hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Subject Field - Disabled for Admin, Editable for Owner */}
                  <FormFieldControl
                    form={form}
                    name="subject"
                    label="Complaint Subject"
                    icon={<Type size={12} />}
                    placeholder="Enter short subject"
                    disabled={!canEditFields}
                  />

                  {/* Status Field - Only for Admin/Superadmin during Update */}
                  {isUpdate && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-semibold text-gray-600 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Status (Admin Only)
                      </label>
                      <Controller
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <Select
                            {...field}
                            disabled={!canUpdateStatus}
                            className="w-full h-8"
                            options={[
                              { value: "pending", label: "Pending" },
                              { value: "in_review", label: "In Review" },
                              { value: "resolved", label: "Resolved" },
                              { value: "rejected", label: "Rejected" },
                            ]}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Message Field - Disabled for Admin, Editable for Owner */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-gray-600 flex items-center gap-1">
                    <AlignLeft size={12} /> Detailed Message
                  </label>
                  <Controller
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={4}
                        disabled={!canEditFields}
                        placeholder="Explain your issue in detail..."
                        className="w-full p-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    )}
                  />
                  <FormMessage className="text-[10px]" />
                </div>

                {/* Response Field - Admin/Superadmin Only */}
                {isUpdate && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-gray-600 flex items-center gap-1">
                      <FileText size={12} /> Official Response (Admin Only)
                    </label>
                    <Controller
                      control={form.control}
                      name="response"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          disabled={!canUpdateStatus}
                          placeholder={canUpdateStatus ? "Write response..." : "No response yet."}
                          className="w-full p-2 border border-emerald-200 bg-emerald-50/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={handleClose} disabled={loading} />
                  {/* Hide or disable Save button if user has no permission to edit anything */}
                  <ThemedButton type="submit" size="sm" disabled={loading || (!canEditFields && !canUpdateStatus)}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Save Changes" : "Submit Complaint"}</span>
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

const FormFieldControl = ({ form, name, label, icon, placeholder, disabled = false }: any) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full relative">
          <ThemedInput
            label={label}
            icon={icon}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
          />
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  );
};