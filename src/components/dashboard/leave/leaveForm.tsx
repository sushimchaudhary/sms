"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Save,
  Loader2,
  X,
  Calendar,
  MessageSquare,
  ClipboardList,
  UploadCloud,
  Briefcase,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, DatePicker, Upload, Checkbox } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import dayjs from "dayjs";
import useAuth from "@/lib/hooks/useAuth";
import { LeaveServices } from "@/services/leaveServices";
import { EnrollmentServices } from "@/services/studentEnrollment";
import CalendarPicker from "@/components/ui/Calendar";
import NepaliDate from "nepali-date-converter";


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



interface LeaveFormValues {
  leave_type: string;
  start_date: string | null;
  end_date: string | null;
  reason: string;
  is_half_day: boolean;
  status?: string;
  student_enrollment?: string | number | null;
  teacher?: string | number | null;
  staff?: string | number | null;
}

const LEAVE_TYPES = [
  { label: "Sick Leave", value: "sick" },
  { label: "Casual Leave", value: "casual" },
  { label: "Emergency Leave", value: "emergency" },
  { label: "Other", value: "other" },
];

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function LeaveForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // Roles Check
  const isSuperAdmin = loggedInUser?.role === "superadmin";
  const isAdmin = loggedInUser?.role === "admin";
  const isManagement = isSuperAdmin || isAdmin;

  // Logic: Field Disable गर्ने कि नगर्ने?
  const isOwner =
    initialData?.user?.id === loggedInUser?._id ||
    initialData?.student === loggedInUser?._id;
  const canEditFields = !isUpdate || isOwner;

  // Logic: Status फेर्न पाउने कि नपाउने?
  // यदि Admin ले create गरेको हो भने superadmin ले मात्र status change गर्न पाउने
  const createdByAdmin =
    initialData?.user?.role === "admin" ||
    initialData?.created_by_role === "admin";
  const canUpdateStatus =
    isUpdate && isManagement && (!createdByAdmin || isSuperAdmin);

  const form = useForm<LeaveFormValues>({
    defaultValues: {
      leave_type: "sick",
      start_date: null,
      end_date: null,
      reason: "",
      is_half_day: false,
      status: "pending",
    },
  });

  const isHalfDay = form.watch("is_half_day");
  const startDate = form.watch("start_date");

  useEffect(() => {
    if (isHalfDay && startDate) {
      form.setValue("end_date", startDate);
    }
  }, [isHalfDay, startDate, form]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          ...initialData,
          start_date: initialData.start_date
            ? adToBSValue(initialData.start_date)
            : null,
          end_date: initialData.end_date ? adToBSValue(initialData.end_date) : null,
          status: initialData.status || "pending",
        });
        if (initialData.attachment) {
          setFileList([
            {
              uid: "-1",
              name: "Current Attachment",
              status: "done",
              url: initialData.attachment,
            },
          ]);
        }
      } else {
        form.reset({
          leave_type: "sick",
          is_half_day: false,
          reason: "",
          start_date: null,
          end_date: null,
          status: "pending",
        });
        setFileList([]);
      }
    }
  }, [initialData, isOpen, form]);

  const onSubmit = async (values: LeaveFormValues) => {
    setLoading(true);
    const formData = new FormData();

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("attachment", fileList[0].originFileObj);
    }
    // Backend मा status पठाउने
    formData.append("status", values.status || "pending");

    // अरु fields हरू permission छ भने मात्र पठाउने
    if (canEditFields) {
      formData.append("leave_type", values.leave_type);
      formData.append("reason", values.reason);
      formData.append("is_half_day", String(values.is_half_day));
      if (values.start_date)
        formData.append("start_date", values.start_date);
      const finalEndDate = values.is_half_day
        ? values.start_date
        : values.end_date;
      if (finalEndDate)
        formData.append("end_date", finalEndDate);
    }

    try {
      if (isUpdate) {
        await LeaveServices.updateLeave(initialData.id, formData);
        toast.success("Updated Successfully");
      } else {
        await LeaveServices.createLeave(formData);
        toast.success("Applied Successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const serverErrors = err.response?.data;
      if (serverErrors) {
        Object.keys(serverErrors).forEach((key) => {
          const message = Array.isArray(serverErrors[key])
            ? serverErrors[key][0]
            : serverErrors[key];
          toast.error(`${key}: ${message}`);
        });
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setFileList([]);
    onClose();
  };

  return (
    <>
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="w-full max-w-xl bg-white rounded shadow-md border border-gray-200 flex flex-col max-h-[95vh] overflow-hidden font-mukta">
          <ConfigProvider
            theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}
          >
            <div className="bg-white px-4 py-2 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList size={15} style={{ color: primaryColor }} />
                {isUpdate
                  ? canEditFields
                    ? "Edit Leave Request"
                    : "Manage Leave Status"
                  : "New Leave Application"}
              </h2>
              <button
                onClick={handleClose}
                className="text-red-500 hover:rotate-90 transition-transform p-1"
              >
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="px-4 sm:px-6 py-4 space-y-2 overflow-y-auto flex-1"
              >
                {/* Status Section for Management */}
                {isManagement && isUpdate && (
                  <div
                    className="p-2 rounded-md space-y-1 border"
                    style={{
                      backgroundColor: canUpdateStatus
                        ? `${primaryColor}15`
                        : "#f9fafb",
                      borderColor: canUpdateStatus
                        ? `${primaryColor}30`
                        : "#f3f4f6",
                    }}
                  >
                    <label
                      className="text-[11px] font-bold flex justify-between items-center uppercase tracking-wider"
                      style={{
                        color: canUpdateStatus ? primaryColor : "#9ca3af",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2
                          size={14}
                          style={{
                            color: canUpdateStatus ? primaryColor : "#9ca3af",
                          }}
                        />
                        Review Status
                      </span>
                      {!canUpdateStatus && (
                        <span className="flex items-center gap-1 text-gray-400 normal-case font-normal italic">
                          <Lock size={12} /> Superadmin Only
                        </span>
                      )}
                    </label>

                    <Controller
                      name="status"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          disabled={!canUpdateStatus}
                          className="w-full h-[35px]"
                          options={STATUS_OPTIONS}
                        />
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Briefcase size={12} /> Leave Type
                    </label>
                    <Controller
                      name="leave_type"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          disabled={!canEditFields}
                          className="w-full h-[33px]"
                          options={LEAVE_TYPES}
                        />
                      )}
                    />
                  </FormItem>

                  <FormItem className="flex items-end pb-1">
                    <Controller
                      name="is_half_day"
                      control={form.control}
                      render={({ field: { value, onChange } }) => (
                        <Checkbox
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          disabled={!canEditFields}
                        >
                          <span className="text-[12px] font-bold text-gray-700 uppercase italic">
                            Half Day
                          </span>
                        </Checkbox>
                      )}
                    />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar size={12} /> Start Date
                    </label>
                    <Controller
                      name="start_date"
                      control={form.control}
                      render={({ field }) => (
                         <CalendarPicker   
                                // value={field.value ? adToBSValue(field.value) : new NepaliDate().format("YYYY-MM-DD")}  
                                value={field.value || ""}
                            onChange={(date) => field.onChange(date)}
                            />
                      )}
                    />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar size={12} /> End Date
                    </label>
                    <Controller
                      name="end_date"
                      control={form.control}
                      render={({ field }) => (
                       <CalendarPicker  
                         value={field.value || ""} 
                            // value={field.value ? adToBSValue(field.value) : new NepaliDate().format("YYYY-MM-DD")}  

                            onChange={(date) => field.onChange(date)}
                            />
                      )}
                    />
                  </FormItem>
                </div>

                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <MessageSquare size={12} /> Reason
                  </label>
                  <Controller
                    name="reason"
                    control={form.control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        disabled={!canEditFields}
                        className="w-full p-2 border border-gray-200 rounded text-[12px] min-h-[70px] focus:border-blue-400 outline-none disabled:bg-gray-50"
                        placeholder="Reason for leave..."
                      />
                    )}
                  />
                </FormItem>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <UploadCloud size={12} /> Attachment
                  </label>
                  <div
                    className={`flex items-center gap-3 p-2 border border-dashed rounded ${canEditFields ? "bg-gray-50/50 border-gray-200" : "bg-gray-100 border-gray-200"}`}
                  >
                    <Upload
                      beforeUpload={() => false}
                      maxCount={1}
                      fileList={fileList}
                      onChange={({ fileList }) => setFileList(fileList)}
                      showUploadList={false}
                      disabled={!canEditFields}
                    >
                      <button
                        type="button"
                        disabled={!canEditFields}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[10px] font-bold hover:bg-gray-50 uppercase disabled:opacity-50"
                      >
                        Choose File
                      </button>
                    </Upload>
                    <span className="text-[11px] text-gray-500 truncate flex-1">
                      {fileList.length > 0 ? fileList[0].name : "Attachment"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                  <CancelButton onClick={handleClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center justify-center gap-2">
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Save size={12} />
                      )}
                      <span>
                        {isUpdate ? "Save Changes" : "Submit Application"}
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
