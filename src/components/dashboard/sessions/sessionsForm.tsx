"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Calendar,
  GraduationCap,
  Save,
  Loader2,
  X,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import { ConfigProvider, DatePicker, Switch } from "antd";
import { CancelButton } from "@/components/ui/CancleButton";
import { SessionServices } from "@/services/sessionsServices";
import useAuth from "@/lib/hooks/useAuth";
import dayjs from "dayjs";
import { SchoolServices } from "@/services/schoolServices";
import cookies from "js-cookie";

interface SessionsFormValues {
  name: string;
  start_date: string;
  end_date: string;
  school: any;
  is_active: boolean;
}

export default function SessionsForm({
  initialData,
  onClose,
  onSuccess,
  isOpen,
}: {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}) {
  const isUpdate = !!initialData;
  const { primaryColor } = useTheme();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<SessionsFormValues>({
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
      school: "",
      is_active: true,
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const [schoolName, setSchoolName] = useState<string>("");

  useEffect(() => {
    const fetchSchoolName = async () => {
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;

      const schoolId =
        loggedInUser?.school_id ||
        loggedInUser?.school ||
        cookieUser?.school_id ||
        cookieUser?.school;

      if (!schoolId) return;

      try {
        const res = await SchoolServices.getSingleSchool(schoolId);
        const name =
          res?.data?.name ||
          res?.name ||
          res?.data?.school_name ||
          res?.school_name;
        setSchoolName(name || "");
      } catch {
        setSchoolName("");
      }
    };

    fetchSchoolName();
  }, [loggedInUser]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const schoolValue =
          schoolName ||
          (typeof initialData.school === "object"
            ? initialData.school?.name
            : "") ||
          "N/A";

        form.reset({
          name: initialData.name || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          school: schoolValue,
          is_active: initialData.is_active ?? true,
        });
      } else {
        form.reset({
          name: "",
          start_date: "",
          end_date: "",
          school: schoolName || "N/A",
          is_active: true,
        });
      }
    }
  }, [initialData, form, isOpen, schoolName]);
  const onSubmit = async (values: SessionsFormValues) => {
    setLoading(true);
    try {
      const sessionId = initialData?.id || initialData?._id;
      const payload = {
        name: values.name,
        start_date: values.start_date,
        end_date: values.end_date,
        is_active: values.is_active,
        school:
          initialData?.school?.id ||
          initialData?.school ||
          loggedInUser?.school_id ||
          loggedInUser?.school,
      };

      if (isUpdate) {
        await SessionServices.updateSession(sessionId, payload);
        toast.success("Session updated successfully!");
      } else {
        await SessionServices.createSession(payload);
        toast.success("Session created successfully!");
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

      // console.error("Submission error:", err);
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
        <div className="w-full max-w-2xl">
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
            <div className="w-full bg-white rounded shadow-md border border-gray-200 overflow-hidden font-mukta">
              <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardList size={15} style={{ color: primaryColor }} />
                  {isUpdate ? "Edit Session Details" : "Create New Session"}
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormFieldControl
                      form={form}
                      name="name"
                      label="Session Name"
                      placeholder="Academic Year 2026"
                      icon={<ClipboardList size={12} />}
                    />
                    <FormFieldControl
                      form={form}
                      name="school"
                      label="Assigned Institution"
                      icon={<GraduationCap size={12} />}
                      disabled={true}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" /> Start
                        Date
                      </label>
                      <Controller
                        name="start_date"
                        control={form.control}
                        render={({ field }) => (
                          <DatePicker
                            className="w-full h-[32px] text-xs"
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(date) =>
                              field.onChange(
                                date ? date.format("YYYY-MM-DD") : "",
                              )
                            }
                            format="YYYY-MM-DD"
                            getPopupContainer={() => document.body}
                            placement="bottomLeft"
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
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" /> End
                        Date
                      </label>
                      <Controller
                        name="end_date"
                        control={form.control}
                        render={({ field }) => (
                          <DatePicker
                            className="w-full h-[32px] text-xs"
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(date) =>
                              field.onChange(
                                date ? date.format("YYYY-MM-DD") : "",
                              )
                            }
                            format="YYYY-MM-DD"
                            getPopupContainer={() => document.body}
                            placement="bottomLeft"
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
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 h-[32px] mt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <ShieldCheck size={12} style={{ color: primaryColor }} />
                      Session Status (
                      {form.watch("is_active") ? "Active" : "Inactive"})
                    </span>
                    <Controller
                      name="is_active"
                      control={form.control}
                      render={({ field }) => (
                        <Switch
                          size="small"
                          checked={field.value}
                          onChange={field.onChange}
                          style={{
                            backgroundColor: field.value
                              ? primaryColor
                              : "#d1d5db",
                          }}
                        />
                      )}
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
                          {isUpdate ? "Update Session" : "Save Session"}
                        </span>
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

const FormFieldControl = ({
  form,
  name,
  label,
  icon,
  placeholder,
  type = "text",
  disabled = false,
}: any) => (
  <Controller
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="w-full">
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
