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
  UserPlus 
} from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, DatePicker, Input } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import dayjs from "dayjs";

// Services (तपाईँको API structure अनुसार import गर्नुहोला)
import { AttendanceServices } from "@/services/attendanceServices";
import { StudentServices } from "@/services/studentServices"; 
import { TeacherServices } from "@/services/teacherServices";
import useAuth from "@/lib/hooks/useAuth";
import { EnrollmentServices } from "@/services/studentEnrollment";

export default function StudentAttendanceForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState({ 
    enrollments: [], 
    teachers: [] 
  });

  const form = useForm({
    defaultValues: { 
      enrollment: null, 
      date: dayjs().format("YYYY-MM-DD"), 
      status: "present", 
      remarks: "", 
      marked_by: null,
      school: "" 
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [students, teachers] = await Promise.all([
         EnrollmentServices.getAllEnrollments(), // Enrollment list fetch गर्न
          TeacherServices.getAllTeachers(),
        ]);
        setOptions({
          enrollments: students.results || students,
          teachers: teachers.results || teachers,
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
        enrollment: initialData?.enrollment?.id || initialData?.enrollment || null,
        date: initialData?.date || dayjs().format("YYYY-MM-DD"),
        status: initialData?.status || "present",
        remarks: initialData?.remarks || "",
        marked_by: initialData?.marked_by?.id || initialData?.marked_by || null,
        school: String(loggedInUser?.school_id || ""),
      });
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Date formatting to YYYY-MM-DD for Django
      const payload = {
        ...values,
        date: typeof values.date === 'string' ? values.date : values.date.format("YYYY-MM-DD")
      };

      isUpdate 
        ? await AttendanceServices.updateStudentAttendance(initialData.id, payload)
        : await AttendanceServices.createStudentAttendance(payload);
      
      toast.success(isUpdate ? "Attendance updated" : "Attendance marked successfully");
      onSuccess(); 
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Error occurred while saving attendance");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Update Student Attendance" : "Mark Student Attendance"}
              </h2>
              <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student/Enrollment Selection */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <UserPlus size={12} /> Student Enrollment
                    </label>
                    <Controller name="enrollment" control={form.control} render={({ field }) => (
                      <Select 
                        {...field} 
                        showSearch 
                        className="w-full h-[33px]" 
                        placeholder="Select Student" 
                        optionFilterProp="label"
                        options={options.enrollments.map((e: any) => ({
                          value: e.id,
                          label: `${e.student?.full_name || e.student_name} (${e.enrollment_no || e.id})`,
                        }))} 
                      />
                    )} />
                  </FormItem>

                  {/* Attendance Date */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <CalendarDays size={12} /> Date
                    </label>
                    <Controller name="date" control={form.control} render={({ field }) => (
                      <DatePicker 
                        className="w-full h-[33px]" 
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.format("YYYY-MM-DD") : "")}
                      />
                    )} />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Selection */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <CheckCircle size={12} /> Status
                    </label>
                    <Controller name="status" control={form.control} render={({ field }) => (
                      <Select 
                        {...field} 
                        className="w-full h-[33px]" 
                        options={[
                          { value: "present", label: "Present" },
                          { value: "absent", label: "Absent" },
                          { value: "leave", label: "Leave" },
                          { value: "late", label: "Late" },
                        ]} 
                      />
                    )} />
                  </FormItem>

                  {/* Marked By (Teacher) */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <UserCheck size={12} /> Marked By
                    </label>
                    <Controller name="marked_by" control={form.control} render={({ field }) => (
                      <Select 
                        {...field} 
                        showSearch
                        placeholder="Select Teacher"
                        className="w-full h-[33px]" 
                        optionFilterProp="label"
                        options={options.teachers.map((t: any) => ({
                          value: t.id,
                          label: t.full_name || `${t.first_name_display} ${t.last_name_display}`,
                        }))} 
                      />
                    )} />
                  </FormItem>
                </div>

                {/* Remarks Field */}
                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <FileText size={12} /> Remarks
                  </label>
                  <Controller name="remarks" control={form.control} render={({ field }) => (
                    <Input.TextArea 
                      {...field} 
                      rows={2} 
                      placeholder="Enter any notes or remarks..." 
                      className="text-[13px]"
                    />
                  )} />
                </FormItem>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update Record" : "Save Attendance"}</span>
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