"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Fingerprint,
  UploadCloud,
  X,
  Save,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/context/ThemeContext";

interface CompanyFormProps {
  initialData?: any;
  onClose: () => void;
}

export default function CompanyForm({
  initialData,
  onClose,
}: CompanyFormProps) {
  const isUpdate = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { primaryColor } = useTheme();

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.logoUrl || null,
  );

  const form = useForm({
    defaultValues: initialData || {
      name: "",
      address: "",
      email: "",
      phone: "",
      pan: "",
    },
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  function onSubmit(data: any) {
    console.log(isUpdate ? "Updating..." : "Creating...", data);
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-3 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-800 ">
          {isUpdate ? "Update Company" : "Create Company"}
        </h2>
        <button
          onClick={onClose}
          type="button"
          className="text-red-500 hover:text-rose-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-3 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            
            {/* Company Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="py-1">
                  <FormControl>
                    <ThemedInput
                      label="Company Name"
                      placeholder="Enter name"
                      icon={<Building2 size={12} />}
                      error={form.formState.errors.name?.message as string}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="py-1">
                  <FormControl>
                    <ThemedInput
                      label="Official Email"
                      placeholder="email@domain.com"
                      icon={<Mail size={12} />}
                      error={form.formState.errors.email?.message as string}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="py-1 md:col-span-2">
                  <FormControl>
                    <ThemedInput
                      label="Location Address"
                      placeholder="Street, City, Country"
                      icon={<MapPin size={12} />}
                      error={form.formState.errors.address?.message as string}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="py-1">
                  <FormControl>
                    <ThemedInput
                      label="Phone Number"
                      placeholder="+977"
                      icon={<Phone size={12} />}
                      error={form.formState.errors.phone?.message as string}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* PAN */}
            <FormField
              control={form.control}
              name="pan"
              render={({ field }) => (
                <FormItem className="py-1">
                  <FormControl>
                    <ThemedInput
                      label="PAN / VAT Number"
                      placeholder="9-digit PAN"
                      icon={<Fingerprint size={12} />}
                      error={form.formState.errors.pan?.message as string}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Logo Upload Section */}
            <div className="md:col-span-2 mt-2">
              <label className="text-[11px] font-medium text-gray-400  block mb-1">
                 Company Logo
              </label>
              <div
                onClick={handleUploadClick}
                className="flex items-center gap-4 p-3 border-2 border-dashed border-gray-100 rounded bg-gray-50/50 hover:bg-white transition-all cursor-pointer group"
                style={{ borderColor: `${primaryColor}20` }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${primaryColor}20`)}
              >
                <div 
                  className="w-12 h-12 bg-white rounded border overflow-hidden flex items-center justify-center shrink-0"
                  style={{ color: primaryColor, borderColor: '#e5e7eb' }}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud size={20} />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-700 uppercase">
                    {previewUrl ? "Change Logo" : "Upload Logo"}
                  </span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-tighter">
                    Max 2MB (PNG, JPG)
                  </span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-5 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-1.5 rounded text-red-500 border border-red-500  text-[11px] font-medium  hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>

            <ThemedButton type="submit" size="sm" className="px-5">
              <Save size={12} />
              {isUpdate ? "Update" : "Save"}
            </ThemedButton>
          </div>
        </form>
      </Form>
    </div>
  );
}