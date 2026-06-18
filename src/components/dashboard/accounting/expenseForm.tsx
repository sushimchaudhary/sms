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
  bill_file?: FileList | string | null;
}

export default function ExpenseForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);

  const form = useForm<ExpenseFormValues>({
    defaultValues: {
      title: "",
      bill_file: null,
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
        bill_file: null,
        amount: Number(initialData?.amount) || 0,
        date: initialData?.date ? dayjs(initialData.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        session: initialData?.session?.id || initialData?.session || null,
        school: loggedInUser?.school_id || "",
      });
      setExistingFileUrl(initialData?.bill_file_url || null);
    }
  }, [initialData, isOpen, loggedInUser, reset]);

const onSubmit = async (values: ExpenseFormValues) => {
  // Guard against missing user info
  if (!loggedInUser?.school_id) {
    toast.error("School information is missing. Please log in again.");
    return;
  }

  setLoading(true);
  
  const formData = new FormData();
  formData.append("title", values.title);
  formData.append("expense_type", values.expense_type);
  formData.append("amount", values.amount.toString());
  formData.append("date", values.date || "");
  formData.append("session", values.session?.toString() || "");
  // Use the safe value
  formData.append("school", loggedInUser.school_id.toString());

  // Append file only if valid
  if (values.bill_file instanceof FileList && values.bill_file.length > 0) {
    formData.append("bill_file", values.bill_file[0]);
  }

  try {
    if (isUpdate) {
      await FeeServices.updateExpense(initialData.id, formData);
    } else {
      await FeeServices.createExpense(formData);
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
                
 <FormItem>
  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
    <FileText size={12} className="text-purple-500" /> Upload Bill
  </label>
  
  {/* यदि फाइल छ भने लिंक देखाउनुहोस् */}
  {existingFileUrl && (
    <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded text-[11px] flex justify-between items-center">
      <a href={existingFileUrl} target="_blank" className="text-blue-600 underline">
        View Current File
      </a>
      <button 
        type="button" 
        className="text-red-500" 
        onClick={() => setExistingFileUrl(null)}
      >
        Remove
      </button>
    </div>
  )}

  <input
    type="file"
    {...form.register("bill_file")}
    className="w-full h-[35px] border border-gray-300 rounded px-2 py-1 text-sm"
    accept="image/*,.pdf"
  />
</FormItem>

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
                      name="date" 
                      control={control} 
                      render={({ field }) => (
                        <div className="w-full relative dynamic-nepali-container">
                          <CalendarPicker 
                            value={field.value ? adToBSValue(field.value) : ""} 
                            onChange={(bsDate) => {
                              // bsDate (e.g., "2081-02-15") लाई AD मा कन्भर्ट गर्नुहोस्
                              const adDate = bsToADValue(bsDate); 
                              field.onChange(adDate); // अब यो "2024-05-28" जस्तो AD format मा जान्छ
                            }}
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