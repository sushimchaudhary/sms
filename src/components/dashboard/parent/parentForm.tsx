"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  User,
  Save,
  Loader2,
  X,
  Mail,
  Lock,
  UserCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { ParentServices } from "@/services/parentServices";
import useAuth from "@/lib/hooks/useAuth";
import cookies from "js-cookie";

interface ParentFormValues {
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  school_id: string | number;
}

export default function ParentForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<ParentFormValues>({
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      school_id: "",
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;

      const currentSchoolId =
        initialData?.school?.id ||
        initialData?.school ||
        loggedInUser?.school_id ||
        loggedInUser?.school ||
        cookieUser?.school_id;

      if (initialData) {
        form.reset({
          email: initialData.user_email || initialData.user?.email || "",
          first_name: initialData.first_name_display || initialData.user?.first_name || "",
          last_name: initialData.last_name_display || initialData.user?.last_name || "",
          school_id: currentSchoolId || "",
          password: "",
        });
      } else {
        form.reset({
          email: "",
          first_name: "",
          last_name: "",
          password: "",
          school_id: currentSchoolId || "",
        });
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);

  

   const onSubmit = async (values: ParentFormValues) => {
      setLoading(true);
      try {
        const payload: any = {
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          
          school: values.school_id,
        };
  
        if (values.password && values.password.trim() !== "") {
          payload.password = values.password;
        }
  
        if (isUpdate) {
          const teacherId = initialData.id || initialData._id;
          await ParentServices.updateParent(teacherId, payload);
          toast.success("Parent updated successfully");
        } else {
          if (!values.password) {
            toast.error("Password is required");
            setLoading(false);
            return;
          }
          await ParentServices.createParent(payload);
          toast.success("Parent registered successfully");
        }
        onSuccess();
        handleClose();
    } catch (err: any) {
      const serverErrors = err.response?.data;

      if (serverErrors) {
        if (typeof serverErrors === "object" && !serverErrors.detail) {
          Object.keys(serverErrors).forEach((key) => {
            const errorValue = serverErrors[key];
            
            const message = Array.isArray(errorValue) ? errorValue[0] : errorValue;

            const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ");
            
            toast.error(`${fieldName}: ${message}`);
          });
        } 
        else if (serverErrors.detail) {
          toast.error(serverErrors.detail);
        } 
        else {
          toast.error("An error occurred on the server.");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }

      // console.error("Parent submission error:", err);
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
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider
            theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}
          >
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UserCircle size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Parent Profile" : "New Parent Registration"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldControl
                    form={form}
                    name="first_name"
                    label="First Name"
                    icon={<User size={12} />}
                    placeholder="Enter first name"
                  />
                  <FormFieldControl
                    form={form}
                    name="last_name"
                    label="Last Name"
                    icon={<User size={12} />}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldControl
                    form={form}
                    name="email"
                    label="Email Address"
                    icon={<Mail size={12} />}
                    placeholder="parent@example.com"
                    disabled={isUpdate}
                  />
                  <FormFieldControl
                    form={form}
                    name="password"
                    label={isUpdate ? "New Password" : "Password"}
                    icon={<Lock size={12} />}
                    placeholder={
                      isUpdate ? "Create new password" : "Create password"
                    }
                    type="password"
                  />
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
                        {isUpdate ? "Update Profile" : "Register Now"}
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

const FormFieldControl = ({
  form,
  name,
  label,
  icon,
  placeholder,
  disabled = false,
  type = "text",
}: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full relative">
          <ThemedInput
            label={label}
            icon={icon}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[32px] text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  );
};