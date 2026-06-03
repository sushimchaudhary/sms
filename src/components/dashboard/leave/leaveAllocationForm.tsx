"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Save,
  Loader2,
  X,
  UserCheck,
  ClipboardList,
  Layers,
} from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, InputNumber, Radio } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { LeaveAllocationServices } from "@/services/leaveAllocationServices"; 
import { SessionServices } from "@/services/sessionsServices"; // Session service fetch garna थपिएको
import useAuth from "@/lib/hooks/useAuth";
import { TeacherServices } from "@/services/teacherServices";
import { StaffServices } from "@/services/staffServices";

interface LeaveAllocationFormValues {
  session: string | number | null;
  allocation_type: "teacher" | "staff"; 
  teacher: string | number | null;
  staff: string | number | null;
  casual_leave: number;
  sick_leave: number;
  festival_leave: number;
  maternity_leave: number;
  funeral_leave: number;
}

export default function LeaveAllocationForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // States for options
  const [teachers, setTeachers] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [sessions, setSessions] = useState([]); // Static array lai dynamic banako

  const form = useForm<LeaveAllocationFormValues>({
    defaultValues: {
      session: null,
      allocation_type: "teacher",
      teacher: null,
      staff: null,
      casual_leave: 0,
      sick_leave: 0,
      festival_leave: 0,
      maternity_leave: 0,
      funeral_leave: 0,
    },
  });

  const allocationType = form.watch("allocation_type");

  // In your useEffect, replace the single users call:
useEffect(() => {
  const fetchData = async () => {
    console.log("🔄 Fetching dropdown data... isOpen:", isOpen);
    try {
      const [teachersRes, staffsRes, sessionRes] = await Promise.all([
        TeacherServices.getAllTeachers(),
        StaffServices.getAllstaffs(),
        SessionServices.getSessions(),
      ]);

      

      const parsedTeachers = teachersRes?.results || teachersRes?.data || teachersRes || [];
      const parsedStaffs = staffsRes?.results || staffsRes?.data || staffsRes || [];
      const parsedSessions = sessionRes?.results || sessionRes?.data || sessionRes || [];

  

      setTeachers(parsedTeachers);
      setStaffs(parsedStaffs);
      setSessions(parsedSessions);


    } catch (err) {
      toast.error("Failed to load dependency dropdown configurations");
    }
  };

  if (isOpen) {
    fetchData();
  } else {
  }
}, [isOpen]);


  // २. Update Mode र default logged in context processing
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          session: initialData.session?.id || initialData.session,
          allocation_type: initialData.staff ? "staff" : "teacher",
          teacher: initialData.teacher?.id || initialData.teacher,
          staff: initialData.staff?.id || initialData.staff,
          casual_leave: initialData.casual_leave || 0,
          sick_leave: initialData.sick_leave || 0,
          festival_leave: initialData.festival_leave || 0,
          maternity_leave: initialData.maternity_leave || 0,
          funeral_leave: initialData.funeral_leave || 0,
        });
      } else {
        form.reset({
          session: loggedInUser?.active_session_id || null, // Auto select dynamic sequence context
          allocation_type: "teacher",
          teacher: null,
          staff: null,
          casual_leave: 0,
          sick_leave: 0,
          festival_leave: 0,
          maternity_leave: 0,
          funeral_leave: 0,
        });
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);

  // ३. Type change cross checks cleaner
  useEffect(() => {
    if (!isUpdate) {
      if (allocationType === "teacher") {
        form.setValue("staff", null);
      } else {
        form.setValue("teacher", null);
      }
    }
  }, [allocationType, form, isUpdate]);

//   const onSubmit = async (values: LeaveAllocationFormValues) => {
//     setLoading(true);
//     const payload = {
//       ...values,
//       teacher: values.allocation_type === "teacher" ? values.teacher : null,
//       staff: values.allocation_type === "staff" ? values.staff : null,
//     };

//     try {
//       if (isUpdate) {
//         await LeaveAllocationServices.updateLeaveAllocation(initialData.id, payload);
//         toast.success("Leave allocation updated successfully");
//       } else {
//         await LeaveAllocationServices.createLeaveAllocation(payload);
//         toast.success("Leave allocation created successfully");
//       }
//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       const serverErrors = err.response?.data;
//       if (serverErrors?.non_field_errors) {
//         toast.error(serverErrors.non_field_errors[0]);
//       } else {
//         toast.error("Error occurred while saving configurations");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };


const onSubmit = async (values: LeaveAllocationFormValues) => {
  console.log("📤 Form submitted — raw values:", values);
  setLoading(true);
  const payload = {
    ...values,
    teacher: values.allocation_type === "teacher" ? values.teacher : null,
    staff: values.allocation_type === "staff" ? values.staff : null,
  };
  console.log("📦 Final payload to API:", payload);

  try {
    if (isUpdate) {
      await LeaveAllocationServices.updateLeaveAllocation(initialData.id, payload);
     
      toast.success("Leave allocation updated successfully");
    } else {
      await LeaveAllocationServices.createLeaveAllocation(payload);
      toast.success("Leave allocation created successfully");
    }
    onSuccess();
    onClose();
  } catch (err: any) {
    const serverErrors = err.response?.data;
    if (serverErrors?.non_field_errors) {
      toast.error(serverErrors.non_field_errors[0]);
    } else {
      toast.error("Error occurred while saving configurations");
    }
  } finally {
    setLoading(false);
  }
};


  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <>
      <div onClick={handleClose} className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />

      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 flex flex-col max-h-[95vh] overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Leave Allocation Config" : "Create Leave Allocation"}
              </h2>
              <button onClick={handleClose} className="text-red-500 hover:rotate-90 transition-transform p-1">
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                
                {/* Row 1: Session & Target Type Mapping */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Layers size={12} /> Academic Session
                    </label>
                    <Controller
                      name="session"
                      control={form.control}
                      render={({ field }) => (
                        <Select 
                          {...field} 
                          placeholder="Select Session" 
                          className="w-full h-[33px]" 
                          options={sessions.map((s: any) => ({
                            value: s.id,
                            label: s.name,
                          }))} 
                        />
                      )}
                    />
                  </FormItem>

                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <UserCheck size={12} /> Allocate Target Type
                    </label>
                    <div className="h-[33px] flex items-center border border-gray-200 px-3 bg-gray-50 rounded">
                      <Controller
                        name="allocation_type"
                        control={form.control}
                        render={({ field }) => (
                          <Radio.Group {...field} disabled={isUpdate} className="flex gap-6">
                            <Radio value="teacher">Teacher </Radio>
                            <Radio value="staff">Staff </Radio>
                          </Radio.Group>
                        )}
                      />
                    </div>
                  </FormItem>
                </div>

                {/* Row 2: Target Entity Selection */}
                {allocationType === "teacher" ? (
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <UserCheck size={12} /> Select Teacher
                    </label>
                    <Controller
                      name="teacher"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          showSearch
                          disabled={isUpdate}
                          placeholder="Choose target teacher account"
                          className="w-full h-[33px]"
                          optionFilterProp="label"
                         options={(() => {
  return teachers.map((t: any) => {
    const opt = {
      value: t.id,
      label: `${t.first_name_display || ""} ${t.last_name_display || ""} (${t.user_email || "No Email"})`,
    };
    return opt;
  });
})()}
                        />
                      )}
                    />
                  </FormItem>
                ) : (
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <UserCheck size={12} /> Select Staff Member
                    </label>
                    <Controller
                      name="staff"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          showSearch
                          disabled={isUpdate}
                          placeholder="Choose target staff account"
                          className="w-full h-[33px]"
                          optionFilterProp="label"
                        options={(() => {
  return staffs.map((s: any) => {
    const opt = {
      value: s.id,
      label: `${s.first_name_display || ""} ${s.last_name_display || ""} (${s.user_email || "No Email"})`,
    };
    return opt;
  });
})()}
                        />
                      )}
                    />
                  </FormItem>
                )}

                <hr className="border-gray-100" />
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Leave Allocation Details Limit</h4>

                {/* ── Single Line Horizontal Row Flow Design ── */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-3 rounded border border-gray-100">
                  <div className="flex-1 min-w-[90px]">
                    <label className="text-[11px] font-bold text-gray-600 block mb-0.5 truncate">Casual</label>
                    <Controller
                      name="casual_leave"
                      control={form.control}
                      render={({ field }) => <InputNumber {...field} min={0} className="w-full h-[28px] text-xs" />}
                    />
                  </div>

                  <div className="flex-1 min-w-[90px]">
                    <label className="text-[11px] font-bold text-gray-600 block mb-0.5 truncate">Sick</label>
                    <Controller
                      name="sick_leave"
                      control={form.control}
                      render={({ field }) => <InputNumber {...field} min={0} className="w-full h-[28px] text-xs" />}
                    />
                  </div>

                  <div className="flex-1 min-w-[90px]">
                    <label className="text-[11px] font-bold text-gray-600 block mb-0.5 truncate">Festival</label>
                    <Controller
                      name="festival_leave"
                      control={form.control}
                      render={({ field }) => <InputNumber {...field} min={0} className="w-full h-[28px] text-xs" />}
                    />
                  </div>

                  <div className="flex-1 min-w-[90px]">
                    <label className="text-[11px] font-bold text-gray-600 block mb-0.5 truncate">Maternity</label>
                    <Controller
                      name="maternity_leave"
                      control={form.control}
                      render={({ field }) => <InputNumber {...field} min={0} className="w-full h-[28px] text-xs" />}
                    />
                  </div>

                  <div className="flex-1 min-w-[90px]">
                    <label className="text-[11px] font-bold text-gray-600 block mb-0.5 truncate">Funeral</label>
                    <Controller
                      name="funeral_leave"
                      control={form.control}
                      render={({ field }) => <InputNumber {...field} min={0} className="w-full h-[28px] text-xs" />}
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={handleClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update System Matrix" : "Execute Allocation"}</span>
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