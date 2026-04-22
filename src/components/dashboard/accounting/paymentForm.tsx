"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Save, Loader2, X, Receipt, Wallet, CreditCard, IndianRupee } from "lucide-react";
import { Form, FormItem } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, InputNumber } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { FeeServices } from "@/services/feeServices";
import useAuth from "@/lib/hooks/useAuth";

export default function PaymentForm({ initialData, onClose, onSuccess, isOpen }: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ studentFees: [] as any[] });

  const form = useForm({
    defaultValues: {
      student_fee: null,
      amount: 0,
      payment_method: "cash",
      received_by: null,
    },
  });

  const { control, handleSubmit, reset, watch, setValue } = form;

  // १. Select गरिएको student_fee ID लाई watch गर्ने
  const selectedFeeId = watch("student_fee");

  // २. Dropdown मा student_fee सेलेक्ट गर्दा बाँकी रकम (Rem) अटो-फिल गर्ने logic
  useEffect(() => {
    if (selectedFeeId && options.studentFees.length > 0 && !isUpdate) {
      const selectedRecord = options.studentFees.find((f: any) => f.id === selectedFeeId);
      if (selectedRecord) {
        // बाँकी रहेको रकम (remaining_amount) लाई amount फिल्डमा सेट गरिदिने
        setValue("amount", Number(selectedRecord.remaining_amount) || 0);
      }
    }
  }, [selectedFeeId, options.studentFees, setValue, isUpdate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await FeeServices.getAllStudentFees();
        const allData = Array.isArray(res) ? res : res?.results || [];
        setOptions({ studentFees: allData });
      } catch (err) {
        toast.error("Failed to load fee records");
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      reset({
        student_fee: initialData?.student_fee?.id || initialData?.student_fee || null,
        amount: Number(initialData?.amount) || 0,
        payment_method: initialData?.payment_method || "cash",
        received_by: initialData?.received_by || loggedInUser?._id || null,
      });
    }
  }, [initialData, isOpen, loggedInUser, reset]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isUpdate) {
        await FeeServices.updatePayment(initialData.id, values);
      } else {
        await FeeServices.createPayment(values);
      }
      toast.success("Success!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Error processing payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-lg bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Receipt size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Payment" : "New Payment Entry"}
              </h2>
              <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                <FormItem>
                  <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Wallet size={12} className="text-blue-500" /> Select Fee Record
                  </label>
                  <Controller
                    name="student_fee"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        showSearch
                        className="w-full h-[35px]"
                        placeholder="Search Student Fee Record"
                        optionFilterProp="label"
                        options={options.studentFees.map((f: any) => ({
                          value: f.id,
                          label: `${f.student_name} - ${f.fee_type_name} (Rem: ${f.remaining_amount})`,
                        }))}
                      />
                    )}
                  />
                </FormItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <IndianRupee size={12} className="text-emerald-500" /> Amount
                    </label>
                    <Controller
                      name="amount"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <InputNumber {...field} className="w-full h-[35px]" min={1} placeholder="0.00" />
                      )}
                    />
                  </FormItem>

                  <FormItem>
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <CreditCard size={12} className="text-purple-500" /> Method
                    </label>
                    <Controller
                      name="payment_method"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full h-[35px]"
                          options={[
                            { value: "cash", label: "Cash" },
                            { value: "esewa", label: "eSewa" },
                            { value: "khalti", label: "Khalti" },
                             { value: "Bank Transfer", label: "Bank Transfer" },
                          ]}
                        />
                      )}
                    />
                  </FormItem>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={onClose} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>{isUpdate ? "Update" : "Collect"}</span>
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