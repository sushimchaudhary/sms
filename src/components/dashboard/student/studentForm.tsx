"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Calendar,
  Users,
  Camera,
} from "lucide-react";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, Select, DatePicker } from "antd"; // Added DatePicker
import { CancelButton } from "@/components/ui/CancleButton";
import { StudentServices } from "@/services/studentServices";
import { ParentServices } from "@/services/parentServices";
import useAuth from "@/lib/hooks/useAuth";
import cookies from "js-cookie";
import dayjs from "dayjs"; // Required for AntD 5 DatePicker

interface StudentFormValues {
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  school_id: string | number;
  parent: string | number | null;
  dob: any;
  gender: string | null;
  photo?: any;
}

export default function StudentForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: any) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StudentFormValues>({
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      school_id: "",
      parent: null,
      dob: null,
      gender: null,
      photo: null,
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  useEffect(() => {
    const fetchParents = async () => {
      try {
        const res = await ParentServices.getAllParents();
        setParents(res.results || res);
      } catch (err) {
        console.error("Failed to fetch parents", err);
      }
    };
    if (isOpen) fetchParents();
  }, [isOpen]);

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
         setPhotoPreview(initialData.photo_url || initialData.photo || null);

        form.reset({
          email: initialData.user_email || initialData.user?.email || "",
          first_name:
            initialData.first_name_display ||
            initialData.user?.first_name ||
            "",
          last_name:
            initialData.last_name_display || initialData.user?.last_name || "",
          school_id: currentSchoolId || "",
          parent: initialData.parent?.id || initialData.parent || null,
          // Convert string from API to dayjs for AntD
          dob: initialData.dob ? dayjs(initialData.dob) : null,
          gender: initialData.gender || null,
          password: "",
        });
      } else {
          setPhotoPreview(null);
        form.reset({
          email: "",
          first_name: "",
          last_name: "",
          school_id: currentSchoolId || "",
          parent: null,
          dob: null,
          gender: null,
          password: "",
        });
      }
    }
  }, [initialData, isOpen, loggedInUser, form]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
  
      form.setValue("photo", file); 
  
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = async (values: StudentFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // १. इमेल थप्नुहोस् (यो छुटेको थियो)
      formData.append("email", values.email || "");
      
      formData.append("first_name", values.first_name || "");
      formData.append("last_name", values.last_name || "");
      
      if (values.parent) {
        formData.append("parent", String(values.parent));
      }

      formData.append("dob", values.dob ? values.dob.format("YYYY-MM-DD") : "");
      formData.append("gender", values.gender || "");

      if (values.school_id) {
        formData.append("school", String(values.school_id));
      }

      if (values.photo && values.photo instanceof File) {
        formData.append("photo", values.photo);
      }

      // २. पासवर्ड चेक (Update मा नहुन सक्छ, तर New Registration मा अनिवार्य छ)
      if (values.password && values.password.trim() !== "") {
        formData.append("password", values.password);
      }

      if (isUpdate) {
        const studentId = initialData.id || initialData._id;
        await StudentServices.updateStudent(studentId, formData);
        toast.success("Student updated successfully");
      } else {
        if (!values.password) {
          toast.error("Password is required");
          setLoading(false);
          return;
        }
        await StudentServices.createStudent(formData);
        toast.success("Student registered successfully");
      }
      onSuccess();
      handleClose();
    } catch (err: any) {
      const serverErrors = err.response?.data;

      if (serverErrors) {
        if (typeof serverErrors === "object") {
          Object.keys(serverErrors).forEach((key) => {
            const errorValue = serverErrors[key];
            const message = Array.isArray(errorValue)
              ? errorValue[0]
              : errorValue;

            const fieldName =
              key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ");
            toast.error(`${fieldName}: ${message}`);
          });
        } else if (serverErrors.detail) {
          toast.error(serverErrors.detail);
        } else {
          toast.error("An error occurred on the server.");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }

      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: primaryColor,
                borderRadius: 4,

                controlOutlineWidth: 1,

                controlOutline: `${primaryColor}1A`,
              },
              components: {
                Input: {
                  activeBorderColor: primaryColor,
                },
                Select: {
                  colorPrimaryHover: primaryColor,
                },
              },
            }}
          >
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UserCircle size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit Student Profile" : "New Student Registration"}
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

                <div className="flex flex-col items-center justify-center pb-4 border-b border-dashed border-gray-200">
                  <div className="relative group">
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 transition-all group-hover:border-primary cursor-pointer hover:bg-gray-100"
                      style={{ borderColor: photoPreview ? primaryColor : '#e5e7eb' }}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={30} className="text-gray-300" />
                      )}
                    </div>
                
                   
                
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Upload Profile Photo (Max 5MB)</p>
                </div>
                
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
                    placeholder="student@example.com"
                    disabled={isUpdate}
                  />
                  <FormFieldControl
                    form={form}
                    name="password"
                    label={isUpdate ? "New Password" : "Password"}
                    icon={<Lock size={12} />}
                    placeholder="Password"
                    type="password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem className="w-full">
                    <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                      <Users size={12} /> Select Parent
                    </label>
                    <Controller
                      name="parent"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          showSearch
                          className="w-full h-[33px]"
                          placeholder="Search & Select Parent"
                          optionFilterProp="children"
                          options={parents.map((p: any) => ({
                            value: p.id,
                            label: `${p.first_name_display || p.user?.first_name} (${p.user_email || p.user?.email})`,
                          }))}
                        />
                      )}
                    />
                  </FormItem>

                  <div className="grid grid-cols-2 gap-2">
                    <FormItem className="w-full">
                      <label className="text-[12px] font-bold text-gray-700 mb-1 flex items-center gap-2">
                        <Calendar size={12} /> DOB
                      </label>
                      <Controller
                        name="dob"
                        control={form.control}
                        render={({ field }) => (
                          <DatePicker
                            {...field}
                            placeholder="YYYY-MM-DD"
                            className="w-full h-[33px]"
                            format="YYYY-MM-DD"
                            allowClear
                            panelRender={(panelNode) => (
                              <div
                                style={{
                                  transform: "scale(0.75)",
                                  transformOrigin: "top left",
                                  width: "133.33%",
                                  marginBottom: "-80px",
                                  marginRight: "-65px",
                                }}
                              >
                                {panelNode}
                              </div>
                            )}
                          />
                        )}
                      />
                    </FormItem>

                    <FormItem className="w-full">
                      <label className="text-[12px] font-bold text-gray-700 mb-1">
                        Gender
                      </label>
                      <Controller
                        name="gender"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            value={field.value === "" ? null : field.value}
                            className="w-full h-[33px]"
                            placeholder="--Select--"
                            options={[
                              { value: "Male", label: "Male" },
                              { value: "Female", label: "Female" },
                              { value: "Other", label: "Other" },
                            ]}
                          />
                        )}
                      />
                    </FormItem>
                  </div>
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

// Reuse your FormFieldControl component with Eye toggle...
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
