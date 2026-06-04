"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, Wallet, UserCheck, Tag, IndianRupee, Calendar } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, InputNumber } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import dayjs from "dayjs";

// Services
import { FeeServices } from "@/services/feeServices";
import { EnrollmentServices } from "@/services/studentEnrollment";
import useAuth from "@/lib/hooks/useAuth";

import NepaliDate from "nepali-date-converter";

// ─── install: npm install nepali-datepicker-reactjs ───
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import CalendarPicker from "@/components/ui/Calendar";

/** AD "YYYY-MM-DD" → BS "YYYY-MM-DD" */
const adToBSValue = (adStr: any): string => {
  if (!adStr) return "";
  const cleanAdStr = dayjs.isDayjs(adStr) ? adStr.format("YYYY-MM-DD") : String(adStr);
  
  try {
    const nd = new NepaliDate(new Date(cleanAdStr));
    const y = nd.getYear();
    const m = String(nd.getMonth() + 1).padStart(2, "0");
    const d = String(nd.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return "";
  }
};

/** BS "YYYY-MM-DD" → AD "YYYY-MM-DD" */
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

interface StudentFeeFormValues {
  enrollment: string | number | null;
  fee_type: string | number | null;
  total_amount: number;
  paid_amount: number;
  due_date: string | null;
  status: string;
  school: string;
}

export default function StudentFeeForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingFees, setFetchingFees] = useState(false);

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
      due_date: dayjs().format("YYYY-MM-DD"),
      status: 'unpaid',
      school: "" 
    }
  });

  const { setValue, watch, control, handleSubmit, reset } = form;

  const watchedEnrollment = watch("enrollment");
  const watchedFeeType = watch("fee_type");
  const watchedTotal = watch("total_amount");
  const watchedPaid = watch("paid_amount");

  const fetchFilteredFeeTypes = useCallback(async (studentEnrollmentId: any) => {
    if (!studentEnrollmentId) return;
    setFetchingFees(true);
    try {
      const response = await FeeServices.getAllFeeStructures({ student_id: studentEnrollmentId });
      const results = response.results || response;
      setOptions(prev => ({
        ...prev,
        feeTypes: Array.isArray(results) ? results : [],
      }));
    } catch (err) {
      toast.error("शुल्क लोड गर्न सकिएन।");
    } finally {
      setFetchingFees(false);
    }
  }, []);

  useEffect(() => {
    if (watchedEnrollment && isOpen) {
      fetchFilteredFeeTypes(watchedEnrollment);
    }
  }, [watchedEnrollment, fetchFilteredFeeTypes, isOpen]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const enr = await EnrollmentServices.getAllEnrollments();
        setOptions(prev => ({
          ...prev,
          enrollments: enr.results || enr,
        }));
      } catch (err) {
        toast.error("Enrollment data could not be loaded.");
      }
    };
    if (isOpen) fetchInitialData();
  }, [isOpen]);

  const handleModalClose = () => {
    reset({
      enrollment: null,
      fee_type: null,
      total_amount: 0,
      paid_amount: 0,
      due_date: null,
      status: 'unpaid',
      school: ""
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen && initialData) {
      const enrollmentId = initialData?.enrollment?.id || initialData?.enrollment || null;
      
      reset({
        enrollment: enrollmentId,
        fee_type: initialData?.fee_type?.id || initialData?.fee_type || null,
        total_amount: Number(initialData?.total_amount) || 0,
        paid_amount: Number(initialData?.paid_amount) || 0,
        due_date: initialData?.due_date ? dayjs(initialData.due_date).format("YYYY-MM-DD") : null,
        status: initialData?.status || 'unpaid',
        school: String(loggedInUser?.school_id || ""),
      });
    }
  }, [initialData, isOpen, loggedInUser, reset]);

  useEffect(() => {
    if (watchedFeeType && options.feeTypes.length > 0 && !isUpdate) {
      const selected = options.feeTypes.find((f: any) => f.fee_type == watchedFeeType);
      if (selected) {
        setValue("total_amount", Number(selected.amount) || 0);
      }
    }
  }, [watchedFeeType, options.feeTypes, setValue, isUpdate]);

  useEffect(() => {
    const total = Number(watchedTotal) || 0;
    const paid = Number(watchedPaid) || 0;
    if (total > 0) {
      if (paid >= total) setValue("status", "paid");
      else if (paid > 0 && paid < total) setValue("status", "partial");
      else setValue("status", "unpaid");
    }
  }, [watchedTotal, watchedPaid, setValue]);

  const onSubmit = async (values: StudentFeeFormValues) => {
    setLoading(true);
    const payload = {
      ...values,
      fee_type: Number(values.fee_type),
      enrollment: Number(values.enrollment),
      due_date: values.due_date || null,
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
    } catch {
      toast.error("Error occurred while saving fee");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <>
      {/* Dynamic Scrollbar CSS Injector (Saves adding global CSS) */}
      <style>{`
        .custom-slim-scrollbar .rc-virtual-list-holder::-webkit-scrollbar {
          width: 5px !important;
        }
        .custom-slim-scrollbar .rc-virtual-list-holder::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 4px;
        }
        .custom-slim-scrollbar .rc-virtual-list-holder::-webkit-scrollbar-thumb {
          background: ${primaryColor || '#3b82f6'} !important;
          border-radius: 4px;
        }
        .custom-slim-scrollbar .rc-virtual-list-holder::-webkit-scrollbar-thumb:hover {
          opacity: 0.8;
        }
      `}</style>

      <div onClick={onClose} className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-visible font-mukta">
          <ConfigProvider 
            theme={{ 
              token: { 
                colorPrimary: primaryColor, 
                borderRadius: 4 
              },
              components: {
                Select: {
                  // Dropdown भित्रको active items र scrollbar मा primaryColor मिलाउन टोकनहरू
                  optionSelectedBg: `${primaryColor}10`, // 10% opacity for selected item background
                }
              }
            }}
          >
            
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Wallet size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Student Fee" : "Assign Student Fee"}
              </h2>
              <button onClick={handleModalClose} className="text-red-500 hover:rotate-90 transition-transform">
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
                          placeholder="Search by name, roll, class or section..."
                          optionFilterProp="searchValue"
                          dropdownClassName="custom-slim-scrollbar" // Scrollbar custom class यहाँ जोडिएको छ
                          filterOption={(input, option) => {
                            if (!option?.searchValue) return false;
                            return option.searchValue.toLowerCase().includes(input.toLowerCase());
                          }}
                          onChange={(value) => {
                            field.onChange(value);
                            setOptions(prev => ({ ...prev, feeTypes: [] }));
                            setValue("fee_type", null);
                            setValue("total_amount", 0);
                          }}
                          options={options.enrollments.map((e: any) => ({ 
                            value: e.id, 
                            label: (
                              <div className="flex items-center justify-between w-full py-0.5 border-b border-gray-50/50 font-sans">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100">
                                    {e.student_name ? e.student_name.charAt(0).toUpperCase() : "S"}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[12px] font-bold text-slate-700 tracking-wide leading-tight">
                                      {e.student_name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      Roll No: <span className="font-semibold text-slate-500">{e.roll_number || "N/A"}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-3xs">
                                    Class: {e.class_name || "N/A"} - {e.section_name?.toUpperCase() || "N/A"}
                                  </span>
                                </div>
                              </div>
                            ),
                            searchValue: `${e.student_name} ${e.roll_number || ''} ${e.class_name || ''} ${e.section_name || ''}`
                          })).reverse()}
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
                          placeholder={fetchingFees ? "Loading..." : "Select Fee Type"}
                          optionFilterProp="label" 
                          dropdownClassName="custom-slim-scrollbar" // यसमा पनि म्याच गराउन स्क्रोलबार थपियो
                          loading={fetchingFees}
                          disabled={fetchingFees}
                          showSearch
                          options={options.feeTypes.map((f: any) => ({ 
                            value: f.fee_type,
                            label: `${f.fee_type_name} - Rs. ${f.amount}` 
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
                        <div className="w-full relative dynamic-nepali-container [&>.ndp-container]:!z-[9999]">
                          <CalendarPicker 
                            // यदि field.value छ भने त्यो देखाउने, छैन भने आजको मिति देखाउने
                            value={field.value ? adToBSValue(field.value) : adToBSValue(dayjs().format("YYYY-MM-DD"))} 
                            onChange={(bsDate) => {
                              const adDate = bsToADValue(bsDate); 
                              field.onChange(adDate); 
                            }}
                          />
                        </div>
                      )} 
                    />
                  </FormItem>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={handleModalClose} disabled={loading} />
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