// "use client";

// import React, { useState, useEffect } from "react";
// import { useForm, Controller } from "react-hook-form";
// import {
//   X,
//   School,
//   Mail,
//   Phone,
//   Hash,
//   MapPin,
//   Save,
//   Loader2,
//   ShieldCheck,
// } from "lucide-react";
// import { ConfigProvider, Switch } from "antd";
// import { Form, FormItem, FormMessage } from "@/components/ui/form";
// import { ThemedButton } from "@/components/ui/themedButton";
// import { ThemedInput } from "@/components/ui/ThemedInput";
// import { useTheme } from "@/lib/context/ThemeContext";
// import { toast } from "sonner";
// import { SchoolServices } from "@/services/schoolServices";
// import { CancelButton } from "@/components/ui/CancleButton";

// export function SchoolForm({
//   initialData,
//   onSuccess,
//   onClose,
//   isOpen,
// }: {
//   initialData?: any;
//   onSuccess?: () => void;
//   onClose: () => void;
//   isOpen: boolean;
// }) {
//   const { primaryColor } = useTheme();
//   const isUpdate = !!initialData;
//   const [loading, setLoading] = useState(false);

//   const form = useForm({
//     defaultValues: initialData || {
//       name: "",
//       code: "",
//       address: "",
//       phone: "",
//       email: "",
//       is_active: true,
//     },
//   });

//   useEffect(() => {
//     if (initialData) form.reset(initialData);
//   }, [initialData, form]);

//   const onSubmit = async (data: any) => {
//     try {
//       setLoading(true);
//       let response;
//       if (isUpdate && initialData?.id) {
//         response = await SchoolServices.updateDetails(initialData.id, data);
//         toast.success("School updated successfully!");
//       } else {
//         response = await SchoolServices.createDetails(data);
//         toast.success("School registered successfully!");
//       }
//       if (onSuccess) onSuccess();
//       onClose();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <div
//         onClick={onClose}
//         className={`fixed inset-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
//       />

//       <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
//         <div className={`w-full max-w-2xl bg-white rounded shadow-md border border-gray-200 overflow-hidden transition-all duration-300 ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
//           <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4 } }}>
//             <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
//               <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
//                 <School size={15} style={{ color: primaryColor }} />
//                 {isUpdate ? "Edit School Details" : "Register New School"}
//               </h2>
//               <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform">
//                 <X size={20} />
//               </button>
//             </div>

//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <FormFieldControl form={form} name="name" label="School Name" placeholder="E.g. Edify International" icon={<School size={12} />} />
//                   <FormFieldControl form={form} name="code" label="School Code" placeholder="SCH001" icon={<Hash size={12} />} />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormFieldControl form={form} name="email" label="Email Address" type="email" placeholder="contact@school.com" icon={<Mail size={12} />} />
//                   <FormFieldControl form={form} name="phone" label="Phone Number" placeholder="01-XXXXXXX" icon={<Phone size={12} />} />
//                 </div>

//                 <div className="space-y-1">
//                   <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
//                     <MapPin size={12} /> Address
//                   </label>
//                   <Controller
//                     name="address"
//                     control={form.control}
//                     render={({ field }) => (
//                       <textarea
//                         {...field}
//                         className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none min-h-[80px]"
//                         placeholder="Full street address..."
//                       />
//                     )}
//                   />
//                 </div>

//                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 h-[32px]">
//                   <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
//                     <ShieldCheck size={12} /> School Status (Active)
//                   </span>
//                   <Controller
//                     name="is_active"
//                     control={form.control}
//                     render={({ field }) => (
//                       <Switch size="small" checked={field.value} onChange={field.onChange} />
//                     )}
//                   />
//                 </div>

//                 <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
//                   <CancelButton onClick={onClose} disabled={loading} />
//                   <ThemedButton type="submit" size="sm" disabled={loading}>
//                     <div className="flex items-center gap-2">
//                       {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
//                       <span>{isUpdate ? "Update School" : "Save School"}</span>
//                     </div>
//                   </ThemedButton>
//                 </div>
//               </form>
//             </Form>
//           </ConfigProvider>
//         </div>
//       </div>
//     </>
//   );
// }

// const FormFieldControl = ({ form, name, label, icon, placeholder, type = "text" }: any) => (
//   <Controller
//     control={form.control}
//     name={name}
//     render={({ field }) => (
//       <FormItem className="w-full">
//         <ThemedInput label={label} icon={icon} type={type} placeholder={placeholder} {...field} />
//         <FormMessage className="text-[10px]" />
//       </FormItem>
//     )}
//   />
// );


"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { ConfigProvider, Switch } from "antd";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { SchoolServices } from "@/services/schoolServices";
import { CancelButton } from "@/components/ui/CancleButton";

interface ISchoolFormValues {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export function SchoolForm({
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

  const form = useForm<ISchoolFormValues>({
    defaultValues: {
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      is_active: true,
    },
  });

  // Modal खुल्दा वा initialData फेरिँदा Form Reset गर्ने logic
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          ...initialData,
        });
      } else {
        form.reset({
          name: "",
          code: "",
          address: "",
          phone: "",
          email: "",
          is_active: true,
        });
      }
    }
  }, [initialData, isOpen, form]);

  // const onSubmit = async (data: ISchoolFormValues) => {
  //   try {
  //     setLoading(true);
  //     const schoolId = initialData?.id || initialData?._id;

  //     if (isUpdate && schoolId) {
  //       await SchoolServices.updateDetails(schoolId, data);
  //       toast.success("School updated successfully!");
  //     } else {
  //       await SchoolServices.createDetails(data);
  //       toast.success("School registered successfully!");
  //     }

  //     if (onSuccess) onSuccess();
  //     onClose();
  //   } catch (error: any) {
  //     console.error("Submit Error:", error);
  //     const serverError = error.response?.data;
  //     if (serverError && typeof serverError === "object") {
  //       Object.keys(serverError).forEach((key) => {
  //         toast.error(`${key}: ${serverError[key]}`);
  //       });
  //     } else {
  //       toast.error("An unexpected error occurred.");
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };


    const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      let response;
      if (isUpdate && initialData?.id) {
        response = await SchoolServices.updateDetails(initialData.id, data);
        toast.success("School updated successfully!");
      } else {
        response = await SchoolServices.createDetails(data);
        toast.success("School registered successfully!");
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
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

      {/* Modal Container */}
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
                  <School size={15} style={{ color: primaryColor }} />
                  {isUpdate ? "Edit School Details" : "Register New School"}
                </h2>
                <button onClick={onClose} className="text-red-500 hover:rotate-90 transition-transform">
                  <X size={20} />
                </button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                  
                  {/* Row 1: Name & Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormFieldControl 
                      form={form} 
                      name="name" 
                      label="School Name" 
                      placeholder="E.g. Edify International" 
                      icon={<School size={12} />} 
                    />
                    <FormFieldControl 
                      form={form} 
                      name="code" 
                      label="School Code" 
                      placeholder="SCH001" 
                      icon={<Hash size={12} />} 
                    />
                  </div>

                  {/* Row 2: Email & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormFieldControl 
                      form={form} 
                      name="email" 
                      label="Email Address" 
                      type="email" 
                      placeholder="contact@school.com" 
                      icon={<Mail size={12} />} 
                    />
                    <FormFieldControl 
                      form={form} 
                      name="phone" 
                      label="Phone Number" 
                      placeholder="01XXXXXXX" 
                      icon={<Phone size={12} />} 
                    />
                  </div>

                  {/* Row 3: Address */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" /> Institution Address
                    </label>
                    <Controller
                      name="address"
                      control={form.control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none min-h-[80px] transition-all hover:border-gray-300"
                          placeholder="Full street address, City, District"
                        />
                      )}
                    />
                  </div>

                  {/* Row 4: Status */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 h-[32px]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <ShieldCheck size={12} /> School Status (Active)
                    </span>
                    <Controller
                      name="is_active"
                      control={form.control}
                      render={({ field }) => (
                        <Switch size="small" checked={field.value} onChange={field.onChange} />
                      )}
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <CancelButton onClick={onClose} disabled={loading} />
                    <ThemedButton type="submit" size="sm" disabled={loading}>
                      <div className="flex items-center gap-2">
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        <span>{isUpdate ? "Update School" : "Save School"}</span>
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