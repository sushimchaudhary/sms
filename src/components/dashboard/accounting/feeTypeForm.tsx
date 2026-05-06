"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, Tag, Hash, CheckCircle2, Sparkles } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Input } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";

// Services
import { FeeServices } from "@/services/feeServices"; 
import useAuth from "@/lib/hooks/useAuth";

export default function FeeTypeForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: { 
      name: "", 
      code: "", 
      school: "" 
    }
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: initialData?.name || "",
        code: initialData?.code || "",
        school: String(loggedInUser?.school_id || ""),
      });
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Backend handles code generation if code is empty string
      const payload = {
        ...values,
        // Yadi user le code halyo bhane uppercase garne, nabhaye backend le aafai banaucha
        code: values.code ? values.code.toUpperCase().replace(/\s+/g, '_') : ""
      };

      if (isUpdate) {
        await FeeServices.updateFeeType(initialData.id, payload);
      } else {
        await FeeServices.createFeeType(payload);
      }
        
      toast.success(isUpdate ? "Fee type updated" : "Fee type created successfully");
      onSuccess(); 
      onClose();
    } catch (err: any) {
      // Backend unique_together logic le error pathaye ma handle garne
      const errorMsg = err.response?.data?.non_field_errors?.[0] || 
                       err.response?.data?.code?.[0] || 
                       "Error occurred while saving fee type";
      toast.error(errorMsg);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <>
      <div 
        onClick={onClose} 
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} 
      />
      
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="w-full max-w-md bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Tag size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Fee Type" : "Add New Fee Type"}
              </h2>
              <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                
                {/* Fee Type Name */}
                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-500" /> Fee Type Name
                  </label>
                  <Controller 
                    name="name" 
                    control={form.control} 
                    rules={{ required: "Fee Type name is required" }}
                    render={({ field, fieldState }) => (
                      <>
                        <Input 
                          {...field} 
                          className={`h-[35px] ${fieldState.error ? 'border-red-500' : ''}`} 
                          placeholder="e.g. Tuition Fee" 
                        />
                        {fieldState.error && <p className="text-[10px] text-red-500 mt-0.5">{fieldState.error.message}</p>}
                      </>
                    )} 
                  />
                </FormItem>

                {/* Fee Type Code */}
                {/* <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Hash size={12} className="text-blue-500" /> Unique Code
                  </label>
                  <Controller 
                    name="code" 
                    control={form.control} 
                    // Required hataidiyeu kinabhane Backend le auto-generate garcha
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        className="h-[35px]" 
                        placeholder="e.g. TUITION (Optional)" 
                        style={{ textTransform: 'uppercase' }}
                      />
                    )} 
                  />
                  <div className="flex items-start gap-1 mt-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                    <Sparkles size={12} className="text-amber-500 mt-0.5" />
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Leave blank to auto-generate. Backend will create a unique code like 
                      <strong> {form.watch('name') ? form.watch('name').toUpperCase().replace(/\s+/g, '_') : "FEE_CODE"}</strong>.
                    </p>
                  </div>
                </FormItem> */}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update Type" : "Save Type"}</span>
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