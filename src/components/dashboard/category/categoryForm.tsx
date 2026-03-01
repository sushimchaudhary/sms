"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Layers, X, Save } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { ThemedButton } from "@/components/ui/themedButton";

interface CategoryFormProps {
  initialData?: any;
  onClose: () => void;
}

export default function CategoryForm({
  initialData,
  onClose,
}: CategoryFormProps) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();

  const form = useForm({
    defaultValues: initialData || {
      name: "",
      status: "active",
    },
  });

  function onSubmit(data: any) {
    console.log(
      isUpdate ? "Updating Category..." : "Creating Category...",
      data,
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-3 py-2 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-gray-800 ">
            {isUpdate ? "Update Category" : "Add New Category"}
          </h2>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="text-red-500 hover:text-rose-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-2 space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <ThemedInput
                    label="Category Name"
                    placeholder="e.g. Medicines"
                    icon={<Layers size={12} />}
                    error={form.formState.errors.name?.message as string}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[11px] font-medium text-gray-400  ">
                  Status
                </FormLabel>
                <div className="flex gap-6 ">
                  {["active", "inactive"].map((statusOption) => (
                    <label
                      key={statusOption}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        {...field}
                        value={statusOption}
                        checked={field.value === statusOption}
                        className="w-4 h-4 border-gray-300 focus:ring-offset-0"
                        style={{
                          accentColor: primaryColor,
                        }}
                      />
                      <span className="text-xs font-bold text-gray-600 uppercase group-hover:text-gray-900">
                        {statusOption}
                      </span>
                    </label>
                  ))}
                </div>
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-5 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-1.5 rounded text-red-500 border border-red-500  text-[11px] font-medium  hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>

            <ThemedButton type="submit" size="sm" className="px-5">
              <Save size={14} />
              {isUpdate ? "Update" : "Save"}
            </ThemedButton>
          </div>
        </form>
      </Form>
    </div>
  );
}
