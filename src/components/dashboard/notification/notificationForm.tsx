"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Bell, Save, Loader2, X, Type, AlignLeft, Users } from "lucide-react";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import useAuth from "@/lib/hooks/useAuth";
import { NotificationServices } from "@/services/notificationServices";
import { useNotifications } from "@/lib/context/NotificationContext";

interface NotificationFormValues {
  title: string;
  message: string;
  target_role: string;
  school_id: string | number;
  is_broadcast: boolean;
}

export default function NotificationForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { refreshNotifications } = useNotifications();

  const form = useForm<NotificationFormValues>({
    defaultValues: {
      title: "",
      message: "",
      target_role: "all",
      school_id: "",
      is_broadcast: true,
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const currentSchoolId =
        initialData?.school?.id ||
        initialData?.school ||
        loggedInUser?.school_id ||
        loggedInUser?.school;

      if (initialData) {
        form.reset({
          title: initialData.title || "",
          message: initialData.message || "",
          target_role: initialData.target_role || "all",
          school_id: currentSchoolId || "",
          is_broadcast: initialData.is_broadcast ?? true,
        });
      } else {
        form.reset({
          title: "",
          message: "",
          target_role: "all",
          school_id: currentSchoolId || "",
          is_broadcast: true,
        });
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);

  const onSubmit = async (values: NotificationFormValues) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        message: values.message,
        target_role: values.target_role,
        school: values.school_id,
        is_broadcast: values.target_role === "all", // "all" select garda broadcast true garne logic
      };

      if (isUpdate) {
        const notificationId = initialData.id || initialData._id;
        await NotificationServices.updateNotification(notificationId, payload);
        toast.success("Notification updated successfully");
      } else {
        await NotificationServices.createNotification(payload);
        toast.success("Notification sent successfully");
      }
      refreshNotifications();
      onSuccess();
      handleClose();
    } catch (err: any) {
      const serverErrors = err.response?.data;
      if (serverErrors) {
        if (typeof serverErrors === "object" && !serverErrors.detail) {
          Object.keys(serverErrors).forEach((key) => {
            const errorValue = serverErrors[key];
            const message = Array.isArray(errorValue)
              ? errorValue[0]
              : errorValue;
            toast.error(`${key.replace("_", " ")}: ${message}`);
          });
        } else {
          toast.error(serverErrors.detail || "An error occurred");
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider
            theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}
          >
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Bell size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Notification" : "Send New Notification"}
              </h2>
              <button
                onClick={handleClose}
                className="text-red-500 hover:rotate-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="px-6 py-5 space-y-4"
              >
                {/* Title Field */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Notification Title Field */}
                  <FormFieldControl
                    form={form}
                    name="title"
                    label="Notification Title"
                    icon={<Type size={12} />}
                    placeholder="Enter notice title"
                  />

                  {/* Target Role Field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-gray-600 flex items-center gap-1">
                      <Users size={12} /> Target Audience
                    </label>
                    <Controller
                      control={form.control}
                      name="target_role"
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full h-8"
                          options={[
                            { value: "all", label: "All Users" },
                            { value: "student", label: "Students" },
                            { value: "teacher", label: "Teachers" },
                            { value: "parent", label: "Parents" },
                            { value: "staff", label: "Staff" },
                          ]}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-gray-600 flex items-center gap-1">
                    <AlignLeft size={12} /> Message
                  </label>
                  <Controller
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={4}
                        placeholder="Write your message here..."
                        className="w-full p-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                    )}
                  />
                  <FormMessage className="text-[10px]" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={handleClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Save size={12} />
                      )}
                      <span>
                        {isUpdate ? "Update Notice" : "Send Notification"}
                      </span>
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

// Reusable Field Control (Hajur ko code batai)
const FormFieldControl = ({
  form,
  name,
  label,
  icon,
  placeholder,
  disabled = false,
  type = "text",
}: any) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full relative">
          <ThemedInput
            label={label}
            icon={icon}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
          />
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  );
};
