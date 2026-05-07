"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  X,
  School,
  Mail,
  Phone,
  Hash,
  MapPin,
  Save,
  Loader2,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { ConfigProvider, Switch } from "antd";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { SchoolServices } from "@/services/schoolServices";
import { CancelButton } from "@/components/ui/CancleButton";
import useAuth from "@/lib/hooks/useAuth";
import AuthContext from "@/lib/context/AuthContext";

interface ISchoolFormValues {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  logo?: any;
}

export default function SchoolForm({
  initialData,
  onSuccess,
  onClose,
  isOpen,
}: {
  initialData?: any;
  onSuccess?: () => void;
  onClose: () => void;
  isOpen: boolean;
}) {
  const { primaryColor } = useTheme();
  const isUpdate = !!initialData;
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
   const { user } = useContext(AuthContext);

  const form = useForm<ISchoolFormValues>({
    defaultValues: {
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      is_active: true,
      logo: null,
    },
  });

  const handleClose = () => {
    form.reset();
    setLogoPreview(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setLogoPreview(initialData.logo_url || initialData.logo || null);
        form.reset({
          name: initialData.name || "",
          code: initialData.code || "",
          address: initialData.address || "",
          phone: initialData.phone || "",
          email: initialData.email || "",
          is_active: initialData.is_active ?? true,
          logo: null,
        });
      } else {
        setLogoPreview(null);
        form.reset({
          name: "",
          code: "",
          address: "",
          phone: "",
          email: "",
          is_active: true,
          logo: null,
        });
      }
    }
  }, [initialData, isOpen, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo size should be less than 5MB");
        return;
      }
      form.setValue("logo", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: ISchoolFormValues) => {
    console.log("Current User Role:", user?.role);
  console.log("Submitting Data:", values);

  if (user?.role !== "superadmin" && !isUpdate) {
    toast.error("You don't have permission to register a school.");
    return;
  }
    setLoading(true);
    try {
      
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("code", values.code);
      formData.append("address", values.address);
      formData.append("phone", values.phone);
      formData.append("email", values.email);
      formData.append("is_active", String(values.is_active));

      if (values.logo && values.logo instanceof File) {
        formData.append("logo", values.logo);
      }

      if (isUpdate) {
        const schoolId = initialData.id || initialData._id;
        await SchoolServices.updateDetails(schoolId, formData);
        toast.success("School updated successfully!");
      } else {
        await SchoolServices.createDetails(formData);
        toast.success("School registered successfully!");
      }

      if (onSuccess) onSuccess();
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
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Modal Container */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
          <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <School size={15} style={{ color: primaryColor }} />
                {isUpdate ? "Edit School Details" : "New School Registration"}
              </h2>
              <button
                onClick={handleClose}
                className="text-red-500 hover:rotate-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-3 space-y-2">
                
                {/* Logo Upload Section */}
                <div className="flex flex-col items-center justify-center pb-2 border-b border-dashed border-gray-200">
                  <div className="relative group">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 transition-all group-hover:border-primary cursor-pointer hover:bg-gray-100"
                      style={{ borderColor: logoPreview ? primaryColor : "#e5e7eb" }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
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
                  <p className="text-[11px] text-gray-400 mt-2 font-bold uppercase">
                    School Logo (Max 5MB)
                  </p>
                </div>

                <FormFieldControl
                    form={form}
                    name="name"
                    label="School Name"
                    placeholder="Enter school name"
                    icon={<School size={12} />}
                  />


               {/* Form Fields - Grid Structure */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  
  <FormFieldControl
    form={form}
    name="address"
    label="Institution Address"
    placeholder="Full street address, City, District"
    icon={<MapPin size={12} />}
    type="textarea"
  />

                 <FormFieldControl
                    form={form}
                    name="email"
                    label="Email Address"
                    type="email"
                    placeholder="contact@school.com"
                    icon={<Mail size={12} />}
                  />

</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  
  {/* Phone Number */}
  <FormFieldControl
    form={form}
    name="phone"
    label="Phone Number"
    placeholder="98XXXXXXXX"
    icon={<Phone size={12} />}
  />

  {/* School Status */}
  <div
    className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-1.5 shadow-sm hover:border-gray-300 transition-all"
  >
    <div className="flex items-center gap-3">
      
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100"
        style={{ color: primaryColor }}
      >
        <ShieldCheck size={14} />
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wide">
          School Status
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {form.watch("is_active") ? "Active" : "Inactive"}
        </span>
      </div>
    </div>

    <Controller
      name="is_active"
      control={form.control}
      render={({ field }) => (
        <Switch
          size="small"
          checked={field.value}
          onChange={field.onChange}
        />
      )}
    />
  </div>

</div>

               

                

                {/* Footer Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <CancelButton onClick={handleClose} disabled={loading} />
                  <ThemedButton type="submit" size="sm" disabled={loading}>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Save size={12} />
                      )}
                      <span>{isUpdate ? "Update School" : "Register School"}</span>
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