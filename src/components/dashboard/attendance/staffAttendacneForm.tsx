"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Save,
  Loader2,
  X,
  UserCheck,
  CalendarDays,
  FileText,
  CheckCircle,
  LogIn,
  LogOut,
} from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, DatePicker, TimePicker, Input } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import dayjs from "dayjs";

// Services
import { AttendanceServices } from "@/services/attendanceServices";
import { UserServices } from "@/services/authServices";
import useAuth from "@/lib/hooks/useAuth";
import NepaliDate from "nepali-date-converter";
// ─── install: npm install nepali-datepicker-reactjs ───
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import CalendarPicker from "@/components/ui/Calendar";



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

export default function StaffAttendanceForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // स्टाफ वा टिचर हो कि हैन चेक गर्ने
  const isStaffOrTeacher =
    loggedInUser?.role === "teacher" || loggedInUser?.role === "staff";
  const [options, setOptions] = useState({ staffUsers: [] });

  const form = useForm({
    defaultValues: {
      user: null,
      date: dayjs().format("YYYY-MM-DD"),
      status: "present",
      check_in: null,
      check_out: null,
      remarks: "",
    },
  });

 
useEffect(() => {
  const fetchData = async () => {
    try {
      const users = await UserServices.getStaffAndTeachers();
      const all = Array.isArray(users)
        ? users
        : users?.results || users?.data || [];
      
      const filteredStaffAndTeachers = all.filter(
        (u: any) => u.role === "staff" || u.role === "teacher" || u.role === "admin" || u.id === loggedInUser?.id || u._id === loggedInUser?.id // यो लाइनले सुनिश्चित गर्छ कि यदि कुनै स्टाफ वा टिचरले फर्म खोल्यो भने उनी आफैंलाई पनि देख्न सक्छन्
      );

      setOptions({ staffUsers: filteredStaffAndTeachers });
    } catch {
      toast.error("Failed to load staff data");
    }
  };
  if (isOpen && !isStaffOrTeacher) fetchData();
}, [isOpen, isStaffOrTeacher]);


  useEffect(() => {
    if (isOpen) {
      const currentUserId = loggedInUser?._id || loggedInUser?.id;

      form.reset({
        user:
          initialData?.user?.id ||
          initialData?.user ||
          (isStaffOrTeacher ? currentUserId : null),
        date: initialData?.date || dayjs().format("YYYY-MM-DD"),
        status: initialData?.status || "present",
        check_in:
          initialData?.check_in ||
          (isStaffOrTeacher && !isUpdate ? dayjs().format("HH:mm:ss") : null),
        check_out: initialData?.check_out || null,
        remarks: initialData?.remarks || "",
      });
    }
  }, [initialData, isOpen, loggedInUser, isStaffOrTeacher, isUpdate]);

  

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const currentUserId = loggedInUser?._id;
      const isSelf = String(values.user) === String(currentUserId);

      const payload = {
        ...values,
        date:
          typeof values.date === "string"
            ? values.date
            : dayjs(values.date).format("YYYY-MM-DD"),
        check_in: values.check_in
          ? dayjs(values.check_in, "HH:mm:ss").isValid()
            ? values.check_in
            : dayjs(values.check_in).format("HH:mm:ss")
          : null,
        check_out: values.check_out
          ? dayjs(values.check_out, "HH:mm:ss").isValid()
            ? values.check_out
            : dayjs(values.check_out).format("HH:mm:ss")
          : null,
        is_self_marked: isSelf,
        marked_by: currentUserId,
      };

      isUpdate
        ? await AttendanceServices.updateStaffAttendance(
            initialData.id,
            payload,
          )
        : await AttendanceServices.createStaffAttendance(payload);

      toast.success(
        isUpdate ? "Attendance updated" : "Attendance marked successfully",
      );
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

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-vvivible font-mukta">
          <ConfigProvider
            theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}
          >
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle size={15} style={{ color: primaryColor }} />
                {isUpdate
                  ? "Update Staff Attendance"
                  : isStaffOrTeacher
                    ? "Mark Your Attendance"
                    : "Staff Attendance Form"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                  {/* Staff Selection */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <UserCheck size={12} /> Staff / Teacher
                    </label>
                    <Controller
                      name="user"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          disabled={isStaffOrTeacher || isUpdate}
                          showSearch
                          className="w-full h-[33px]"
                          placeholder="Select Staff"
                          optionFilterProp="label"
                          options={
                            isStaffOrTeacher
                              ? [
                                  {
                                    value:
                                      loggedInUser?._id || loggedInUser?.id,
                                    label: `${loggedInUser?.name || "You"} (${loggedInUser?.email})`,
                                  },
                                ]
                              : options.staffUsers.map((u: any) => ({
                                  value: u.id || u._id,
                                  label: `${u.name || u.first_name} (${u.email})`,
                                }))
                          }
                        />
                      )}
                    />
                  </FormItem>

                 {/* Date */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <CalendarDays size={12} /> Date
                    </label>
                    <Controller
                      name="date"
                      control={form.control}
                      render={({ field }) => (
                        <div className="w-full nepali-picker-container">
                          {/* <NepaliDatePicker
                            // inputClassName ma border ra height milaune tailwind classes haleko
                            inputClassName="w-full h-[33px] px-3 py-1 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                            value={adToBSValue(field.value)}
                            onChange={(bsVal: string) =>
                              field.onChange(bsToADValue(bsVal))
                            }
                            options={{
                              calenderLocale: "ne",
                              valueLocale: "en",
                            }}
                          /> */}

                         <CalendarPicker 
                          value={field.value ? adToBSValue(field.value) : new NepaliDate().format("YYYY-MM-DD")} 
                          onChange={(bsDate) => {
                            field.onChange(bsToADValue(bsDate));
                          }}
                        />
                        </div>
                      )}
                    />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <CheckCircle size={12} /> Status
                    </label>
                    <Controller
                      name="status"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full h-[33px]"
                          options={[
                            { value: "present", label: "Present" },
                            { value: "absent", label: "Absent" },
                            { value: "leave", label: "Leave" },
                            { value: "half_day", label: "Half Day" },
                          ]}
                        />
                      )}
                    />
                  </FormItem>

                  {/* Marked By (Read Only Info) */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <UserCheck size={12} /> Marked By
                    </label>
                    <div className="w-full h-[33px] px-3 flex items-center rounded border border-gray-200 bg-gray-50 text-[12px] text-gray-500 font-medium">
                      {isUpdate && initialData?.marked_by_email
                        ? initialData.marked_by_email
                        : loggedInUser?.name || loggedInUser?.email}
                    </div>
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Check In */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <LogIn size={12} /> Check In Time
                    </label>
                    <Controller
                      name="check_in"
                      control={form.control}
                      render={({ field }) => (
                        <TimePicker
                          className="w-full h-[33px]"
                          format="HH:mm"
                          value={
                            field.value ? dayjs(field.value, "HH:mm:ss") : null
                          }
                          onChange={(time) =>
                            field.onChange(
                              time ? time.format("HH:mm:ss") : null,
                            )
                          }
                        />
                      )}
                    />
                  </FormItem>

                  {/* Check Out */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <LogOut size={12} /> Check Out Time
                    </label>
                    <Controller
                      name="check_out"
                      control={form.control}
                      render={({ field }) => (
                        <TimePicker
                          className="w-center h-[33px] w-full"
                          format="HH:mm"
                          value={
                            field.value ? dayjs(field.value, "HH:mm:ss") : null
                          }
                          onChange={(time) =>
                            field.onChange(
                              time ? time.format("HH:mm:ss") : null,
                            )
                          }
                        />
                      )}
                    />
                  </FormItem>
                </div>

                {/* Remarks */}
                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <FileText size={12} /> Remarks / Note
                  </label>
                  <Controller
                    name="remarks"
                    control={form.control}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        rows={2}
                        placeholder="Reason for leave or extra notes..."
                        className="text-[13px]"
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
                      <span>
                        {isUpdate ? "Update Record" : "Save Attendance"}
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
