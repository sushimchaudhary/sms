"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, Wallet, CalendarDays, Layers, Tag, IndianRupee, Repeat } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, InputNumber, Switch } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";

// Services (Yo services haru tapaile create garnu parne huncha)
import { FeeServices } from "@/services/feeServices"; 
import { SessionServices } from "@/services/sessionsServices";
import { ClassServices } from "@/services/classServices";
import useAuth from "@/lib/hooks/useAuth";

export default function FeeStructureForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState({ 
    sessions: [], 
    classes: [], 
    feeTypes: [] 
  });

  const form = useForm({
    defaultValues: { 
      session: null, 
      class_assigned: null, 
      fee_type: null, 
      amount: 0, 
      is_recurring: true,
      school: "" 
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ses, cls, fType] = await Promise.all([
          SessionServices.getSessions(),
          ClassServices.getAllClasses(),
          FeeServices.getAllFeeTypes(), // FeeType fetch garne service
        ]);
        const sessionsData = ses.results || ses;
        const classesData = cls.results || cls;
        const feeTypesData = fType.results || fType;
        setOptions({
          sessions: sessionsData,
          classes: classesData,
          feeTypes: feeTypesData,
        });

        if (!initialData) {
        const activeSession = sessionsData.find((s: any) => s.is_active === true);
        if (activeSession) {
          form.setValue("session", activeSession.id);
        }
      }
      } catch (err) {
        toast.error("Failed to load dependency data");
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        session: initialData?.session?.id || initialData?.session || null,
        class_assigned: initialData?.class_assigned?.id || initialData?.class_assigned || null,
        fee_type: initialData?.fee_type?.id || initialData?.fee_type || null,
        amount: initialData?.amount || 0,
        is_recurring: initialData?.is_recurring ?? true,
        school: String(loggedInUser?.school_id || ""),
      });
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      isUpdate 
        ? await FeeServices.updateFeeStructure(initialData.id, values)
        : await FeeServices.createFeeStructure(values);
      toast.success(isUpdate ? "Fee structure updated" : "Fee structure created successfully");
      onSuccess(); 
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Error occurred while saving fee structure");
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
                {isUpdate ? "Edit Fee Structure" : "Add New Fee Structure"}
              </h2>
              <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                {/* Session and Class Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><CalendarDays size={12} /> Academic Session</label>
                    <Controller name="session" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[33px]" placeholder="Select Session"
                        options={options.sessions.map((s: any) => ({ value: s.id, label: s.name }))} />
                    )} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><Layers size={12} /> Class</label>
                    <Controller name="class_assigned" control={form.control} render={({ field }) => (
                      <Select {...field} className="w-full h-[33px]" placeholder="Select Class"
                        options={[...options.classes].reverse().map((c: any) => ({ value: c.id, label: c.name }))} />
                    )} />
                  </FormItem>
                </div>

                {/* Fee Type and Amount Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><Tag size={12} /> Fee Type</label>
                    <Controller name="fee_type" control={form.control} render={({ field }) => (
                      <Select {...field} showSearch className="w-full h-[33px]" placeholder="e.g. Tuition Fee"
                        options={options.feeTypes.map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))} />
                    )} />
                  </FormItem>
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2"><IndianRupee size={12} className="text-emerald-500" /> Amount</label>
                    <Controller name="amount" control={form.control} render={({ field }) => (
                      <InputNumber {...field} className="w-full h-[33px]" placeholder="0.00" min={0} />
                    )} />
                  </FormItem>
                </div>

                {/* Recurring Switch */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                   <div className="p-2 bg-white rounded shadow-sm">
                      <Repeat size={16} className="text-blue-500" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[12px] font-bold text-gray-700">Recurring Payment</p>
                      <p className="text-[10px] text-gray-500">Enable if this fee repeats (Monthly/Yearly)</p>
                   </div>
                   <Controller name="is_recurring" control={form.control} render={({ field: { value, onChange } }) => (
                      <Switch checked={value} onChange={onChange} size="small" />
                   )} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update Structure" : "Save Structure"}</span>
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