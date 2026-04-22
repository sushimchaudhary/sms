"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, Wallet, UserCheck, Tag, IndianRupee, Calendar, ClipboardList } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, InputNumber, DatePicker } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import dayjs from "dayjs";

// Services
import { FeeServices } from "@/services/feeServices";
import { EnrollmentServices } from "@/services/studentEnrollment";
import useAuth from "@/lib/hooks/useAuth";

interface StudentFeeFormValues {
  enrollment: string | number | null;
  fee_type: string | number | null;
  total_amount: number;
  paid_amount: number;
  due_date: dayjs.Dayjs | null;
  status: string;
  school: string;
}

export default function StudentFeeForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState({ 
    enrollments: [] as any[], 
    feeTypes: [] as any[] 
  });

  const form = useForm<StudentFeeFormValues>({
    defaultValues: { 
      enrollment: null, 
      fee_type: null, 
      total_amount: 0, 
      paid_amount: 0,
      due_date: null,
      status: 'unpaid',
      school: "" 
    }
  });

  const { setValue, watch, control, handleSubmit, reset } = form;

  // Watch fields for auto-calculation
  const watchedFeeType = watch("fee_type");
  const watchedTotal = watch("total_amount");
  const watchedPaid = watch("paid_amount");

 useEffect(() => {
    if (watchedFeeType && options.feeTypes.length > 0 && !isUpdate) {
      const selected = options.feeTypes.find((f: any) => f.id === watchedFeeType);
      if (selected) {
        setValue("total_amount", Number(selected.amount) || 0);
      }
    }
  }, [watchedFeeType, options.feeTypes, setValue, isUpdate]);

  // Auto-update status logic
  useEffect(() => {
    const total = Number(watchedTotal) || 0;
    const paid = Number(watchedPaid) || 0;
    if (total > 0) {
      if (paid >= total) setValue("status", "paid");
      else if (paid > 0 && paid < total) setValue("status", "partial");
      else setValue("status", "unpaid");
    }
  }, [watchedTotal, watchedPaid, setValue]);

  
  // 2. Auto-update Status based on amounts
  useEffect(() => {
    const total = Number(watchedTotal) || 0;
    const paid = Number(watchedPaid) || 0;

    if (total > 0) {
      if (paid >= total) {
        setValue("status", "paid");
      } else if (paid > 0 && paid < total) {
        setValue("status", "partial");
      } else {
        setValue("status", "unpaid");
      }
    }
  }, [watchedTotal, watchedPaid, setValue]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enr, fType] = await Promise.all([
          EnrollmentServices.getAllEnrollments(),
          FeeServices.getAllFeeTypes(),
        ]);
        setOptions({
          enrollments: enr.results || enr,
          feeTypes: fType.results || fType,
        });
      } catch (err) {
        toast.error("Failed to load dependency data");
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      reset({
        enrollment: initialData?.enrollment?.id || initialData?.enrollment || null,
        fee_type: initialData?.fee_type?.id || initialData?.fee_type || null,
        total_amount: Number(initialData?.total_amount) || 0,
        paid_amount: Number(initialData?.paid_amount) || 0,
        due_date: initialData?.due_date ? dayjs(initialData.due_date) : null,
        status: initialData?.status || 'unpaid',
        school: String(loggedInUser?.school_id || ""),
      });
    }
  }, [initialData, isOpen, loggedInUser, reset]);

  const onSubmit = async (values: StudentFeeFormValues) => {
    setLoading(true);
    const payload = {
      ...values,
      due_date: values.due_date ? values.due_date.format("YYYY-MM-DD") : null,
    };
    
    try {
      if (isUpdate) {
        await FeeServices.updateStudentFees(initialData.id, payload);
      } else {
        await FeeServices.createStudentFees(payload);
      }
      
      toast.success(isUpdate ? "Fee record updated" : "Student fee assigned successfully");
      onSuccess(); 
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.non_field_errors?.[0] || "Error occurred while saving fee";
      toast.error(errorMsg);
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
                <Wallet size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Student Fee" : "Assign Student Fee"}
              </h2>
              <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <UserCheck size={12} className="text-blue-500" /> Student Enrollment
                    </label>
                    <Controller 
                      name="enrollment" 
                      control={control} 
                      rules={{ required: "Student selection is required" }} 
                      render={({ field }) => (
                        <Select 
                          {...field} 
                          showSearch 
                          className="w-full h-[35px]" 
                          placeholder="Select Student"
                          optionFilterProp="label"
                          options={options.enrollments.map((e: any) => ({ 
                            value: e.id, 
                            label: `${e.student_name} (${e.roll_no || 'No Roll'})` 
                          }))} 
                        />
                      )} 
                    />
                  </FormItem>

                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Tag size={12} className="text-indigo-500" /> Fee Type
                    </label>
                    <Controller 
                      name="fee_type" 
                      control={control} 
                      rules={{ required: "Fee type is required" }} 
                      render={({ field }) => (
                        <Select 
                          {...field} 
                          className="w-full h-[35px]" 
                          placeholder="Select Type"
                          options={options.feeTypes.map((f: any) => ({ 
                            value: f.id, 
                            label: f.name 
                          }))} 
                        />
                      )} 
                    />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <IndianRupee size={12} className="text-emerald-500" /> Total Amount
                    </label>
                    <Controller 
                      name="total_amount" 
                      control={control} 
                      render={({ field }) => (
                        <InputNumber {...field} className="w-full h-[35px]" placeholder="0.00" min={0} />
                      )} 
                    />
                  </FormItem>

                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <IndianRupee size={12} className="text-blue-500" /> Paid Amount
                    </label>
                    <Controller 
                      name="paid_amount" 
                      control={control} 
                      render={({ field }) => (
                        <InputNumber {...field} className="w-full h-[35px]" placeholder="0.00" min={0} />
                      )} 
                    />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar size={12} className="text-orange-500" /> Due Date
                    </label>
                    <Controller 
                      name="due_date" 
                      control={control} 
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          placeholder="YYYY-MM-DD"
                          className="w-full h-[33px]"
                          format="YYYY-MM-DD"
                          allowClear
                          panelRender={(panelNode) => (
                            <div style={{ transform: "scale(0.75)", transformOrigin: "top left", width: "133.33%", marginBottom: "-80px", marginRight: "-65px" }}>
                              {panelNode}
                            </div>
                          )}
                        />                      )} 
                    />
                  </FormItem>

                  {/* <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <ClipboardList size={12} className="text-slate-500" /> Payment Status
                    </label>
                    <Controller 
                      name="status" 
                      control={control} 
                      render={({ field }) => (
                        <Select 
                          {...field} 
                          className="w-full h-[35px]" 
                          options={[
                            { value: 'unpaid', label: 'Unpaid' },
                            { value: 'partial', label: 'Partial' },
                            { value: 'paid', label: 'Paid' },
                          ]} 
                        />
                      )} 
                    />
                  </FormItem> */}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update Fee" : "Save Fee Record"}</span>
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