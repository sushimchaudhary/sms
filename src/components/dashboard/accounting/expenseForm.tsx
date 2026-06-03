"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, Receipt, Tag, IndianRupee, Calendar, FileText, Landmark } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, Input, InputNumber, DatePicker } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import dayjs from "dayjs";

import useAuth from "@/lib/hooks/useAuth";
import { SessionServices } from "@/services/sessionsServices";
import { FeeServices } from "@/services/feeServices";

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



interface ExpenseFormValues {
  title: string;
  expense_type: string;
  amount: number;
  date: string | null;
  session: string | number | null;
  school: string | number;
}

export default function ExpenseForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  const form = useForm<ExpenseFormValues>({
    defaultValues: {
      title: "",
      expense_type: "",
      amount: 0,
      date: dayjs().format("YYYY-MM-DD"),
      session: null,
      school: "",
    },
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessData = await SessionServices.getSessions();
        setSessions(sessData.results || sessData);
      } catch (err) {
        toast.error("Failed to load sessions");
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      reset({
        title: initialData?.title || "",
        expense_type: initialData?.expense_type || "",
        amount: Number(initialData?.amount) || 0,
        date: initialData?.date ? dayjs(initialData.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        session: initialData?.session?.id || initialData?.session || null,
        school: loggedInUser?.school_id || "",
      });
    }
  }, [initialData, isOpen, loggedInUser, reset]);

  const onSubmit = async (values: ExpenseFormValues) => {
    setLoading(true);
    const payload = {
      ...values,
      date: values.date ? values.date : null,
      school: loggedInUser?.school_id,
    };

    try {
      if (isUpdate) {
        await FeeServices.updateExpense(initialData.id, payload);
      } else {
        await FeeServices.createExpense(payload);
      }
      toast.success(isUpdate ? "Expense updated" : "Expense saved successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Error saving expense record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} />
      
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-visible font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Receipt size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Expense" : "Add Expense"}
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
                      <Landmark size={12} className="text-blue-500" /> Session
                    </label>
                    <Controller 
                      name="session" 
                      control={control} 
                      rules={{ required: "Session is required" }}
                      render={({ field }) => (
                        <Select {...field} className="w-full h-[35px]" placeholder="Select Session"
                          options={sessions.map((s: any) => ({ value: s.id, label: s.session_year || s.name }))} 
                        />
                      )} 
                    />
                  </FormItem>

                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <FileText size={12} className="text-indigo-500" /> Expense Title
                    </label>
                    <Controller 
                      name="title" 
                      control={control} 
                      rules={{ required: "Title is required" }}
                      render={({ field }) => (
                        <Input {...field} className="h-[35px]" placeholder="e.g. Monthly Internet Bill" />
                      )} 
                    />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Changed from Select to Input for text typing */}
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Tag size={12} className="text-slate-500" /> Expense Type
                    </label>
                    <Controller 
                      name="expense_type" 
                      control={control} 
                      rules={{ required: "Expense type is required" }}
                      render={({ field }) => (
                        <Input {...field} className="h-[35px]" placeholder="e.g. Rent, Salary, Bill" />
                      )} 
                    />
                  </FormItem>

                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <IndianRupee size={12} className="text-emerald-500" /> Amount
                    </label>
                    <Controller 
                      name="amount" 
                      control={control} 
                      rules={{ required: "Amount is required" }}
                      render={({ field }) => (
                        <InputNumber 
                          {...field} 
                          className="w-full h-[35px]" 
                          min={0} 
                          placeholder="0.00" 
                          step="0.01" 
                          stringMode={false}
                        />
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
                      name="date" 
                      control={control} 
                      render={({ field }) => (
                        <div className="w-full relative dynamic-nepali-container [&>.ndp-container]:!z-[9999]">
                          <CalendarPicker   
                            // value={field.value || ""}
                             value={field.value ? adToBSValue(field.value) : new NepaliDate().format("YYYY-MM-DD")}  
                             
                            onChange={(date) => field.onChange(date)}
                            />
                        </div>
                      )} 
                    />
                  </FormItem>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update" : "Save"} Expense</span>
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