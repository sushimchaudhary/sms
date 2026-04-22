"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Save,
  Loader2,
  School,
  ShieldCheck,
} from "lucide-react";
import { ConfigProvider, Select, Switch } from "antd";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { UserServices } from "@/services/authServices";
import { CancelButton } from "@/components/ui/CancleButton";

// User Roles
enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  TEACHER = "teacher",
  STAFF = "staff",
  STUDENT = "student",
  PARENT = "parent",
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPERADMIN]: "Super Admin",
  [UserRole.ADMIN]: "School Admin",
  [UserRole.TEACHER]: "Teacher",
  [UserRole.STAFF]: "Staff",
  [UserRole.STUDENT]: "Student",
  [UserRole.PARENT]: "Parent",
};

interface RegisterFormProps {
  initialData?: any;
  onSuccess?: (data?: any) => void; 
  onClose: () => void;
  isOpen: boolean;
  schools?: { id: number | string; name: string }[];
}


interface IRegisterFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  school: string | number | null;
  password?: string;
  is_active: boolean;
}

export function RegisterForm({
  initialData,
  onSuccess,
  onClose,
  isOpen,
  schools = [],
}: RegisterFormProps) {
  const { primaryColor } = useTheme();
  const isUpdate = !!initialData;
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

 const form = useForm<IRegisterFormValues>({
  defaultValues: {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: UserRole.STUDENT,
    school: null,
    password: "",
    is_active: true,
  },
});

  // Modal खुल्दा वा initialData परिवर्तन हुँदा Form Reset गर्ने
  // useEffect(() => {
  //   if (isOpen) {
  //     if (initialData) {
  //       form.reset({
  //         ...initialData,
  //         // यदि backend बाट school object आएको छ भने ID मात्र निकाल्ने
  //         school: typeof initialData.school === "object" 
  //           ? (initialData.school?.id || initialData.school?._id) 
  //           : initialData.school,
  //       });
  //     } else {
  //       form.reset({
  //         first_name: "",
  //         last_name: "",
  //         email: "",
  //         phone: "",
  //         role: UserRole.STUDENT,
  //         school: null,
  //         password: "",
  //         is_active: true,
  //       });
  //     }
  //   }
  // }, [initialData, isOpen, form]);


  useEffect(() => {
  if (isOpen) {
    if (initialData) {
      form.reset({
        ...initialData,
        school: typeof initialData.school === "object" 
          ? (initialData.school?.id || initialData.school?._id) 
          : initialData.school,
      });
    } else {
      // Default reset values
      form.reset({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: UserRole.STUDENT,
        school: null,
        password: "",
        is_active: true,
      });
    }
  }
}, [initialData, isOpen, form]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const payload = { ...data };

      // Update गर्दा पासवर्ड खाली छ भने नपठाउने
      if (isUpdate && !payload.password) {
        delete payload.password;
      }

      let response;
      if (isUpdate && (initialData?.id || initialData?._id)) {
        const id = initialData.id || initialData._id;
        response = await UserServices.updateDetails(id, payload);
        toast.success("User updated successfully!");
      } else {
        response = await UserServices.createDetails(payload);
        toast.success("User registered successfully!");
      }

      if (onSuccess) onSuccess(response.data);
      onClose();
    } catch (error: any) {
      console.error("Submit Error:", error);
      const serverError = error.response?.data;
      if (serverError && typeof serverError === "object") {
        Object.keys(serverError).forEach((key) => {
          toast.error(`${key}: ${serverError[key]}`);
        });
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <>
      {/* Backdrop with Smooth Animation */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-2xl">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            <div className="w-full bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
              
              {/* Header */}
              <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus size={15} style={{ color: primaryColor }} />
                  {isUpdate ? "Edit User Account" : "Register New User"}
                </h2>
                <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform">
                  <X size={20} />
                </button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                  
                  {/* Row 1: Names */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormFieldControl form={form} name="first_name" label="First Name" placeholder="First Name" icon={<User size={12} />} />
                    <FormFieldControl form={form} name="last_name" label="Last Name" placeholder="Last Name" icon={<User size={12} />} />
                  </div>

                  {/* Row 2: Email & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormFieldControl form={form} name="email" label="Email (Username)" type="email" placeholder="email@school.com" icon={<Mail size={12} />} />
                    
                    <Controller
                      control={form.control}
                      name="phone"
                      rules={{
                        required: "Phone is required",
                        pattern: { value: /^\d{10}$/, message: "Must be 10 digits" }
                      }}
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem className="w-full">
                          <ThemedInput
                            {...field}
                            value={value}
                            label="Phone Number"
                            placeholder="98XXXXXXXX"
                            icon={<Phone size={12} />}
                            maxLength={10}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 10) onChange(val);
                            }}
                          />
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 3: Role & School */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase">Role</label>
                      <Controller
                        name="role"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            className="w-full h-[32px] text-xs"
                            options={Object.values(UserRole).map((r) => ({
                              label: ROLE_LABELS[r],
                              value: r,
                            }))}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                        <School size={12} className="text-gray-400" /> Assigned School
                      </label>
                      <Controller
                        name="school"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            showSearch
                            className="w-full h-[32px] text-xs"
                            placeholder="Search & Select School"
                            optionFilterProp="label"
                            options={schools.map((s) => ({ label: s.name, value: s.id }))}
                            dropdownStyle={{ borderRadius: '4px' }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Row 4: Password & Status */}
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="relative">
                      <FormFieldControl
                        form={form}
                        name="password"
                        label={isUpdate ? "Update Password (Optional)" : "Password"}
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        icon={<Lock size={12} />}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-[30px] text-gray-400"
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 h-[32px]">
                      <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                        <ShieldCheck size={12} /> Account Active
                      </span>
                      <Controller
                        name="is_active"
                        control={form.control}
                        render={({ field }) => (
                          <Switch size="small" checked={field.value} onChange={field.onChange} />
                        )}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <CancelButton onClick={onClose} disabled={loading} />
                    <ThemedButton type="submit" size="sm" disabled={loading}>
                      <div className="flex items-center gap-2">
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        <span>{isUpdate ? "Update Account" : "Create Account"}</span>
                      </div>
                    </ThemedButton>
                  </div>
                </form>
              </Form>
            </div>
          </ConfigProvider>
        </div>
      </div>
    </>
  );
}

// Reusable Field Control
const FormFieldControl = ({ form, name, label, icon, placeholder, type = "text" }: any) => (
  <Controller
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="w-full">
        <ThemedInput label={label} icon={icon} type={type} placeholder={placeholder} {...field} />
        <FormMessage className="text-[10px]" />
      </FormItem>
    )}
  />
);